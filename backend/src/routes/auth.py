from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from src.extensions import db
from src.models import User, UserSettings, TokenBlocklist
from src.auth import generate_access_token, generate_refresh_token, decode_token

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not all([first_name, last_name, email, password]):
        return jsonify({'error': 'All fields are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        password_hash=generate_password_hash(password),
    )
    db.session.add(user)
    db.session.flush()

    settings = UserSettings(user_id=user.id, theme='dark')
    db.session.add(settings)
    db.session.commit()

    access_token = generate_access_token(user.id)
    refresh_token, _ = generate_refresh_token(user.id)

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'role': user.role,
        },
    }), 201


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401

    access_token = generate_access_token(user.id)
    refresh_token, _ = generate_refresh_token(user.id)

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'role': user.role,
        },
    })


@auth_bp.route('/api/auth/refresh', methods=['POST'])
def refresh():
    data = request.get_json()
    refresh_token = data.get('refresh_token', '')

    if not refresh_token:
        return jsonify({'error': 'Refresh token is required'}), 400

    payload = decode_token(refresh_token)
    if not payload or payload.get('type') != 'refresh':
        return jsonify({'error': 'Invalid or expired refresh token'}), 401

    jti = payload.get('jti')
    if TokenBlocklist.query.filter_by(jti=jti).first():
        return jsonify({'error': 'Token has been revoked'}), 401

    user = db.session.get(User, payload['sub'])
    if not user:
        return jsonify({'error': 'User not found'}), 401

    new_access_token = generate_access_token(user.id)

    return jsonify({
        'access_token': new_access_token,
    })


@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    data = request.get_json() or {}
    refresh_token = data.get('refresh_token', '')

    if refresh_token:
        payload = decode_token(refresh_token)
        if payload and payload.get('jti'):
            blocked = TokenBlocklist(jti=payload['jti'])
            db.session.add(blocked)
            db.session.commit()

    return jsonify({'message': 'Logged out successfully'})
