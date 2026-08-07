import uuid
from datetime import datetime
from app.extensions import db

class ATSAnalysis(db.Model):
    """Represents an ATS Resume vs Job Description comparison analysis."""
    __tablename__ = 'ats_analyses'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    resume_id = db.Column(db.String(36), db.ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False, index=True)

    job_title = db.Column(db.String(150), nullable=True, default='Target Role')
    company_name = db.Column(db.String(150), nullable=True, default='')
    job_description = db.Column(db.Text, nullable=False)

    # ATS Match Scores & Breakdown
    ats_score = db.Column(db.Integer, nullable=False, default=0) # 0 - 100
    keyword_match_score = db.Column(db.Integer, nullable=True, default=0) # 0 - 100
    experience_match_score = db.Column(db.Integer, nullable=True, default=0) # 0 - 100
    formatting_score = db.Column(db.Integer, nullable=True, default=0) # 0 - 100

    # Categorized Arrays & Analysis
    matching_keywords = db.Column(db.JSON, nullable=True, default=list)
    missing_keywords = db.Column(db.JSON, nullable=True, default=list)
    matching_skills = db.Column(db.JSON, nullable=True, default=list)
    missing_skills = db.Column(db.JSON, nullable=True, default=list)

    section_analysis = db.Column(db.JSON, nullable=True, default=dict)
    strengths = db.Column(db.JSON, nullable=True, default=list)
    weaknesses = db.Column(db.JSON, nullable=True, default=list)
    improvements = db.Column(db.JSON, nullable=True, default=list)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    resume = db.relationship('Resume', backref=db.backref('ats_analyses', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'resume_id': self.resume_id,
            'job_title': self.job_title or 'Target Role',
            'company_name': self.company_name or '',
            'job_description': self.job_description,
            'ats_score': self.ats_score or 0,
            'keyword_match_score': self.keyword_match_score or 0,
            'experience_match_score': self.experience_match_score or 0,
            'formatting_score': self.formatting_score or 0,
            'matching_keywords': self.matching_keywords or [],
            'missing_keywords': self.missing_keywords or [],
            'matching_skills': self.matching_skills or [],
            'missing_skills': self.missing_skills or [],
            'section_analysis': self.section_analysis or {},
            'strengths': self.strengths or [],
            'weaknesses': self.weaknesses or [],
            'improvements': self.improvements or [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resume_filename': self.resume.filename if self.resume else 'Resume'
        }

    def __repr__(self):
        return f"<ATSAnalysis {self.id} - Role: {self.job_title} - Score: {self.ats_score}%>"
