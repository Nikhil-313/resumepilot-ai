import logging
from typing import Tuple, Dict, Any, List
from sqlalchemy import desc
from app.extensions import db
from app.models.optimizer import ResumeOptimization, ResumeRecommendation
from app.models.resume import Resume
from app.models.ats import ATSAnalysis
from app.models.job import JobMatchReport
from app.models.career import CareerPlan
from app.ai.resume_optimizer_engine import optimize_resume_with_gemini

logger = logging.getLogger(__name__)

class OptimizerService:
    """Service layer managing AI Resume Improvement & Optimization sessions and recommendations."""

    @classmethod
    def analyze_resume(
        cls,
        user_id: str,
        resume_id: str = None,
        target_role: str = "Software Engineer",
        target_company: str = ""
    ) -> Tuple[Dict[str, Any], int]:
        """
        Run AI resume optimization analysis by synthesizing resume content, ATS history,
        job-match data, and career plan skill gaps.
        """
        if not target_role or not target_role.strip():
            return {'error': 'Target role is required for optimization.'}, 400

        # Fetch resume
        resume = None
        if resume_id:
            resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
        if not resume:
            resume = Resume.query.filter_by(user_id=user_id).order_by(desc(Resume.created_at)).first()

        if not resume:
            return {'error': 'No uploaded resume found. Please upload a resume first.'}, 404

        resume_data = resume.parsed_json or {}

        # 1. Fetch ATS missing keywords/skills
        ats_records = ATSAnalysis.query.filter_by(user_id=user_id).order_by(desc(ATSAnalysis.created_at)).all()
        ats_missing_keywords = []
        for ats in ats_records[:3]:
            if ats.missing_keywords and isinstance(ats.missing_keywords, list):
                ats_missing_keywords.extend(ats.missing_keywords)
            if ats.missing_skills and isinstance(ats.missing_skills, list):
                ats_missing_keywords.extend(ats.missing_skills)
        ats_missing_keywords = list(set(ats_missing_keywords))

        # 2. Fetch Job Match missing skills
        job_reports = JobMatchReport.query.filter_by(user_id=user_id).order_by(desc(JobMatchReport.created_at)).all()
        job_missing_skills = []
        for jm in job_reports[:5]:
            if jm.missing_skills and isinstance(jm.missing_skills, list):
                job_missing_skills.extend(jm.missing_skills)
        job_missing_skills = list(set(job_missing_skills))

        # 3. Fetch Career Planner skill gaps
        career_plan = CareerPlan.query.filter_by(user_id=user_id).first()
        career_skill_gaps = []
        if career_plan and career_plan.skill_gaps and isinstance(career_plan.skill_gaps, list):
            for gap in career_plan.skill_gaps:
                if isinstance(gap, dict) and 'skill' in gap:
                    career_skill_gaps.append(gap['skill'])

        try:
            # 4. Run AI Resume Optimization Engine
            ai_result = optimize_resume_with_gemini(
                resume_data=resume_data,
                target_role=target_role,
                target_company=target_company,
                ats_missing_keywords=ats_missing_keywords,
                job_missing_skills=job_missing_skills,
                career_skill_gaps=career_skill_gaps
            )

            # 5. Create ResumeOptimization DB Record
            optimization = ResumeOptimization(
                user_id=user_id,
                resume_id=resume.id,
                target_role=target_role,
                target_company=target_company or '',
                original_resume_snapshot=resume_data if isinstance(resume_data, dict) else {},
                optimized_resume=ai_result.get('optimized_resume', {}),
                overall_improvement_score=ai_result.get('overall_improvement_score', 85),
                ats_improvement_score=ai_result.get('ats_improvement_score', 88),
                content_quality_score=ai_result.get('content_quality_score', 84),
                keyword_optimization_score=ai_result.get('keyword_optimization_score', 86),
                impact_score=ai_result.get('impact_score', 82),
                strengths=ai_result.get('strengths', []),
                weak_sections=ai_result.get('weak_sections', []),
                missing_keywords=ai_result.get('missing_keywords', []),
                priority_improvements=ai_result.get('priority_improvements', [])
            )

            db.session.add(optimization)
            db.session.flush() # Populate optimization.id

            # 6. Create ResumeRecommendation DB Records
            recs_list = ai_result.get('recommendations', [])
            for r_data in recs_list:
                rec = ResumeRecommendation(
                    optimization_id=optimization.id,
                    section=r_data.get('section', 'general'),
                    original_text=r_data.get('original_text', ''),
                    suggested_text=r_data.get('suggested_text', ''),
                    reason=r_data.get('reason', ''),
                    priority=r_data.get('priority', 'Medium'),
                    recommendation_type=r_data.get('recommendation_type', 'rewrite'),
                    status='pending'
                )
                db.session.add(rec)

            db.session.commit()
            logger.info(f"Successfully generated Resume Optimization ID {optimization.id} for user {user_id}")

            return {
                "message": "Resume optimization analysis completed successfully.",
                "optimization": optimization.to_dict()
            }, 201

        except Exception as e:
            db.session.rollback()
            logger.exception("Failed to execute AI resume optimization")
            return {'error': f'Failed to optimize resume: {str(e)}'}, 500

    @classmethod
    def get_optimization(cls, user_id: str, optimization_id: str) -> Tuple[Dict[str, Any], int]:
        """Fetch single ResumeOptimization report by ID."""
        optimization = ResumeOptimization.query.filter_by(id=optimization_id, user_id=user_id).first()
        if not optimization:
            return {'error': 'Resume optimization report not found or access denied.'}, 404
        return {'optimization': optimization.to_dict()}, 200

    @classmethod
    def get_user_history(cls, user_id: str) -> Tuple[List[Dict[str, Any]], int]:
        """Fetch past ResumeOptimization sessions for candidate."""
        optimizations = ResumeOptimization.query.filter_by(user_id=user_id).order_by(desc(ResumeOptimization.created_at)).all()
        return [o.to_dict() for o in optimizations], 200

    @classmethod
    def update_recommendation_status(
        cls,
        user_id: str,
        recommendation_id: str,
        status: str
    ) -> Tuple[Dict[str, Any], int]:
        """
        Update status for a specific ResumeRecommendation ('pending', 'accepted', 'rejected').
        If accepted, updates the corresponding section in optimized_resume JSON.
        """
        if status not in ['pending', 'accepted', 'rejected']:
            return {'error': 'Invalid status. Must be pending, accepted, or rejected.'}, 400

        rec = ResumeRecommendation.query.get(recommendation_id)
        if not rec:
            return {'error': 'Recommendation not found.'}, 404

        optimization = ResumeOptimization.query.filter_by(id=rec.optimization_id, user_id=user_id).first()
        if not optimization:
            return {'error': 'Access denied or optimization not found.'}, 404

        try:
            rec.status = status

            # If accepted, update optimized_resume JSON summary
            if status == 'accepted' and rec.section == 'summary':
                opt_res = dict(optimization.optimized_resume or {})
                opt_res['summary'] = rec.suggested_text
                optimization.optimized_resume = opt_res

            db.session.commit()
            return {
                'message': f'Recommendation status updated to {status}.',
                'recommendation': rec.to_dict(),
                'optimization': optimization.to_dict()
            }, 200

        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to update recommendation status for {recommendation_id}")
            return {'error': f'Failed to update recommendation: {str(e)}'}, 500

    @classmethod
    def delete_optimization(cls, user_id: str, optimization_id: str) -> Tuple[Dict[str, Any], int]:
        """Delete a ResumeOptimization report record."""
        optimization = ResumeOptimization.query.filter_by(id=optimization_id, user_id=user_id).first()
        if not optimization:
            return {'error': 'Resume optimization report not found or access denied.'}, 404

        try:
            db.session.delete(optimization)
            db.session.commit()
            return {'message': 'Resume optimization report deleted successfully.'}, 200
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to delete resume optimization {optimization_id}")
            return {'error': f'Failed to delete optimization: {str(e)}'}, 500
