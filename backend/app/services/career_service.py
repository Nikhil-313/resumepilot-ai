import logging
from typing import Tuple, Dict, Any, List
from sqlalchemy import desc
from app.extensions import db
from app.models.career import CareerPlan, CareerGoal, SkillRoadmap
from app.models.user import User
from app.models.resume import Resume
from app.models.ats import ATSAnalysis
from app.models.interview import InterviewSession
from app.models.job import JobMatchReport
from app.ai.career_engine import generate_career_plan_with_gemini

logger = logging.getLogger(__name__)

class CareerService:
    """Service layer managing candidate AI career development plans, goals, and skill roadmaps."""

    @classmethod
    def generate_career_plan(cls, user_id: str, target_role: str = None) -> Tuple[Dict[str, Any], int]:
        """
        Synthesize cross-module candidate evidence (Resume, ATS, Interview, Job Matches)
        and generate/replace candidate's AI Career Development Plan.
        """
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found.'}, 404

        candidate_profile = user.to_dict()

        # 1. Fetch latest parsed resume
        resume = Resume.query.filter_by(user_id=user_id).order_by(desc(Resume.created_at)).first()
        resume_data = resume.parsed_json if (resume and resume.parsed_json) else (resume.filename if resume else "")

        # Extract primary skills from resume or user profile
        primary_skills = candidate_profile.get('primary_skills', [])
        if resume and resume.parsed_json and isinstance(resume.parsed_json, dict):
            resume_skills = resume.parsed_json.get('skills', [])
            if isinstance(resume_skills, list):
                primary_skills = list(set(primary_skills + [s for s in resume_skills if isinstance(s, str)]))

        # Determine target role
        chosen_target_role = target_role or candidate_profile.get('target_role') or 'Software Engineer'

        # 2. Gather cross-module diagnostic evidence
        # ATS Analysis missing skills & keywords
        ats_records = ATSAnalysis.query.filter_by(user_id=user_id).order_by(desc(ATSAnalysis.created_at)).all()
        ats_missing_skills = []
        for ats in ats_records[:3]:
            if ats.missing_skills and isinstance(ats.missing_skills, list):
                ats_missing_skills.extend(ats.missing_skills)
            if ats.missing_keywords and isinstance(ats.missing_keywords, list):
                ats_missing_skills.extend(ats.missing_keywords[:3])
        ats_missing_skills = list(set(ats_missing_skills))

        # Interview Session evaluation weaknesses
        interview_sessions = InterviewSession.query.filter_by(user_id=user_id, status='completed').order_by(desc(InterviewSession.created_at)).all()
        interview_weaknesses = []
        for sess in interview_sessions[:3]:
            if sess.weaknesses_summary and isinstance(sess.weaknesses_summary, list):
                interview_weaknesses.extend(sess.weaknesses_summary)
            if sess.recommendations and isinstance(sess.recommendations, list):
                interview_weaknesses.extend(sess.recommendations[:2])
        interview_weaknesses = list(set(interview_weaknesses))

        # Job Match Reports missing skills
        job_reports = JobMatchReport.query.filter_by(user_id=user_id).order_by(desc(JobMatchReport.created_at)).all()
        job_missing_skills = []
        for jm in job_reports[:5]:
            if jm.missing_skills and isinstance(jm.missing_skills, list):
                job_missing_skills.extend(jm.missing_skills)
        job_missing_skills = list(set(job_missing_skills))

        try:
            # 3. Call AI Career Planning Engine
            ai_result = generate_career_plan_with_gemini(
                target_role=chosen_target_role,
                user_experience_level=candidate_profile.get('experience_level', 'Mid Level'),
                primary_skills=primary_skills,
                resume_data_or_text=resume_data,
                ats_missing_skills=ats_missing_skills,
                interview_weaknesses=interview_weaknesses,
                job_missing_skills=job_missing_skills
            )

            # 4. Remove existing career plan for user if present (cascade deletes goals and roadmap)
            existing_plan = CareerPlan.query.filter_by(user_id=user_id).first()
            if existing_plan:
                db.session.delete(existing_plan)
                db.session.flush()

            # 5. Create new CareerPlan DB record
            plan = CareerPlan(
                user_id=user_id,
                target_role=chosen_target_role,
                current_level=ai_result.get('current_level', candidate_profile.get('experience_level', 'Mid Level')),
                overall_readiness_score=ai_result.get('overall_readiness_score', 75),
                career_summary=ai_result.get('career_summary', ''),
                strengths=ai_result.get('strengths', []),
                skill_gaps=ai_result.get('skill_gaps', []),
                recommended_projects=ai_result.get('recommended_projects', []),
                interview_prep_recommendations=ai_result.get('interview_prep_recommendations', []),
                ats_resume_recommendations=ai_result.get('ats_resume_recommendations', []),
                career_progression_explanation=ai_result.get('career_progression_explanation', '')
            )
            db.session.add(plan)
            db.session.flush() # Populate plan.id

            # 6. Create CareerGoal DB records
            goals_list = ai_result.get('goals', [])
            for g_data in goals_list:
                goal = CareerGoal(
                    career_plan_id=plan.id,
                    title=g_data.get('title', 'Career Goal'),
                    description=g_data.get('description', ''),
                    category=g_data.get('category', 'Short-term'),
                    priority=g_data.get('priority', 'Medium'),
                    status='not_started',
                    target_date=g_data.get('target_date', '')
                )
                db.session.add(goal)

            # 7. Create SkillRoadmap DB records
            roadmap_list = ai_result.get('skill_roadmap', [])
            for r_data in roadmap_list:
                roadmap_item = SkillRoadmap(
                    career_plan_id=plan.id,
                    skill_name=r_data.get('skill_name', 'Skill'),
                    current_level=r_data.get('current_level', 'Missing'),
                    target_level=r_data.get('target_level', 'Proficient'),
                    priority=r_data.get('priority', 'High'),
                    reason=r_data.get('reason', ''),
                    recommended_resources=r_data.get('recommended_resources', []),
                    estimated_time=r_data.get('estimated_time', '2 weeks'),
                    status='not_started'
                )
                db.session.add(roadmap_item)

            db.session.commit()
            logger.info(f"Successfully generated AI Career Plan ID {plan.id} for user {user_id}")

            return {
                "message": "AI Career Development Plan generated successfully.",
                "plan": plan.to_dict()
            }, 201

        except Exception as e:
            db.session.rollback()
            logger.exception("Failed to generate AI career plan")
            return {'error': f'Failed to generate career plan: {str(e)}'}, 500

    @classmethod
    def get_user_career_plan(cls, user_id: str) -> Tuple[Dict[str, Any], int]:
        """Fetch current active CareerPlan for logged-in user."""
        plan = CareerPlan.query.filter_by(user_id=user_id).first()
        if not plan:
            return {'plan': None}, 200
        return {'plan': plan.to_dict()}, 200

    @classmethod
    def get_user_goals(cls, user_id: str) -> Tuple[List[Dict[str, Any]], int]:
        """Fetch career goals for logged-in user."""
        plan = CareerPlan.query.filter_by(user_id=user_id).first()
        if not plan:
            return [], 200
        goals = CareerGoal.query.filter_by(career_plan_id=plan.id).all()
        return [g.to_dict() for g in goals], 200

    @classmethod
    def update_goal_status(cls, user_id: str, goal_id: str, status: str) -> Tuple[Dict[str, Any], int]:
        """Update status for a specific CareerGoal."""
        if status not in ['not_started', 'in_progress', 'completed']:
            return {'error': 'Invalid status. Must be not_started, in_progress, or completed.'}, 400

        plan = CareerPlan.query.filter_by(user_id=user_id).first()
        if not plan:
            return {'error': 'Career plan not found.'}, 404

        goal = CareerGoal.query.filter_by(id=goal_id, career_plan_id=plan.id).first()
        if not goal:
            return {'error': 'Career goal not found or access denied.'}, 404

        try:
            goal.status = status
            db.session.commit()
            return {'message': 'Goal status updated successfully.', 'goal': goal.to_dict()}, 200
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to update goal status for {goal_id}")
            return {'error': f'Failed to update goal status: {str(e)}'}, 500

    @classmethod
    def get_user_roadmap(cls, user_id: str) -> Tuple[List[Dict[str, Any]], int]:
        """Fetch skill roadmap items for logged-in user."""
        plan = CareerPlan.query.filter_by(user_id=user_id).first()
        if not plan:
            return [], 200
        roadmap = SkillRoadmap.query.filter_by(career_plan_id=plan.id).all()
        return [r.to_dict() for r in roadmap], 200

    @classmethod
    def update_roadmap_status(cls, user_id: str, roadmap_id: str, status: str) -> Tuple[Dict[str, Any], int]:
        """Update status for a specific SkillRoadmap item."""
        if status not in ['not_started', 'in_progress', 'completed']:
            return {'error': 'Invalid status. Must be not_started, in_progress, or completed.'}, 400

        plan = CareerPlan.query.filter_by(user_id=user_id).first()
        if not plan:
            return {'error': 'Career plan not found.'}, 404

        item = SkillRoadmap.query.filter_by(id=roadmap_id, career_plan_id=plan.id).first()
        if not item:
            return {'error': 'Skill roadmap item not found or access denied.'}, 404

        try:
            item.status = status
            db.session.commit()
            return {'message': 'Skill status updated successfully.', 'skill': item.to_dict()}, 200
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to update roadmap skill status for {roadmap_id}")
            return {'error': f'Failed to update skill status: {str(e)}'}, 500

    @classmethod
    def delete_career_plan(cls, user_id: str) -> Tuple[Dict[str, Any], int]:
        """Delete current career plan for user."""
        plan = CareerPlan.query.filter_by(user_id=user_id).first()
        if not plan:
            return {'error': 'Career plan not found or access denied.'}, 404

        try:
            db.session.delete(plan)
            db.session.commit()
            return {'message': 'Career plan deleted successfully.'}, 200
        except Exception as e:
            db.session.rollback()
            logger.exception("Failed to delete career plan")
            return {'error': f'Failed to delete career plan: {str(e)}'}, 500
