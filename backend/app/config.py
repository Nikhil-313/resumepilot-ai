import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

# Known weak development secrets and placeholders that must never be used in production
KNOWN_INSECURE_SECRETS = {
    'default_dev_secret_key_change_me',
    'dev_secret_key_change_in_production',
    'super_secret_jwt_key_dev',
    'change_this_in_production_super_secret_jwt_key',
    'change_this_to_a_strong_random_secret',
    'change_this_to_a_different_strong_random_secret',
    'secret',
    'secretkey',
    'jwt_secret',
}

def get_cors_origins():
    """Parse CORS_ORIGINS from environment as a list of allowed origins."""
    cors_env = os.getenv('CORS_ORIGINS', '')
    if cors_env.strip():
        return [origin.strip() for origin in cors_env.split(',') if origin.strip()]
    # Default fallback for local development frontend servers
    return ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001']

class Config:
    """Base application configuration."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_dev_secret_key_change_me')

    # Database configuration with SQLite fallback for instant local dev testing
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'resumepilot_dev.db')
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)

    # Gemini AI API Key
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

    # File Upload Configuration
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 10 * 1024 * 1024)) # 10MB limit
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'uploads')
    ALLOWED_EXTENSIONS = {'pdf'}

    @classmethod
    def init_app(cls, app):
        """Hook for application configuration initialization."""
        pass


class DevelopmentConfig(Config):
    """Development environment configuration."""
    DEBUG = True


class ProductionConfig(Config):
    """Production environment configuration with strict secret validation."""
    DEBUG = False

    @classmethod
    def init_app(cls, app):
        """Validate that production secrets are explicitly configured and secure."""
        super().init_app(app)
        sec = (os.getenv('SECRET_KEY') or '').strip()
        jwt_sec = (os.getenv('JWT_SECRET_KEY') or '').strip()

        if not sec or sec in KNOWN_INSECURE_SECRETS:
            raise ValueError(
                "CRITICAL SECURITY ERROR: Production SECRET_KEY is missing, empty, or using an insecure development default. "
                "You must set a strong, unique SECRET_KEY environment variable in production."
            )

        if not jwt_sec or jwt_sec in KNOWN_INSECURE_SECRETS:
            raise ValueError(
                "CRITICAL SECURITY ERROR: Production JWT_SECRET_KEY is missing, empty, or using an insecure development default. "
                "You must set a strong, unique JWT_SECRET_KEY environment variable in production."
            )

        app.config['SECRET_KEY'] = sec
        app.config['JWT_SECRET_KEY'] = jwt_sec


class TestingConfig(Config):
    """Testing environment configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig,
}
