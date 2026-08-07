import logging
from typing import Tuple, Dict, Any, List
from app.extensions import db
from app.models.ats import ATSAnalysis
from app.models.resume import Resume
from app.ai.ats_engine import analyze_ats_compatibility

logger = logging.getLogger(__name__)

class ATSService:
    """Service layer managing ATS resume vs job description analyses."""

    @classmethod
    def analyze_resume_vs_jd(
        cls,
        user_id: str,
        resume_id: str,
        job_description: str,
        job_title: str = "Target Role",
        company_name: str = ""
    ) -> Tuple[Dict[str, Any], int]:
        """
        Run ATS compatibility evaluation for a candidate's uploaded resume against a target JD,
        and save the report record in PostgreSQL.
        """
        if not job_description or not job_description.strip():
            return {'error': 'Job description text cannot be empty.'}, 400

        resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
        if not resume:
            return {'error': 'Resume not found or access denied.'}, 404

        try:
            resume_data = resume.parsed_json or resume.filename

            # Run ATS Engine (Gemini AI or fallback)
            result = analyze_ats_compatibility(
                resume_json_or_text=resume_data,
                job_description=job_description,
                job_title=job_title
            )

            # Store ATSAnalysis record in PostgreSQL
            analysis = ATSAnalysis(
                user_id=user_id,
                resume_id=resume.id,
                job_title=job_title or 'Target Role',
                company_name=company_name or '',
                job_description=job_description,
                ats_score=result.get('ats_score', 75),
                keyword_match_score=result.get('keyword_match_score', 75),
                experience_match_score=result.get('experience_match_score', 75),
                formatting_score=result.get('formatting_score', 85),
                matching_keywords=result.get('matching_keywords', []),
                missing_keywords=result.get('missing_keywords', []),
                matching_skills=result.get('matching_skills', []),
                missing_skills=result.get('missing_skills', []),
                section_analysis=result.get('section_analysis', {}),
                strengths=result.get('strengths', []),
                weaknesses=result.get('weaknesses', []),
                improvements=result.get('improvements', [])
            )

            db.session.add(analysis)
            db.session.commit()

            logger.info(f"Successfully created ATS analysis ID {analysis.id} for user {user_id}")

            return {
                "message": "ATS compatibility analysis completed successfully.",
                "analysis_id": analysis.id,
                "analysis": analysis.to_dict()
            }, 201

        except Exception as e:
            db.session.rollback()
            logger.exception("Failed to execute ATS analysis")
            return {'error': f'ATS Analysis failed: {str(e)}'}, 500

    @classmethod
    def get_analysis(cls, user_id: str, analysis_id: str) -> Tuple[Dict[str, Any], int]:
        """Fetch single ATS analysis report by ID."""
        analysis = ATSAnalysis.query.filter_by(id=analysis_id, user_id=user_id).first()
        if not analysis:
            return {'error': 'ATS Report not found or access denied.'}, 404
        return {'analysis': analysis.to_dict()}, 200

    @classmethod
    def get_user_history(cls, user_id: str) -> Tuple[List[Dict[str, Any]], int]:
        """Fetch past ATS analyses for logged-in user."""
        analyses = ATSAnalysis.query.filter_by(user_id=user_id).order_by(ATSAnalysis.created_at.desc()).all()
        return [a.to_dict() for a in analyses], 200

    @classmethod
    def delete_analysis(cls, user_id: str, analysis_id: str) -> Tuple[Dict[str, Any], int]:
        """Delete an ATS report record."""
        analysis = ATSAnalysis.query.filter_by(id=analysis_id, user_id=user_id).first()
        if not analysis:
            return {'error': 'ATS Report not found or access denied.'}, 404

        try:
            db.session.delete(analysis)
            db.session.commit()
            return {'message': 'ATS Analysis report deleted successfully.'}, 200
        except Exception as e:
            db.session.rollback()
            logger.exception("Failed to delete ATS analysis report")
            return {'error': f'Failed to delete report: {str(e)}'}, 500
