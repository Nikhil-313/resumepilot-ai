import logging
from typing import Tuple, Dict, Any, List
from sqlalchemy import desc
from app.extensions import db
from app.models.notification import CareerNotification
from app.models.ats import ATSAnalysis
from app.models.interview import InterviewSession
from app.models.application import JobApplication, ApplicationFollowUp
from app.models.optimizer import ResumeOptimization, ResumeRecommendation
from app.models.job import JobMatchReport

logger = logging.getLogger(__name__)

class NotificationService:
    """Service layer managing candidate smart notifications and alerts."""

    @classmethod
    def generate_candidate_notifications(cls, user_id: str):
        """Scans candidate cross-module status and generates unresolved smart notifications."""
        try:
            # Helper to add non-duplicate notification
            def add_notice_if_missing(n_type, title, message, priority, entity_type=None, entity_id=None):
                existing = CareerNotification.query.filter_by(
                    user_id=user_id,
                    notification_type=n_type,
                    title=title,
                    is_read=False
                ).first()
                if not existing:
                    notice = CareerNotification(
                        user_id=user_id,
                        notification_type=n_type,
                        title=title,
                        message=message,
                        priority=priority,
                        related_entity_type=entity_type,
                        related_entity_id=entity_id
                    )
                    db.session.add(notice)

            # 1. ATS Alert
            latest_ats = ATSAnalysis.query.filter_by(user_id=user_id).order_by(desc(ATSAnalysis.created_at)).first()
            if latest_ats and latest_ats.ats_score and latest_ats.ats_score < 70:
                add_notice_if_missing(
                    'ATS_ALERT',
                    f"ATS Score Needs Attention ({latest_ats.ats_score}%)",
                    f"Your ATS match score for {latest_ats.job_title or 'target role'} is below 70%. Run an ATS scan or optimize keywords.",
                    'High',
                    'ats',
                    latest_ats.id
                )

            # 2. Mock Interview Alert
            latest_interview = InterviewSession.query.filter_by(user_id=user_id, status='completed').order_by(desc(InterviewSession.created_at)).first()
            if latest_interview and latest_interview.overall_score and latest_interview.overall_score < 70:
                add_notice_if_missing(
                    'INTERVIEW_ALERT',
                    f"Mock Interview Evaluation ({latest_interview.overall_score}% Score)",
                    "Your recent mock interview evaluation highlighted areas to improve in communication and technical clarity.",
                    'Medium',
                    'interview',
                    latest_interview.id
                )

            # 3. Application Follow-Up Reminders
            apps = JobApplication.query.filter_by(user_id=user_id, status='Active').all()
            for app_rec in apps:
                for fu in app_rec.followups:
                    if not fu.completed:
                        add_notice_if_missing(
                            'APPLICATION_FOLLOWUP',
                            f"Follow-Up Due: {app_rec.company_name}",
                            f"Scheduled follow-up reminder for {app_rec.job_title} at {app_rec.company_name}: '{fu.title}'.",
                            'High',
                            'application',
                            app_rec.id
                        )

            # 4. Pending Resume Optimizer Recommendations
            latest_opt = ResumeOptimization.query.filter_by(user_id=user_id).order_by(desc(ResumeOptimization.created_at)).first()
            if latest_opt:
                pending_count = sum(1 for r in latest_opt.recommendations if r.status == 'pending')
                if pending_count > 0:
                    add_notice_if_missing(
                        'RESUME_ALERT',
                        f"Unreviewed Resume Recommendations ({pending_count})",
                        f"You have {pending_count} pending AI wording recommendations in Resume Studio for {latest_opt.target_role}.",
                        'Medium',
                        'optimizer',
                        latest_opt.id
                    )

            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to generate candidate notifications for user {user_id}: {e}")

    @classmethod
    def get_user_notifications(cls, user_id: str) -> Tuple[Dict[str, Any], int]:
        """Fetch notifications and unread count for logged-in user."""
        cls.generate_candidate_notifications(user_id)

        notices = CareerNotification.query.filter_by(user_id=user_id).order_by(desc(CareerNotification.created_at)).all()
        unread_count = sum(1 for n in notices if not n.is_read)

        return {
            'notifications': [n.to_dict() for n in notices],
            'unread_count': unread_count
        }, 200

    @classmethod
    def mark_as_read(cls, user_id: str, notification_id: str) -> Tuple[Dict[str, Any], int]:
        """Mark single notification as read."""
        notice = CareerNotification.query.filter_by(id=notification_id, user_id=user_id).first()
        if not notice:
            return {'error': 'Notification not found.'}, 404

        try:
            notice.is_read = True
            db.session.commit()
            return {'message': 'Notification marked as read.', 'notification': notice.to_dict()}, 200
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to mark notification read {notification_id}")
            return {'error': f'Failed to update notification: {str(e)}'}, 500

    @classmethod
    def mark_all_as_read(cls, user_id: str) -> Tuple[Dict[str, Any], int]:
        """Mark all notifications as read for candidate."""
        try:
            CareerNotification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
            db.session.commit()
            return {'message': 'All notifications marked as read.'}, 200
        except Exception as e:
            db.session.rollback()
            logger.exception("Failed to mark all notifications read")
            return {'error': f'Failed to update notifications: {str(e)}'}, 500

    @classmethod
    def delete_notification(cls, user_id: str, notification_id: str) -> Tuple[Dict[str, Any], int]:
        """Delete a single notification."""
        notice = CareerNotification.query.filter_by(id=notification_id, user_id=user_id).first()
        if not notice:
            return {'error': 'Notification not found.'}, 404

        try:
            db.session.delete(notice)
            db.session.commit()
            return {'message': 'Notification deleted successfully.'}, 200
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to delete notification {notification_id}")
            return {'error': f'Failed to delete notification: {str(e)}'}, 500
