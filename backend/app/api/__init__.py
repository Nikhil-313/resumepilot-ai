from flask import Blueprint
from app.api.health import health_bp
from app.api.auth import auth_bp
from app.api.resumes import resumes_bp
from app.api.interview import interview_bp
from app.api.ats import ats_bp
from app.api.jobs import jobs_bp
from app.api.career import career_bp
from app.api.optimizer import optimizer_bp
from app.api.applications import applications_bp
from app.api.command_center import command_center_bp

def register_blueprints(app):
    """Register API blueprints with Flask app instance."""
    # Standard v1 API Blueprint prefix (/api/v1)
    v1_blueprint = Blueprint('api_v1', __name__, url_prefix='/api/v1')
    v1_blueprint.register_blueprint(health_bp)
    v1_blueprint.register_blueprint(auth_bp)
    v1_blueprint.register_blueprint(resumes_bp)
    v1_blueprint.register_blueprint(interview_bp)
    v1_blueprint.register_blueprint(ats_bp)
    v1_blueprint.register_blueprint(jobs_bp)
    v1_blueprint.register_blueprint(career_bp)
    v1_blueprint.register_blueprint(optimizer_bp)
    v1_blueprint.register_blueprint(applications_bp)
    v1_blueprint.register_blueprint(command_center_bp)
    app.register_blueprint(v1_blueprint)

    # Alias /api Blueprint prefix for direct routes
    top_api_blueprint = Blueprint('api_top', __name__, url_prefix='/api')
    top_api_blueprint.register_blueprint(resumes_bp)
    top_api_blueprint.register_blueprint(interview_bp)
    top_api_blueprint.register_blueprint(ats_bp)
    top_api_blueprint.register_blueprint(jobs_bp)
    top_api_blueprint.register_blueprint(career_bp)
    top_api_blueprint.register_blueprint(optimizer_bp)
    top_api_blueprint.register_blueprint(applications_bp)
    top_api_blueprint.register_blueprint(command_center_bp)
    app.register_blueprint(top_api_blueprint)
