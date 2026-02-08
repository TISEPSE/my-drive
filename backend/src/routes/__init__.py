from src.routes.drive import drive_bp
from src.routes.files import files_bp
from src.routes.dashboard import dashboard_bp
from src.routes.storage import storage_bp
from src.routes.settings import settings_bp


def register_blueprints(app):
    app.register_blueprint(drive_bp)
    app.register_blueprint(files_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(storage_bp)
    app.register_blueprint(settings_bp)
