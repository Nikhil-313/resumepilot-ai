import uuid
from datetime import datetime
from app.extensions import db

class Resume(db.Model):
    """Resume database model representing uploaded PDF documents and parsed AI data."""
    __tablename__ = 'resumes'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    filename = db.Column(db.String(255), nullable=False) # Original uploaded filename
    filepath = db.Column(db.String(512), nullable=False) # Stored server file path
    file_size = db.Column(db.Integer, nullable=True, default=0) # File size in bytes
    parsed_json = db.Column(db.JSON, nullable=True) # Gemini extracted structured JSON
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship back to User model
    user = db.relationship('User', backref=db.backref('resumes', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self) -> dict:
        """Serialize resume metadata and parsed JSON for API responses."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'filename': self.filename,
            'file_size': self.file_size or 0,
            'parsed_json': self.parsed_json or {},
            'is_parsed': self.parsed_json is not None and bool(self.parsed_json),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<Resume {self.id} ({self.filename}) - User {self.user_id}>"
