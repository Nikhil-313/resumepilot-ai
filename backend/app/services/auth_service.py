import re
from typing import Tuple, Dict, Any, Optional
from flask_jwt_extended import create_access_token, create_refresh_token
from app.extensions import db
from app.models.user import User

class AuthService:
    """Service layer handling user authentication logic, validation, and tokens."""

    @staticmethod
    def validate_email(email: str) -> bool:
        """Regex check for valid email format."""
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(email_regex, email))

    @classmethod
    def register_user(cls, data: dict) -> Tuple[Dict[str, Any], int]:
        """
        Register a new candidate user account.
        Validates email format, password strength, and uniqueness.
        """
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        full_name = data.get('full_name', '').strip()
        target_role = data.get('target_role', '').strip()
        experience_level = data.get('experience_level', '').strip()

        # Input validation
        if not email or not cls.validate_email(email):
            return {'error': 'A valid email address is required.'}, 400

        if not password or len(password) < 6:
            return {'error': 'Password must be at least 6 characters long.'}, 400

        if not full_name:
            return {'error': 'Full name is required.'}, 400

        # Check existing user
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return {'error': 'An account with this email address already exists.'}, 409

        # Create user
        try:
            user = User(
                email=email,
                full_name=full_name,
                target_role=target_role or None,
                experience_level=experience_level or None
            )
            user.set_password(password)

            db.session.add(user)
            db.session.commit()

            # Generate tokens
            access_token = create_access_token(identity=user.id)
            refresh_token = create_refresh_token(identity=user.id)

            return {
                'message': 'Account registered successfully.',
                'user': user.to_dict(),
                'access_token': access_token,
                'refresh_token': refresh_token
            }, 201

        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to register user: {str(e)}'}, 500

    @classmethod
    def authenticate_user(cls, data: dict) -> Tuple[Dict[str, Any], int]:
        """
        Authenticate user credentials and issue access/refresh JWT tokens.
        """
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return {'error': 'Email and password are required.'}, 400

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return {'error': 'Invalid email or password.'}, 401

        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        return {
            'message': 'Login successful.',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }, 200

    @classmethod
    def update_profile(cls, user_id: str, data: dict) -> Tuple[Dict[str, Any], int]:
        """
        Update candidate profile information (target role, experience, primary skills).
        """
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found.'}, 404

        if 'full_name' in data and data['full_name'].strip():
            user.full_name = data['full_name'].strip()

        if 'target_role' in data:
            user.target_role = data['target_role'].strip()

        if 'experience_level' in data:
            user.experience_level = data['experience_level'].strip()

        if 'primary_skills' in data and isinstance(data['primary_skills'], list):
            user.primary_skills = data['primary_skills']

        try:
            db.session.commit()
            return {
                'message': 'Profile updated successfully.',
                'user': user.to_dict()
            }, 200
        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to update profile: {str(e)}'}, 500
