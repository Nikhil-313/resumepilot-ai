import uuid
from datetime import datetime
from app.extensions import db

class CareerProgress(db.Model):
    """Represents historical period progress snapshots (weekly/monthly)."""
    __tablename__ = 'career_progress'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    period_type = db.Column(db.String(20), nullable=False, default='weekly') # 'weekly', 'monthly'
    period_start = db.Column(db.String(20), nullable=False) # 'YYYY-MM-DD'
    period_end = db.Column(db.String(20), nullable=False) # 'YYYY-MM-DD'

    overall_progress = db.Column(db.Integer, nullable=False, default=0) # 0 to 100
    goals_completed = db.Column(db.Integer, nullable=False, default=0)
    goals_total = db.Column(db.Integer, nullable=False, default=0)
    skills_completed = db.Column(db.Integer, nullable=False, default=0)
    skills_total = db.Column(db.Integer, nullable=False, default=0)
    applications_count = db.Column(db.Integer, nullable=False, default=0)
    interviews_count = db.Column(db.Integer, nullable=False, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'period_type': self.period_type,
            'period_start': self.period_start,
            'period_end': self.period_end,
            'overall_progress': self.overall_progress or 0,
            'goals_completed': self.goals_completed or 0,
            'goals_total': self.goals_total or 0,
            'skills_completed': self.skills_completed or 0,
            'skills_total': self.skills_total or 0,
            'applications_count': self.applications_count or 0,
            'interviews_count': self.interviews_count or 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class ProgressTask(db.Model):
    """Represents an actionable progress execution task synchronized from existing modules."""
    __tablename__ = 'progress_tasks'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    source_type = db.Column(db.String(50), nullable=False, default='system') # 'career_goal', 'skill_roadmap', 'interview_recommendation', 'resume_recommendation', 'application_followup', 'system'
    source_id = db.Column(db.String(36), nullable=True, index=True)

    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True, default='')
    category = db.Column(db.String(50), nullable=False, default='Career') # 'Career', 'Skills', 'Resume', 'ATS', 'Interview', 'Jobs', 'Applications'
    priority = db.Column(db.String(20), nullable=False, default='Medium') # 'High', 'Medium', 'Low'
    status = db.Column(db.String(20), nullable=False, default='pending') # 'pending', 'in_progress', 'completed', 'dismissed'

    due_date = db.Column(db.String(50), nullable=True, default='')
    completed_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'source_type': self.source_type,
            'source_id': self.source_id,
            'title': self.title,
            'description': self.description or '',
            'category': self.category or 'Career',
            'priority': self.priority or 'Medium',
            'status': self.status or 'pending',
            'due_date': self.due_date or '',
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class ProgressMilestone(db.Model):
    """Represents a major career milestone calculated from candidate execution evidence."""
    __tablename__ = 'progress_milestones'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True, default='')
    category = db.Column(db.String(50), nullable=False, default='Career') # 'Career', 'Skills', 'Resume', 'ATS', 'Interview', 'Jobs', 'Applications'
    target_date = db.Column(db.String(50), nullable=True, default='')
    status = db.Column(db.String(20), nullable=False, default='upcoming') # 'upcoming', 'in_progress', 'completed', 'overdue'
    completion_percentage = db.Column(db.Integer, nullable=False, default=0) # 0 to 100

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description or '',
            'category': self.category or 'Career',
            'target_date': self.target_date or '',
            'status': self.status or 'upcoming',
            'completion_percentage': self.completion_percentage or 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
