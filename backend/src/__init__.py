import os
from flask import Flask
from dotenv import load_dotenv

load_dotenv()


def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///cloudspace.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', './uploads')
    app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500 MB

    # Ensure upload directories exist
    upload_folder = app.config['UPLOAD_FOLDER']
    os.makedirs(os.path.join(upload_folder, 'files'), exist_ok=True)
    os.makedirs(os.path.join(upload_folder, 'avatars'), exist_ok=True)
    os.makedirs(os.path.join(upload_folder, 'previews'), exist_ok=True)

    # Init extensions
    from src.extensions import db, migrate, cors, limiter
    db.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)

    allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173').split(',')
    cors.init_app(app, resources={r"/api/*": {"origins": allowed_origins}})

    # Security headers
    @app.after_request
    def set_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response

    # Register blueprints
    from src.routes import register_blueprints
    register_blueprints(app)

    # Create tables and seed
    with app.app_context():
        from src.models import User, File, ActivityLog, UserSettings, TokenBlocklist  # noqa: F401
        db.create_all()
        from src.seed import seed_data
        seed_data()

    return app
