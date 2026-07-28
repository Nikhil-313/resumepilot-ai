from flask import Blueprint
from app.api.health import health_bp
from app.api.auth import auth_bp

def register_blueprints(app):
    """Register all API version 1 blueprints with Flask app."""
    v1_blueprint = Blueprint('api_v1', __name__, url_prefix='/api/v1')
    
    # Register feature blueprints
    v1_blueprint.register_blueprint(health_bp)
    v1_blueprint.register_blueprint(auth_bp)
    
    app.register_blueprint(v1_blueprint)
