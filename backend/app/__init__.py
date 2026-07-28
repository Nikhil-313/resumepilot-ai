import os
from flask import Flask
from app.config import config_by_name
from app.extensions import db, jwt, bcrypt, cors
from app.api import register_blueprints

def create_app(config_name=None):
    """Application factory for initializing the Flask app instance."""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name['default']))

    # Ensure uploads directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Initialize extensions with app instance
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Register API Blueprints
    register_blueprints(app)

    # Automatically create DB tables in development if needed
    with app.app_context():
        db.create_all()

    return app
