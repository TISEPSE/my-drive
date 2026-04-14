import jwt
import requests
import logging
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, redirect, current_app, g
from src.extensions import db
from src.models import GitHubConnection
from src.auth import login_required

logger = logging.getLogger(__name__)

github_bp = Blueprint('github', __name__)

GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
GITHUB_API_URL = 'https://api.github.com'


def _make_state(user_id):
    payload = {
        'sub': user_id,
        'purpose': 'github_oauth',
        'exp': datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def _decode_state(state):
    try:
        payload = jwt.decode(state, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        if payload.get('purpose') != 'github_oauth':
            return None
        return payload.get('sub')
    except Exception:
        return None


@github_bp.route('/api/github/auth-url', methods=['GET'])
@login_required
def get_auth_url():
    client_id = current_app.config.get('GITHUB_CLIENT_ID')
    if not client_id:
        return jsonify({'error': 'GitHub OAuth not configured'}), 503

    state = _make_state(g.current_user_id)
    callback_url = current_app.config.get('GITHUB_CALLBACK_URL', 'http://localhost:8080/api/github/callback')

    url = (
        f"{GITHUB_AUTH_URL}"
        f"?client_id={client_id}"
        f"&redirect_uri={callback_url}"
        f"&scope=repo,read:user"
        f"&state={state}"
    )
    return jsonify({'url': url})


@github_bp.route('/api/github/callback', methods=['GET'])
def callback():
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
    error = request.args.get('error')
    if error:
        return redirect(f"{frontend_url}/github?error=access_denied")

    code = request.args.get('code')
    state = request.args.get('state')

    if not code or not state:
        return redirect(f"{frontend_url}/github?error=invalid_request")

    user_id = _decode_state(state)
    if not user_id:
        return redirect(f"{frontend_url}/github?error=invalid_state")

    # Exchange code for access token
    client_id = current_app.config.get('GITHUB_CLIENT_ID')
    client_secret = current_app.config.get('GITHUB_CLIENT_SECRET')
    callback_url = current_app.config.get('GITHUB_CALLBACK_URL', 'http://localhost:8080/api/github/callback')

    try:
        token_res = requests.post(
            GITHUB_TOKEN_URL,
            headers={'Accept': 'application/json'},
            json={'client_id': client_id, 'client_secret': client_secret,
                  'code': code, 'redirect_uri': callback_url},
            timeout=10,
        )
        token_data = token_res.json()
        access_token = token_data.get('access_token')
        if not access_token:
            return redirect(f"{frontend_url}/github?error=token_exchange_failed")

        # Fetch GitHub user info
        user_res = requests.get(
            f"{GITHUB_API_URL}/user",
            headers={'Authorization': f'Bearer {access_token}',
                     'Accept': 'application/vnd.github.v3+json'},
            timeout=10,
        )
        gh_user = user_res.json()

        conn = GitHubConnection.query.filter_by(user_id=user_id).first()
        if conn:
            conn.access_token = access_token
            conn.github_user_id = str(gh_user['id'])
            conn.github_username = gh_user['login']
            conn.github_avatar_url = gh_user.get('avatar_url')
            conn.github_name = gh_user.get('name')
        else:
            conn = GitHubConnection(
                user_id=user_id,
                github_user_id=str(gh_user['id']),
                github_username=gh_user['login'],
                github_avatar_url=gh_user.get('avatar_url'),
                github_name=gh_user.get('name'),
                access_token=access_token,
            )
            db.session.add(conn)
        db.session.commit()
        logger.info('GitHub connected for user %s (@%s)', user_id, gh_user['login'])
        return redirect(f"{frontend_url}/github?connected=true")

    except Exception as e:
        logger.error('GitHub OAuth error: %s', e)
        return redirect(f"{frontend_url}/github?error=server_error")


@github_bp.route('/api/github/status', methods=['GET'])
@login_required
def status():
    conn = GitHubConnection.query.filter_by(user_id=g.current_user_id).first()
    if not conn:
        return jsonify({'connected': False})
    return jsonify({
        'connected': True,
        'username': conn.github_username,
        'name': conn.github_name,
        'avatar_url': conn.github_avatar_url,
    })


@github_bp.route('/api/github/repos', methods=['GET'])
@login_required
def list_repos():
    conn = GitHubConnection.query.filter_by(user_id=g.current_user_id).first()
    if not conn:
        return jsonify({'error': 'GitHub not connected'}), 403

    repos = []
    page = 1
    headers = {
        'Authorization': f'Bearer {conn.access_token}',
        'Accept': 'application/vnd.github.v3+json',
    }
    try:
        while page <= 5:
            res = requests.get(
                f"{GITHUB_API_URL}/user/repos",
                headers=headers,
                params={'per_page': 100, 'page': page, 'sort': 'updated', 'type': 'all'},
                timeout=15,
            )
            if res.status_code == 401:
                return jsonify({'error': 'GitHub token expired, please reconnect'}), 401
            data = res.json()
            if not isinstance(data, list) or not data:
                break
            for r in data:
                if r.get('owner', {}).get('login') != conn.github_username:
                    continue
                repos.append({
                    'id': r['id'],
                    'name': r['name'],
                    'full_name': r['full_name'],
                    'description': r.get('description'),
                    'html_url': r['html_url'],
                    'private': r['private'],
                    'fork': r.get('fork', False),
                    'language': r.get('language'),
                    'stargazers_count': r.get('stargazers_count', 0),
                    'forks_count': r.get('forks_count', 0),
                    'open_issues_count': r.get('open_issues_count', 0),
                    'topics': r.get('topics', []),
                    'updated_at': r.get('updated_at'),
                    'created_at': r.get('created_at'),
                    'default_branch': r.get('default_branch', 'main'),
                    'homepage': r.get('homepage') or None,
                })
            if len(data) < 100:
                break
            page += 1
    except requests.RequestException as e:
        logger.error('GitHub API error: %s', e)
        return jsonify({'error': 'Failed to reach GitHub API'}), 502

    return jsonify({
        'repos': repos,
        'total': len(repos),
    })


@github_bp.route('/api/github/disconnect', methods=['DELETE'])
@login_required
def disconnect():
    conn = GitHubConnection.query.filter_by(user_id=g.current_user_id).first()
    if conn:
        db.session.delete(conn)
        db.session.commit()
    return jsonify({'disconnected': True})
