import uuid
from datetime import datetime
from app.extensions import db

class CareerPlan(db.Model):
    """Represents a candidate's personalized AI Career Development Plan."""
    __tablename__ = 'career_plans'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    target_role = db.Column(db.String(150), nullable=False, default='Software Engineer')
    current_level = db.Column(db.String(50), nullable=False, default='Mid Level')
    overall_readiness_score = db.Column(db.Integer, nullable=False, default=0) # 0 to 100
    career_summary = db.Column(db.Text, nullable=True, default='')

    strengths = db.Column(db.JSON, nullable=True, default=list)
    skill_gaps = db.Column(db.JSON, nullable=True, default=list)
    recommended_projects = db.Column(db.JSON, nullable=True, default=list)
    interview_prep_recommendations = db.Column(db.JSON, nullable=True, default=list)
    ats_resume_recommendations = db.Column(db.JSON, nullable=True, default=list)
    career_progression_explanation = db.Column(db.Text, nullable=True, default='')

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    goals = db.relationship('CareerGoal', backref=db.backref('career_plan', lazy=True), cascade='all, delete-orphan')
    roadmap_skills = db.relationship('SkillRoadmap', backref=db.backref('career_plan', lazy=True), cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'target_role': self.target_role,
            'current_level': self.current_level,
            'overall_readiness_score': self.overall_readiness_score or 0,
            'career_summary': self.career_summary or '',
            'strengths': self.strengths or [],
            'skill_gaps': self.skill_gaps or [],
            'recommended_projects': self.recommended_projects or [],
            'interview_prep_recommendations': self.interview_prep_recommendations or [],
            'ats_resume_recommendations': self.ats_resume_recommendations or [],
            'career_progression_explanation': self.career_progression_explanation or '',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'goals': [g.to_dict() for g in self.goals] if self.goals else [],
            'roadmap': [r.to_dict() for r in self.roadmap_skills] if self.roadmap_skills else []
        }

    def __repr__(self):
        return f"<CareerPlan User:{self.user_id} Role:{self.target_role} Readiness:{self.overall_readiness_score}%>"


class CareerGoal(db.Model):
    """Represents a specific milestone career goal within a candidate's plan."""
    __tablename__ = 'career_goals'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    career_plan_id = db.Column(db.String(36), db.ForeignKey('career_plans.id', ondelete='CASCADE'), nullable=False, index=True)

    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True, default='')
    category = db.Column(db.String(50), nullable=False, default='Short-term') # 'Short-term', 'Medium-term', 'Long-term'
    priority = db.Column(db.String(20), nullable=False, default='Medium') # 'High', 'Medium', 'Low'
    status = db.Column(db.String(20), nullable=False, default='not_started') # 'not_started', 'in_progress', 'completed'
    target_date = db.Column(db.String(50), nullable=True, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'career_plan_id': self.career_plan_id,
            'title': self.title,
            'description': self.description or '',
            'category': self.category or 'Short-term',
            'priority': self.priority or 'Medium',
            'status': self.status or 'not_started',
            'target_date': self.target_date or '',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<CareerGoal {self.title} ({self.category}) Status:{self.status}>"


class SkillRoadmap(db.Model):
    """Represents a target skill in the candidate's personalized skill roadmap."""
    __tablename__ = 'skill_roadmaps'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    career_plan_id = db.Column(db.String(36), db.ForeignKey('career_plans.id', ondelete='CASCADE'), nullable=False, index=True)

    skill_name = db.Column(db.String(100), nullable=False)
    current_level = db.Column(db.String(50), nullable=False, default='Missing') # 'Missing', 'Beginner', 'Intermediate'
    target_level = db.Column(db.String(50), nullable=False, default='Proficient') # 'Proficient', 'Advanced'
    priority = db.Column(db.String(20), nullable=False, default='High') # 'High', 'Medium', 'Low'
    reason = db.Column(db.Text, nullable=True, default='')
    recommended_resources = db.Column(db.JSON, nullable=True, default=list)
    estimated_time = db.Column(db.String(50), nullable=True, default='2 weeks')
    status = db.Column(db.String(20), nullable=False, default='not_started') # 'not_started', 'in_progress', 'completed'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'career_plan_id': self.career_plan_id,
            'skill_name': self.skill_name,
            'current_level': self.current_level or 'Missing',
            'target_level': self.target_level or 'Proficient',
            'priority': self.priority or 'High',
            'reason': self.reason or '',
            'recommended_resources': self.recommended_resources or [],
            'estimated_time': self.estimated_time or '2 weeks',
            'status': self.status or 'not_started',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<SkillRoadmap {self.skill_name} Status:{self.status}>"
