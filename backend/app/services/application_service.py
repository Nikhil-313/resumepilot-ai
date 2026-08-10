import logging
from typing import Tuple, Dict, Any, List
from datetime import datetime
from sqlalchemy import desc
from app.extensions import db
from app.models.application import JobApplication, ApplicationActivity, ApplicationFollowUp
from app.models.job import JobPosting, JobMatchReport
from app.models.resume import Resume
from app.ai.application_assistant_engine import generate_followup_with_gemini

logger = logging.getLogger(__name__)

STAGES = ['Saved', 'Applied', 'Assessment', 'Interview', 'Final Round', 'Offer', 'Rejected', 'Withdrawn']

class ApplicationService:
    """Service layer managing candidate job applications, stage tracking, activities, and follow-ups."""

    @classmethod
    def create_manual_application(cls, user_id: str, data: dict) -> Tuple[Dict[str, Any], int]:
        """Create a manual job application entry."""
        job_title = data.get('job_title', '').strip()
        company_name = data.get('company_name', '').strip()

        if not job_title or not company_name:
            return {'error': 'job_title and company_name are required.'}, 400

        try:
            app_record = JobApplication(
                user_id=user_id,
                job_title=job_title,
                company_name=company_name,
                location=data.get('location', 'Remote'),
                employment_type=data.get('employment_type', 'Full-time'),
                job_url=data.get('job_url', '#'),
                source=data.get('source', 'Manual Entry'),
                application_date=data.get('application_date') or datetime.utcnow().strftime('%Y-%m-%d'),
                current_stage=data.get('current_stage', 'Applied'),
                status=data.get('status', 'Active'),
                notes=data.get('notes', ''),
                salary_range=data.get('salary_range', ''),
                resume_id=data.get('resume_id')
            )
            db.session.add(app_record)
            db.session.flush()

            # Add initial activity log
            activity = ApplicationActivity(
                application_id=app_record.id,
                activity_type='Application',
                title=f"Application Created ({app_record.current_stage})",
                description=f"Created job application entry for {job_title} at {company_name}.",
                activity_date=app_record.application_date
            )
            db.session.add(activity)
            db.session.commit()

            logger.info(f"Successfully created manual application ID {app_record.id} for user {user_id}")
            return {'message': 'Application created successfully.', 'application': app_record.to_dict()}, 201

        except Exception as e:
            db.session.rollback()
            logger.exception("Failed to create manual application")
            return {'error': f'Failed to create application: {str(e)}'}, 500

    @classmethod
    def create_application_from_job(cls, user_id: str, job_id: str, resume_id: str = None) -> Tuple[Dict[str, Any], int]:
        """Create an application directly from an existing JobPosting."""
        job = JobPosting.query.get(job_id)
        if not job:
            return {'error': 'Job posting not found.'}, 404

        # Check for existing active application to prevent duplicate tracking
        existing = JobApplication.query.filter_by(user_id=user_id, job_id=job_id, status='Active').first()
        if existing:
            return {
                'message': 'Application already exists in tracker.',
                'application': existing.to_dict(),
                'already_exists': True
            }, 200

        # Fetch candidate match score & latest resume
        match_report = JobMatchReport.query.filter_by(user_id=user_id, job_id=job_id).first()
        match_pct = match_report.match_percentage if match_report else 0

        if not resume_id:
            latest_resume = Resume.query.filter_by(user_id=user_id).order_by(desc(Resume.created_at)).first()
            if latest_resume:
                resume_id = latest_resume.id

        try:
            app_record = JobApplication(
                user_id=user_id,
                job_id=job.id,
                resume_id=resume_id,
                job_title=job.title,
                company_name=job.company,
                location=job.location,
                employment_type=job.employment_type,
                job_url=job.apply_url or '#',
                source='Job Matches',
                application_date=datetime.utcnow().strftime('%Y-%m-%d'),
                current_stage='Saved',
                status='Active',
                salary_range=job.salary_range or '',
                match_percentage=match_pct,
                notes=f"Tracked from AI Job Matches module (Match score: {match_pct}%)."
            )
            db.session.add(app_record)
            db.session.flush()

            activity = ApplicationActivity(
                application_id=app_record.id,
                activity_type='Application',
                title="Saved from Job Matches",
                description=f"Tracked {job.title} at {job.company} with {match_pct}% AI match score.",
                activity_date=app_record.application_date
            )
            db.session.add(activity)
            db.session.commit()

            logger.info(f"Created application ID {app_record.id} from JobPosting {job_id} for user {user_id}")
            return {
                'message': 'Application added to tracker successfully.',
                'application': app_record.to_dict(),
                'already_exists': False
            }, 201

        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to create application from job {job_id}")
            return {'error': f'Failed to track job application: {str(e)}'}, 500

    @classmethod
    def get_user_applications(
        cls,
        user_id: str,
        stage: str = None,
        status: str = None,
        company: str = None,
        search: str = None,
        sort_by: str = 'updated_at'
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Fetch applications for candidate with optional filters and sorting."""
        query = JobApplication.query.filter_by(user_id=user_id)

        if stage and stage.strip() and stage != 'All Stages':
            query = query.filter(JobApplication.current_stage == stage.strip())

        if status and status.strip() and status != 'All Statuses':
            query = query.filter(JobApplication.status == status.strip())

        if company and company.strip():
            query = query.filter(JobApplication.company_name.ilike(f"%{company.strip()}%"))

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter((JobApplication.job_title.ilike(term)) | (JobApplication.company_name.ilike(term)))

        if sort_by == 'match_percentage':
            query = query.order_by(desc(JobApplication.match_percentage))
        elif sort_by == 'company':
            query = query.order_by(JobApplication.company_name)
        elif sort_by == 'application_date':
            query = query.order_by(desc(JobApplication.application_date))
        else:
            query = query.order_by(desc(JobApplication.updated_at))

        apps = query.all()
        return [a.to_dict() for a in apps], 200

    @classmethod
    def get_application_by_id(cls, user_id: str, application_id: str) -> Tuple[Dict[str, Any], int]:
        """Fetch single JobApplication with timeline activities & follow-ups."""
        app_record = JobApplication.query.filter_by(id=application_id, user_id=user_id).first()
        if not app_record:
            return {'error': 'Job application not found or access denied.'}, 404
        return {'application': app_record.to_dict()}, 200

    @classmethod
    def update_application(cls, user_id: str, application_id: str, data: dict) -> Tuple[Dict[str, Any], int]:
        """Update job application details."""
        app_record = JobApplication.query.filter_by(id=application_id, user_id=user_id).first()
        if not app_record:
            return {'error': 'Job application not found or access denied.'}, 404

        try:
            if 'job_title' in data: app_record.job_title = data['job_title']
            if 'company_name' in data: app_record.company_name = data['company_name']
            if 'location' in data: app_record.location = data['location']
            if 'employment_type' in data: app_record.employment_type = data['employment_type']
            if 'job_url' in data: app_record.job_url = data['job_url']
            if 'salary_range' in data: app_record.salary_range = data['salary_range']
            if 'application_date' in data: app_record.application_date = data['application_date']
            if 'notes' in data: app_record.notes = data['notes']
            if 'resume_id' in data: app_record.resume_id = data['resume_id']

            db.session.commit()
            return {'message': 'Application updated successfully.', 'application': app_record.to_dict()}, 200

        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to update application {application_id}")
            return {'error': f'Failed to update application: {str(e)}'}, 500

    @classmethod
    def update_application_stage(cls, user_id: str, application_id: str, stage: str, status: str = None) -> Tuple[Dict[str, Any], int]:
        """Update application pipeline stage and auto-update status & activity log."""
        if stage not in STAGES:
            return {'error': f'Invalid stage. Must be one of {STAGES}'}, 400

        app_record = JobApplication.query.filter_by(id=application_id, user_id=user_id).first()
        if not app_record:
            return {'error': 'Job application not found or access denied.'}, 404

        old_stage = app_record.current_stage

        try:
            app_record.current_stage = stage

            if status:
                app_record.status = status
            else:
                if stage == 'Offer':
                    app_record.status = 'Successful'
                elif stage == 'Rejected':
                    app_record.status = 'Rejected'
                elif stage == 'Withdrawn':
                    app_record.status = 'Withdrawn'
                else:
                    app_record.status = 'Active'

            activity_type = 'Interview' if 'Interview' in stage or stage == 'Final Round' else ('Offer' if stage == 'Offer' else ('Rejection' if stage == 'Rejected' else 'Application'))

            activity = ApplicationActivity(
                application_id=app_record.id,
                activity_type=activity_type,
                title=f"Stage Updated: {stage}",
                description=f"Moved application stage from '{old_stage}' to '{stage}'.",
                activity_date=datetime.utcnow().strftime('%Y-%m-%d')
            )
            db.session.add(activity)
            db.session.commit()

            return {'message': 'Application stage updated successfully.', 'application': app_record.to_dict()}, 200

        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to update stage for application {application_id}")
            return {'error': f'Failed to update stage: {str(e)}'}, 500

    @classmethod
    def add_activity(cls, user_id: str, application_id: str, data: dict) -> Tuple[Dict[str, Any], int]:
        """Log a timeline activity for an application."""
        app_record = JobApplication.query.filter_by(id=application_id, user_id=user_id).first()
        if not app_record:
            return {'error': 'Job application not found or access denied.'}, 404

        title = data.get('title', '').strip()
        if not title:
            return {'error': 'Activity title is required.'}, 400

        try:
            activity = ApplicationActivity(
                application_id=app_record.id,
                activity_type=data.get('activity_type', 'Note'),
                title=title,
                description=data.get('description', ''),
                activity_date=data.get('activity_date') or datetime.utcnow().strftime('%Y-%m-%d')
            )
            db.session.add(activity)
            db.session.commit()

            return {'message': 'Activity logged successfully.', 'activity': activity.to_dict()}, 201

        except Exception as e:
            db.session.rollback()
            logger.exception("Failed to add activity")
            return {'error': f'Failed to add activity: {str(e)}'}, 500

    @classmethod
    def create_followup(cls, user_id: str, application_id: str, data: dict) -> Tuple[Dict[str, Any], int]:
        """Create a scheduled follow-up reminder."""
        app_record = JobApplication.query.filter_by(id=application_id, user_id=user_id).first()
        if not app_record:
            return {'error': 'Job application not found or access denied.'}, 404

        title = data.get('title', '').strip()
        follow_up_date = data.get('follow_up_date', '').strip()

        if not title or not follow_up_date:
            return {'error': 'title and follow_up_date are required.'}, 400

        try:
            followup = ApplicationFollowUp(
                application_id=app_record.id,
                title=title,
                follow_up_date=follow_up_date,
                notes=data.get('notes', ''),
                completed=data.get('completed', False)
            )
            db.session.add(followup)
            db.session.commit()

            return {'message': 'Follow-up created successfully.', 'followup': followup.to_dict()}, 201

        except Exception as e:
            db.session.rollback()
            logger.exception("Failed to create follow-up")
            return {'error': f'Failed to create follow-up: {str(e)}'}, 500

    @classmethod
    def update_followup(cls, user_id: str, follow_up_id: str, data: dict) -> Tuple[Dict[str, Any], int]:
        """Update follow-up status or notes."""
        followup = ApplicationFollowUp.query.get(follow_up_id)
        if not followup:
            return {'error': 'Follow-up not found.'}, 404

        app_record = JobApplication.query.filter_by(id=followup.application_id, user_id=user_id).first()
        if not app_record:
            return {'error': 'Access denied.'}, 404

        try:
            if 'completed' in data: followup.completed = bool(data['completed'])
            if 'title' in data: followup.title = data['title']
            if 'notes' in data: followup.notes = data['notes']
            if 'follow_up_date' in data: followup.follow_up_date = data['follow_up_date']

            db.session.commit()
            return {'message': 'Follow-up updated successfully.', 'followup': followup.to_dict()}, 200

        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to update follow-up {follow_up_id}")
            return {'error': f'Failed to update follow-up: {str(e)}'}, 500

    @classmethod
    def delete_application(cls, user_id: str, application_id: str) -> Tuple[Dict[str, Any], int]:
        """Delete a job application."""
        app_record = JobApplication.query.filter_by(id=application_id, user_id=user_id).first()
        if not app_record:
            return {'error': 'Job application not found or access denied.'}, 404

        try:
            db.session.delete(app_record)
            db.session.commit()
            return {'message': 'Application deleted successfully.'}, 200
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to delete application {application_id}")
            return {'error': f'Failed to delete application: {str(e)}'}, 500

    @classmethod
    def generate_ai_followup(cls, user_id: str, application_id: str) -> Tuple[Dict[str, Any], int]:
        """Generate AI follow-up message for application using Gemini AI."""
        app_record = JobApplication.query.filter_by(id=application_id, user_id=user_id).first()
        if not app_record:
            return {'error': 'Job application not found or access denied.'}, 404

        last_activity_date = app_record.application_date
        if app_record.activities:
            last_activity_date = app_record.activities[-1].activity_date or last_activity_date

        try:
            ai_msg = generate_followup_with_gemini(
                company_name=app_record.company_name,
                job_title=app_record.job_title,
                current_stage=app_record.current_stage,
                notes=app_record.notes,
                last_activity_date_str=last_activity_date
            )
            return {'followup_suggestion': ai_msg}, 200
        except Exception as e:
            logger.exception("Failed to generate AI follow-up")
            return {'error': f'Failed to generate follow-up: {str(e)}'}, 500

    @classmethod
    def get_application_statistics(cls, user_id: str) -> Tuple[Dict[str, Any], int]:
        """Compute candidate application analytics & smart recommendations."""
        apps = JobApplication.query.filter_by(user_id=user_id).all()

        total = len(apps)
        active = sum(1 for a in apps if a.status == 'Active')
        offers = sum(1 for a in apps if a.current_stage == 'Offer' or a.status == 'Successful')
        rejections = sum(1 for a in apps if a.current_stage == 'Rejected' or a.status == 'Rejected')

        # Interviews count (applications reaching Assessment, Interview, or Final Round)
        interviews = sum(1 for a in apps if a.current_stage in ['Assessment', 'Interview', 'Final Round', 'Offer'])

        success_rate = round((offers / total * 100), 1) if total > 0 else 0.0
        interview_rate = round((interviews / total * 100), 1) if total > 0 else 0.0

        # Stage distribution
        stage_dist = {s: 0 for s in STAGES}
        for a in apps:
            st = a.current_stage or 'Saved'
            stage_dist[st] = stage_dist.get(st, 0) + 1

        # Monthly distribution
        monthly_dist = {}
        for a in apps:
            m = a.application_date[:7] if a.application_date else datetime.utcnow().strftime('%Y-%m')
            monthly_dist[m] = monthly_dist.get(m, 0) + 1

        # Smart actionable recommendations
        recommendations = []
        if total == 0:
            recommendations.append("Start tracking job applications directly from the AI Job Matches studio or add external positions manually.")
        else:
            if interview_rate < 25 and total >= 3:
                recommendations.append("Your interview conversion rate is below 25%. Run your resume through the ATS Scanner to improve keyword density.")
            elif interview_rate >= 40:
                recommendations.append("Strong interview conversion rate! Focus on practicing in the AI Mock Interview Arena to maximize offer conversions.")

            if stage_dist.get('Saved', 0) > 3:
                recommendations.append(f"You have {stage_dist['Saved']} saved jobs pending application. Complete your applications to boost pipeline flow.")

            if active > 0 and offers == 0:
                recommendations.append("Schedule proactive follow-ups for applications in Assessment or Interview stages to keep momentum high.")

        return {
            'statistics': {
                'total_applications': total,
                'active_applications': active,
                'interviews': interviews,
                'offers': offers,
                'rejections': rejections,
                'success_rate': success_rate,
                'interview_conversion_rate': interview_rate,
                'stage_distribution': stage_dist,
                'monthly_distribution': monthly_dist,
                'smart_recommendations': recommendations
            }
        }, 200
