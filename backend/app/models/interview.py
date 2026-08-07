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
    
    # Phase 4.3 Overall Evaluation Report Fields
    overall_score = db.Column(db.Integer, nullable=True, default=0) # 0 - 100
    technical_score = db.Column(db.Integer, nullable=True, default=0) # 0 - 100
    communication_score = db.Column(db.Integer, nullable=True, default=0) # 0 - 100
    problem_solving_score = db.Column(db.Integer, nullable=True, default=0) # 0 - 100
    confidence_score = db.Column(db.Integer, nullable=True, default=0) # 0 - 100
    strengths_summary = db.Column(db.JSON, nullable=True, default=list)
    weaknesses_summary = db.Column(db.JSON, nullable=True, default=list)
    recommendations = db.Column(db.JSON, nullable=True, default=list)
    evaluated_at = db.Column(db.DateTime, nullable=True)

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
            'overall_score': self.overall_score or 0,
            'technical_score': self.technical_score or 0,
            'communication_score': self.communication_score or 0,
            'problem_solving_score': self.problem_solving_score or 0,
            'confidence_score': self.confidence_score or 0,
            'strengths_summary': self.strengths_summary or [],
            'weaknesses_summary': self.weaknesses_summary or [],
            'recommendations': self.recommendations or [],
            'is_evaluated': self.evaluated_at is not None or (self.overall_score is not None and self.overall_score > 0),
            'evaluated_at': self.evaluated_at.isoformat() if self.evaluated_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'questions': [q.to_dict() for q in self.questions]
        }

    def __repr__(self):
        return f"<InterviewSession {self.id} - Role: {self.role} - Overall Score: {self.overall_score}>"


class InterviewQuestion(db.Model):
    """Represents a specific question within a mock interview session."""
    __tablename__ = 'interview_questions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = db.Column(db.String(36), db.ForeignKey('interview_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    question_number = db.Column(db.Integer, nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=True, default='Technical')
    candidate_answer = db.Column(db.Text, nullable=True, default='')

    # Phase 4.3 Question Evaluation Fields
    score = db.Column(db.Integer, nullable=True, default=0) # 0 - 10
    technical_accuracy = db.Column(db.String(50), nullable=True, default='Moderate')
    communication_clarity = db.Column(db.String(50), nullable=True, default='Moderate')
    completeness = db.Column(db.String(50), nullable=True, default='Moderate')
    confidence_level = db.Column(db.String(50), nullable=True, default='Moderate')
    feedback = db.Column(db.Text, nullable=True, default='')
    strengths = db.Column(db.JSON, nullable=True, default=list)
    weaknesses = db.Column(db.JSON, nullable=True, default=list)
    ideal_answer = db.Column(db.Text, nullable=True, default='')

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'question_number': self.question_number,
            'question_text': self.question_text,
            'category': self.category or 'Technical',
            'candidate_answer': self.candidate_answer or '',
            'score': self.score or 0,
            'technical_accuracy': self.technical_accuracy or 'Moderate',
            'communication_clarity': self.communication_clarity or 'Moderate',
            'completeness': self.completeness or 'Moderate',
            'confidence_level': self.confidence_level or 'Moderate',
            'feedback': self.feedback or '',
            'strengths': self.strengths or [],
            'weaknesses': [w for w in (self.weaknesses or []) if w],
            'ideal_answer': self.ideal_answer or '',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<InterviewQuestion {self.question_number} - Score: {self.score}/10>"
