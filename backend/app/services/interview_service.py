import logging
from typing import Tuple, Dict, Any
from app.extensions import db
from app.models.interview import InterviewSession, InterviewQuestion
from app.models.resume import Resume
from app.ai.interview_engine import generate_interview_questions_with_gemini

logger = logging.getLogger(__name__)

class InterviewService:
    """Service layer managing mock interview sessions and candidate responses."""

    @classmethod
    def start_session(
        cls,
        user_id: str,
        role: str,
        difficulty: str,
        question_count: int = 5,
        resume_id: str = None
    ) -> Tuple[Dict[str, Any], int]:
        """
        Initialize a new interview session, generate questions via Gemini AI,
        and store session + questions in PostgreSQL.
        """
        try:
            resume_data = None
            if resume_id:
                resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
                if resume and resume.parsed_json:
                    resume_data = resume.parsed_json

            # Create InterviewSession record
            session = InterviewSession(
                user_id=user_id,
                resume_id=resume_id or None,
                role=role,
                difficulty=difficulty,
                total_questions=question_count,
                status='in_progress'
            )
            db.session.add(session)
            db.session.flush() # Populate session.id

            # Generate questions via Gemini AI (or fallback suite)
            questions_list = generate_interview_questions_with_gemini(
                role=role,
                difficulty=difficulty,
                question_count=question_count,
                resume_json_or_text=resume_data
            )

            # Store InterviewQuestion records
            for q_data in questions_list:
                question = InterviewQuestion(
                    session_id=session.id,
                    question_number=q_data["question_number"],
                    question_text=q_data["question_text"],
                    category=q_data.get("category", "Technical"),
                    candidate_answer=""
                )
                db.session.add(question)

            db.session.commit()
            logger.info(f"Successfully created interview session {session.id} with {len(questions_list)} questions.")

            return {
                "status": "ready",
                "message": "Interview session initialized successfully.",
                "session_id": session.id,
                "session": session.to_dict()
            }, 201

        except Exception as e:
            db.session.rollback()
            logger.exception("Failed to start interview session")
            return {"error": f"Failed to initialize interview session: {str(e)}"}, 500

    @classmethod
    def get_session(cls, user_id: str, session_id: str) -> Tuple[Dict[str, Any], int]:
        """Fetch an interview session and its questions."""
        session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return {"error": "Interview session not found or access denied."}, 404
        return {"session": session.to_dict()}, 200

    @classmethod
    def submit_answer(
        cls,
        user_id: str,
        session_id: str,
        question_id: str,
        answer: str
    ) -> Tuple[Dict[str, Any], int]:
        """Save a candidate's answer for a specific question."""
        session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return {"error": "Interview session not found or access denied."}, 404

        question = InterviewQuestion.query.filter_by(id=question_id, session_id=session_id).first()
        if not question:
            return {"error": "Question not found in this session."}, 404

        try:
            question.candidate_answer = answer or ""
            db.session.commit()
            return {
                "message": "Answer saved successfully.",
                "question": question.to_dict()
            }, 200
        except Exception as e:
            db.session.rollback()
            logger.exception("Failed to save candidate answer")
            return {"error": f"Failed to save answer: {str(e)}"}, 500

    @classmethod
    def finish_session(cls, user_id: str, session_id: str) -> Tuple[Dict[str, Any], int]:
        """Mark interview session status as 'completed'."""
        session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return {"error": "Interview session not found or access denied."}, 404

        try:
            session.status = 'completed'
            db.session.commit()
            return {
                "message": "Interview session completed.",
                "session": session.to_dict()
            }, 200
        except Exception as e:
            db.session.rollback()
            logger.exception("Failed to finish interview session")
            return {"error": f"Failed to complete session: {str(e)}"}, 500
