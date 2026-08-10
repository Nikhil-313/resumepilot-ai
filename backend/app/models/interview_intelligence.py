import uuid
from datetime import datetime
from app.extensions import db

class InterviewPracticeRecommendation(db.Model):
    """Represents an adaptive practice recommendation based on historical interview weaknesses."""
    __tablename__ = 'interview_practice_recommendations'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    source_session_id = db.Column(db.String(36), db.ForeignKey('interview_sessions.id', ondelete='SET NULL'), nullable=True, index=True)

    category = db.Column(db.String(50), nullable=False, default='Technical') # 'Technical', 'Communication', 'Problem Solving', 'Confidence', 'Behavioral', 'General'
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    reason = db.Column(db.Text, nullable=True, default='')
    priority = db.Column(db.String(20), nullable=False, default='Medium') # 'High', 'Medium', 'Low'
    recommended_action = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending') # 'pending', 'in_progress', 'completed', 'dismissed'

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    source_session = db.relationship('InterviewSession', backref=db.backref('practice_recommendations', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'source_session_id': self.source_session_id,
            'category': self.category or 'Technical',
            'title': self.title,
            'description': self.description,
            'reason': self.reason or '',
            'priority': self.priority or 'Medium',
            'recommended_action': self.recommended_action,
            'status': self.status or 'pending',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f"<InterviewPracticeRecommendation {self.title} ({self.priority}) Status:{self.status}>"
