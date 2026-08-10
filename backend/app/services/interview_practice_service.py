import logging
from typing import Tuple, Dict, Any, List
from sqlalchemy import desc
from app.extensions import db
from app.models.interview_intelligence import InterviewPracticeRecommendation
from app.models.interview import InterviewSession

logger = logging.getLogger(__name__)

class InterviewPracticeService:
    """Service layer managing adaptive interview practice recommendations."""

    @classmethod
    def generate_recommendations_from_sessions(cls, user_id: str, sessions: list) -> List[Dict[str, Any]]:
        """Generates adaptive practice recommendations based on evaluated session sub-scores and weaknesses."""
        if not sessions:
            return []

        latest_session = sessions[-1] if isinstance(sessions, list) else sessions

        try:
            def add_rec_if_missing(category, title, description, reason, priority, action):
                existing = InterviewPracticeRecommendation.query.filter_by(
                    user_id=user_id,
                    title=title,
                    status='pending'
                ).first()

                if not existing:
                    rec = InterviewPracticeRecommendation(
                        user_id=user_id,
                        source_session_id=latest_session.id if hasattr(latest_session, 'id') else None,
                        category=category,
                        title=title,
                        description=description,
                        reason=reason,
                        priority=priority,
                        recommended_action=action,
                        status='pending'
                    )
                    db.session.add(rec)

            # 1. Communication Check
            comm_score = latest_session.communication_score or 0
            if comm_score < 75:
                add_rec_if_missing(
                    'Communication',
                    'Practice Concise Technical Explanations',
                    'Structure your verbal answers using clear 60-second summary frameworks to boost clarity.',
                    f'Communication score is {comm_score}% in your latest evaluation.',
                    'High' if comm_score < 65 else 'Medium',
                    'Record timed 60-second technical explanations and review answer structure.'
                )

            # 2. Problem Solving Check
            ps_score = latest_session.problem_solving_score or 0
            if ps_score < 75:
                add_rec_if_missing(
                    'Problem Solving',
                    'Practice Structured Technical Problem Formulation',
                    'Work through algorithmic trade-offs systematically before jumping into code logic.',
                    f'Problem solving score is {ps_score}% in your latest evaluation.',
                    'High' if ps_score < 65 else 'Medium',
                    'Practice articulating system architectural trade-offs out loud.'
                )

            # 3. Confidence Check
            conf_score = latest_session.confidence_score or 0
            if conf_score < 75:
                add_rec_if_missing(
                    'Confidence',
                    'Timed Live Arena Mock Interview Practice',
                    'Build composure by answering random timed questions under interview conditions.',
                    f'Confidence rating is {conf_score}%.',
                    'High' if conf_score < 65 else 'Medium',
                    'Complete a 5-question timed mock interview session.'
                )

            # 4. Technical Check
            tech_score = latest_session.technical_score or 0
            if tech_score < 75:
                add_rec_if_missing(
                    'Technical',
                    'Deep-Dive Core Technical Stack Review',
                    'Revisit core technical concepts and framework internals for your target role.',
                    f'Technical accuracy score is {tech_score}%.',
                    'High' if tech_score < 65 else 'Medium',
                    'Review technical documentation for core stack topics.'
                )

            db.session.commit()

        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to generate practice recommendations for user {user_id}: {e}")

        # Return active recommendations
        recs = InterviewPracticeRecommendation.query.filter_by(user_id=user_id).order_by(desc(InterviewPracticeRecommendation.created_at)).all()
        return [r.to_dict() for r in recs]

    @classmethod
    def get_user_recommendations(cls, user_id: str) -> Tuple[List[Dict[str, Any]], int]:
        """Fetch all practice recommendations for candidate."""
        recs = InterviewPracticeRecommendation.query.filter_by(user_id=user_id).order_by(desc(InterviewPracticeRecommendation.created_at)).all()
        return [r.to_dict() for r in recs], 200

    @classmethod
    def update_recommendation_status(cls, user_id: str, rec_id: str, status: str) -> Tuple[Dict[str, Any], int]:
        """Update recommendation status ('pending', 'in_progress', 'completed', 'dismissed')."""
        if status not in ['pending', 'in_progress', 'completed', 'dismissed']:
            return {'error': 'Invalid status.'}, 400

        rec = InterviewPracticeRecommendation.query.filter_by(id=rec_id, user_id=user_id).first()
        if not rec:
            return {'error': 'Practice recommendation not found or access denied.'}, 404

        try:
            rec.status = status
            db.session.commit()
            return {'message': f'Status updated to {status}.', 'recommendation': rec.to_dict()}, 200
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to update recommendation status {rec_id}")
            return {'error': f'Failed to update status: {str(e)}'}, 500
