import logging
from datetime import datetime
from typing import Tuple, Dict, Any
from app.extensions import db
from app.models.interview import InterviewSession, InterviewQuestion
from app.models.resume import Resume
from app.ai.interview_engine import generate_interview_questions_with_gemini
from app.ai.interview_evaluation_engine import evaluate_interview_session_with_gemini

logger = logging.getLogger(__name__)

class InterviewService:
    """Service layer managing mock interview sessions, candidate responses, and AI evaluations."""

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

    @classmethod
    def evaluate_session(cls, user_id: str, session_id: str, force: bool = False) -> Tuple[Dict[str, Any], int]:
        """
        Evaluate candidate responses using Gemini AI and save complete performance report in PostgreSQL.
        Guarantees evaluation runs only once per completed session unless force=True.
        """
        session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return {"error": "Interview session not found or access denied."}, 404

        # Return existing evaluation if already evaluated and force is False
        if session.evaluated_at and session.overall_score > 0 and not force:
            logger.info(f"Returning cached evaluation report for session {session_id}")
            return {
                "message": "Interview session evaluation report retrieved.",
                "report": session.to_dict()
            }, 200

        try:
            questions = session.questions or []
            questions_data = [q.to_dict() for q in questions]

            # Run Gemini AI Evaluation Engine
            eval_report = evaluate_interview_session_with_gemini(
                role=session.role,
                difficulty=session.difficulty,
                questions_data=questions_data
            )

            # Update InterviewSession record
            session.status = 'completed'
            session.overall_score = eval_report.get('overall_score', 80)
            session.technical_score = eval_report.get('technical_score', 80)
            session.communication_score = eval_report.get('communication_score', 80)
            session.problem_solving_score = eval_report.get('problem_solving_score', 80)
            session.confidence_score = eval_report.get('confidence_score', 80)
            session.strengths_summary = eval_report.get('strengths_summary', [])
            session.weaknesses_summary = eval_report.get('weaknesses_summary', [])
            session.recommendations = eval_report.get('recommendations', [])
            session.evaluated_at = datetime.utcnow()

            # Map per-question evaluations to InterviewQuestion records
            q_evals_list = eval_report.get('question_evaluations', [])
            q_eval_map = {}
            for q_eval in q_evals_list:
                if "question_id" in q_eval:
                    q_eval_map[q_eval["question_id"]] = q_eval
                elif "question_number" in q_eval:
                    q_eval_map[str(q_eval["question_number"])] = q_eval

            for q in questions:
                # Find matching question eval
                match_eval = q_eval_map.get(q.id) or q_eval_map.get(str(q.question_number))
                if match_eval:
                    q.score = match_eval.get('score', 8)
                    q.technical_accuracy = match_eval.get('technical_accuracy', 'High')
                    q.communication_clarity = match_eval.get('communication_clarity', 'High')
                    q.completeness = match_eval.get('completeness', 'Good')
                    q.confidence_level = match_eval.get('confidence_level', 'High')
                    q.feedback = match_eval.get('feedback', '')
                    q.strengths = match_eval.get('strengths', [])
                    q.weaknesses = match_eval.get('weaknesses', [])
                    q.ideal_answer = match_eval.get('ideal_answer', '')

            db.session.commit()
            logger.info(f"Successfully saved evaluation report for session {session_id}")

            return {
                "message": "Interview session evaluated successfully.",
                "report": session.to_dict()
            }, 200

        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to evaluate interview session {session_id}")
            return {"error": f"Failed to evaluate session: {str(e)}"}, 500

    @classmethod
    def get_report(cls, user_id: str, session_id: str) -> Tuple[Dict[str, Any], int]:
        """Fetch complete evaluation report for a session."""
        session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return {"error": "Interview session not found or access denied."}, 404

        if not session.evaluated_at and session.overall_score == 0:
            # Trigger evaluation if session completed but not evaluated yet
            return cls.evaluate_session(user_id, session_id)

        return {"report": session.to_dict()}, 200
