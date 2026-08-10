import uuid
from datetime import datetime
from app.extensions import db

class JobPosting(db.Model):
    """Represents an available job opportunity in the platform."""
    __tablename__ = 'job_postings'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(150), nullable=False, index=True) # e.g. 'Software Engineer'
    company = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(150), nullable=False, default='Remote')
    experience_level = db.Column(db.String(50), nullable=False, default='Mid Level') # 'Fresher / Student', 'Entry Level', 'Mid Level', 'Senior Level'
    employment_type = db.Column(db.String(50), nullable=False, default='Full-time')
    salary_range = db.Column(db.String(100), nullable=True) # e.g. '$110,000 - $140,000'
    description = db.Column(db.Text, nullable=False)
    required_skills = db.Column(db.JSON, nullable=False, default=list) # e.g. ['Python', 'Flask', 'PostgreSQL']
    preferred_skills = db.Column(db.JSON, nullable=True, default=list) # e.g. ['Docker', 'Kubernetes', 'Redis']
    apply_url = db.Column(db.String(512), nullable=True, default=None)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        url = self.apply_url
        clean_url = url if (url and 'example.com' not in url.lower() and url != '#') else None
        return {
            'id': self.id,
            'title': self.title,
            'company': self.company,
            'location': self.location,
            'experience_level': self.experience_level,
            'employment_type': self.employment_type,
            'salary_range': self.salary_range or '',
            'description': self.description,
            'required_skills': self.required_skills or [],
            'preferred_skills': self.preferred_skills or [],
            'apply_url': clean_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<JobPosting {self.title} at {self.company}>"


class JobMatchReport(db.Model):
    """Represents a candidate's personalized AI match evaluation report for a specific JobPosting."""
    __tablename__ = 'job_match_reports'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    job_id = db.Column(db.String(36), db.ForeignKey('job_postings.id', ondelete='CASCADE'), nullable=False, index=True)
    resume_id = db.Column(db.String(36), db.ForeignKey('resumes.id', ondelete='SET NULL'), nullable=True)

    match_percentage = db.Column(db.Integer, nullable=False, default=0) # 0 - 100
    overall_suitability_score = db.Column(db.Integer, nullable=False, default=0) # 0 - 100
    experience_match = db.Column(db.String(50), nullable=True, default='Moderate') # High, Moderate, Low
    education_match = db.Column(db.String(50), nullable=True, default='High') # High, Moderate, Low
    certification_match = db.Column(db.String(50), nullable=True, default='Moderate') # High, Moderate, Low

    matching_skills = db.Column(db.JSON, nullable=True, default=list)
    missing_skills = db.Column(db.JSON, nullable=True, default=list)
    strengths = db.Column(db.JSON, nullable=True, default=list)
    areas_to_improve = db.Column(db.JSON, nullable=True, default=list)

    ai_career_fit_explanation = db.Column(db.Text, nullable=True, default='')
    recommended_learning_path = db.Column(db.JSON, nullable=True, default=list)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    job = db.relationship('JobPosting', backref=db.backref('match_reports', lazy=True, cascade='all, delete-orphan'))
    resume = db.relationship('Resume', backref=db.backref('job_match_reports', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'job_id': self.job_id,
            'resume_id': self.resume_id,
            'match_percentage': self.match_percentage or 0,
            'overall_suitability_score': self.overall_suitability_score or 0,
            'experience_match': self.experience_match or 'Moderate',
            'education_match': self.education_match or 'High',
            'certification_match': self.certification_match or 'Moderate',
            'matching_skills': self.matching_skills or [],
            'missing_skills': self.missing_skills or [],
            'strengths': self.strengths or [],
            'areas_to_improve': self.areas_to_improve or [],
            'ai_career_fit_explanation': self.ai_career_fit_explanation or '',
            'recommended_learning_path': self.recommended_learning_path or [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'job': self.job.to_dict() if self.job else None,
            'resume_filename': self.resume.filename if self.resume else None
        }

    def __repr__(self):
        return f"<JobMatchReport User:{self.user_id} Job:{self.job_id} Match:{self.match_percentage}%>"
