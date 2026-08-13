import os
import logging
from flask import Flask, jsonify
from app.config import config_by_name
from app.extensions import db, jwt, bcrypt, cors
from app.api import register_blueprints

# Configure application logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)

def create_app(config_name=None):
    """Application factory for initializing the Flask app instance."""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    config_cls = config_by_name.get(config_name, config_by_name['default'])

    app.config.from_object(config_cls)

    # Invoke configuration initialization & validation hook
    if hasattr(config_cls, 'init_app'):
        config_cls.init_app(app)

    # Ensure uploads directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Initialize extensions with app instance
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Register API Blueprints
    register_blueprints(app)

    # Global JSON Error Handlers (prevents CORS Network Errors on HTML 500/404 responses)
    @app.errorhandler(500)
    def internal_server_error(e):
        app.logger.exception("Global 500 Internal Server Error caught")
        return jsonify({
            'error': f'Internal Server Error: {str(e.description if hasattr(e, "description") else e)}'
        }), 500

    @app.errorhandler(404)
    def not_found_error(e):
        return jsonify({'error': 'Requested API endpoint not found.'}), 404

    @app.errorhandler(400)
    def bad_request_error(e):
        return jsonify({'error': f'Bad Request: {str(e.description if hasattr(e, "description") else e)}'}), 400

    # Automatically create DB tables & seed sample data in development if needed
    with app.app_context():
        db.create_all()
        try:
            from app.services.job_service import JobService
            JobService.seed_jobs_if_empty()
        except Exception as err:
            app.logger.warning(f"Initial job seeding warning: {err}")

    return app
