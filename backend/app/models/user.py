import uuid
from datetime import datetime
from app.extensions import db, bcrypt

class User(db.Model):
    """User database model representing job seeker candidates."""
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    
    # Career Profile attributes
    target_role = db.Column(db.String(100), nullable=True) # e.g. 'Software Engineer'
    experience_level = db.Column(db.String(50), nullable=True) # e.g. 'Fresher', 'Entry', 'Mid', 'Senior'
    primary_skills = db.Column(db.JSON, nullable=True, default=list) # List of key tech stack tags
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password: str) -> None:
        """Hash and set the user's password using Bcrypt."""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password: str) -> bool:
        """Verify the user's password against the stored hash."""
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        """Serialize user object to dictionary format for JSON responses."""
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'target_role': self.target_role,
            'experience_level': self.experience_level,
            'primary_skills': self.primary_skills or [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.target_role or 'No Role'})>"
