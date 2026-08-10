import uuid
from datetime import datetime
from app.extensions import db

class CareerNotification(db.Model):
    """Represents a smart notification or alert for the candidate."""
    __tablename__ = 'career_notifications'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    notification_type = db.Column(db.String(50), nullable=False, default='SYSTEM') # 'ATS_ALERT', 'INTERVIEW_ALERT', 'APPLICATION_FOLLOWUP', 'CAREER_GOAL', 'SKILL_GAP', 'RESUME_ALERT', 'JOB_MATCH', 'SYSTEM'
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), nullable=False, default='Medium') # 'High', 'Medium', 'Low'

    related_entity_type = db.Column(db.String(50), nullable=True, default=None) # 'ats', 'interview', 'application', 'career', 'job'
    related_entity_id = db.Column(db.String(36), nullable=True, default=None)

    is_read = db.Column(db.Boolean, default=False, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'notification_type': self.notification_type or 'SYSTEM',
            'title': self.title,
            'message': self.message,
            'priority': self.priority or 'Medium',
            'related_entity_type': self.related_entity_type,
            'related_entity_id': self.related_entity_id,
            'is_read': bool(self.is_read),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<CareerNotification {self.title} ({self.priority}) Read:{self.is_read}>"
