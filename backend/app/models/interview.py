import uuid
from datetime import datetime
from app.extensions import db

class InterviewSession(db.Model):
    """Represents a candidate's mock interview session."""
    __tablename__ = 'interview_sessions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    resume_id = db.Column(db.String(36), db.ForeignKey('resumes.id', ondelete='SET NULL'), nullable=True)
    role = db.Column(db.String(100), nullable=False)
    difficulty = db.Column(db.String(50), nullable=False)
    total_questions = db.Column(db.Integer, nullable=False, default=5)
    status = db.Column(db.String(50), nullable=False, default='in_progress') # 'in_progress', 'completed'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    questions = db.relationship(
        'InterviewQuestion',
        backref='session',
        lazy=True,
        cascade='all, delete-orphan',
        order_by='InterviewQuestion.question_number'
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'resume_id': self.resume_id,
            'role': self.role,
            'difficulty': self.difficulty,
            'total_questions': self.total_questions,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'questions': [q.to_dict() for q in self.questions]
        }

    def __repr__(self):
        return f"<InterviewSession {self.id} - Role: {self.role} - Status: {self.status}>"


class InterviewQuestion(db.Model):
    """Represents a specific question within a mock interview session."""
    __tablename__ = 'interview_questions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = db.Column(db.String(36), db.ForeignKey('interview_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    question_number = db.Column(db.Integer, nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=True, default='Technical') # e.g. Technical, Behavioral, System Design
    candidate_answer = db.Column(db.Text, nullable=True, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'question_number': self.question_number,
            'question_text': self.question_text,
            'category': self.category or 'Technical',
            'candidate_answer': self.candidate_answer or '',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<InterviewQuestion {self.question_number} - Session: {self.session_id}>"
