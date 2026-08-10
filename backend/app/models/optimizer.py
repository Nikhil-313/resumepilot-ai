import uuid
from datetime import datetime
from app.extensions import db

class ResumeOptimization(db.Model):
    """Represents an AI Resume Improvement & Optimization session report."""
    __tablename__ = 'resume_optimizations'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    resume_id = db.Column(db.String(36), db.ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False, index=True)

    target_role = db.Column(db.String(150), nullable=False, default='Software Engineer')
    target_company = db.Column(db.String(150), nullable=True, default='')

    original_resume_snapshot = db.Column(db.JSON, nullable=True, default=dict)
    optimized_resume = db.Column(db.JSON, nullable=True, default=dict)

    # Scores (0 to 100)
    overall_improvement_score = db.Column(db.Integer, nullable=False, default=0)
    ats_improvement_score = db.Column(db.Integer, nullable=False, default=0)
    content_quality_score = db.Column(db.Integer, nullable=False, default=0)
    keyword_optimization_score = db.Column(db.Integer, nullable=False, default=0)
    impact_score = db.Column(db.Integer, nullable=False, default=0)

    # Resume Health Summary
    strengths = db.Column(db.JSON, nullable=True, default=list)
    weak_sections = db.Column(db.JSON, nullable=True, default=list)
    missing_keywords = db.Column(db.JSON, nullable=True, default=list)
    priority_improvements = db.Column(db.JSON, nullable=True, default=list)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    recommendations = db.relationship('ResumeRecommendation', backref=db.backref('optimization', lazy=True), cascade='all, delete-orphan')
    resume = db.relationship('Resume', backref=db.backref('optimizations', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'resume_id': self.resume_id,
            'target_role': self.target_role,
            'target_company': self.target_company or '',
            'original_resume_snapshot': self.original_resume_snapshot or {},
            'optimized_resume': self.optimized_resume or {},
            'overall_improvement_score': self.overall_improvement_score or 0,
            'ats_improvement_score': self.ats_improvement_score or 0,
            'content_quality_score': self.content_quality_score or 0,
            'keyword_optimization_score': self.keyword_optimization_score or 0,
            'impact_score': self.impact_score or 0,
            'strengths': self.strengths or [],
            'weak_sections': self.weak_sections or [],
            'missing_keywords': self.missing_keywords or [],
            'priority_improvements': self.priority_improvements or [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'recommendations': [r.to_dict() for r in self.recommendations] if self.recommendations else [],
            'resume_filename': self.resume.filename if self.resume else 'Resume'
        }

    def __repr__(self):
        return f"<ResumeOptimization {self.id} Role:{self.target_role} Score:{self.overall_improvement_score}%>"


class ResumeRecommendation(db.Model):
    """Represents an individual AI recommendation item for a specific resume section."""
    __tablename__ = 'resume_recommendations'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    optimization_id = db.Column(db.String(36), db.ForeignKey('resume_optimizations.id', ondelete='CASCADE'), nullable=False, index=True)

    section = db.Column(db.String(50), nullable=False) # e.g. 'summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'links'
    original_text = db.Column(db.Text, nullable=True, default='')
    suggested_text = db.Column(db.Text, nullable=False)
    reason = db.Column(db.Text, nullable=True, default='')
    priority = db.Column(db.String(20), nullable=False, default='Medium') # 'High', 'Medium', 'Low'
    recommendation_type = db.Column(db.String(50), nullable=False, default='rewrite') # 'rewrite', 'addition', 'formatting', 'keyword_placement'
    status = db.Column(db.String(20), nullable=False, default='pending') # 'pending', 'accepted', 'rejected'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'optimization_id': self.optimization_id,
            'section': self.section,
            'original_text': self.original_text or '',
            'suggested_text': self.suggested_text,
            'reason': self.reason or '',
            'priority': self.priority or 'Medium',
            'recommendation_type': self.recommendation_type or 'rewrite',
            'status': self.status or 'pending',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<ResumeRecommendation {self.section} ({self.status})>"
