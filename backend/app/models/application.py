import uuid
from datetime import datetime
from app.extensions import db

class JobApplication(db.Model):
    """Represents a candidate's job application record in the tracker."""
    __tablename__ = 'job_applications'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    job_id = db.Column(db.String(36), db.ForeignKey('job_postings.id', ondelete='SET NULL'), nullable=True, index=True)
    resume_id = db.Column(db.String(36), db.ForeignKey('resumes.id', ondelete='SET NULL'), nullable=True)

    job_title = db.Column(db.String(150), nullable=False)
    company_name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(150), nullable=True, default='Remote')
    employment_type = db.Column(db.String(50), nullable=True, default='Full-time')
    job_url = db.Column(db.String(512), nullable=True, default='#')
    source = db.Column(db.String(50), nullable=True, default='Job Matches')

    application_date = db.Column(db.String(50), nullable=True, default=lambda: datetime.utcnow().strftime('%Y-%m-%d'))
    current_stage = db.Column(db.String(50), nullable=False, default='Saved') # 'Saved', 'Applied', 'Assessment', 'Interview', 'Final Round', 'Offer', 'Rejected', 'Withdrawn'
    status = db.Column(db.String(50), nullable=False, default='Active') # 'Active', 'Successful', 'Rejected', 'Withdrawn'
    notes = db.Column(db.Text, nullable=True, default='')
    salary_range = db.Column(db.String(100), nullable=True, default='')
    match_percentage = db.Column(db.Integer, nullable=True, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    activities = db.relationship('ApplicationActivity', backref=db.backref('application', lazy=True), cascade='all, delete-orphan')
    followups = db.relationship('ApplicationFollowUp', backref=db.backref('application', lazy=True), cascade='all, delete-orphan')
    job = db.relationship('JobPosting', backref=db.backref('applications', lazy=True))
    resume = db.relationship('Resume', backref=db.backref('applications', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'job_id': self.job_id,
            'resume_id': self.resume_id,
            'job_title': self.job_title,
            'company_name': self.company_name,
            'location': self.location or 'Remote',
            'employment_type': self.employment_type or 'Full-time',
            'job_url': self.job_url or '#',
            'source': self.source or 'Job Matches',
            'application_date': self.application_date or '',
            'current_stage': self.current_stage or 'Saved',
            'status': self.status or 'Active',
            'notes': self.notes or '',
            'salary_range': self.salary_range or '',
            'match_percentage': self.match_percentage or 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'activities': [a.to_dict() for a in self.activities] if self.activities else [],
            'followups': [f.to_dict() for f in self.followups] if self.followups else [],
            'resume_filename': self.resume.filename if self.resume else None
        }

    def __repr__(self):
        return f"<JobApplication {self.job_title} at {self.company_name} ({self.current_stage})>"


class ApplicationActivity(db.Model):
    """Represents a timeline activity entry for a job application."""
    __tablename__ = 'application_activities'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = db.Column(db.String(36), db.ForeignKey('job_applications.id', ondelete='CASCADE'), nullable=False, index=True)

    activity_type = db.Column(db.String(50), nullable=False, default='Note') # 'Application', 'Assessment', 'Interview', 'Follow-up', 'Offer', 'Rejection', 'Note'
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True, default='')
    activity_date = db.Column(db.String(50), nullable=True, default=lambda: datetime.utcnow().strftime('%Y-%m-%d'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'application_id': self.application_id,
            'activity_type': self.activity_type or 'Note',
            'title': self.title,
            'description': self.description or '',
            'activity_date': self.activity_date or '',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ApplicationFollowUp(db.Model):
    """Represents a scheduled follow-up reminder for a job application."""
    __tablename__ = 'application_followups'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = db.Column(db.String(36), db.ForeignKey('job_applications.id', ondelete='CASCADE'), nullable=False, index=True)

    follow_up_date = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    notes = db.Column(db.Text, nullable=True, default='')
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'application_id': self.application_id,
            'follow_up_date': self.follow_up_date,
            'title': self.title,
            'notes': self.notes or '',
            'completed': bool(self.completed),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
