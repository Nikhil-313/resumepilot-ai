import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.interview_service import InterviewService

logger = logging.getLogger(__name__)
interview_bp = Blueprint('interview', __name__)

CONFIG_DATA = {
    "roles": [
        "Software Engineer",
        "Frontend Developer",
        "Backend Developer",
        "Data Scientist",
        "ML Engineer"
    ],
    "difficulty": [
        "Easy",
        "Medium",
        "Hard"
    ]
}

@interview_bp.route('/interview/config', methods=['GET'])
def get_interview_config():
    """GET /api/interview/config - Returns role options and difficulty levels."""
    return jsonify(CONFIG_DATA), 200

@interview_bp.route('/interview/start', methods=['POST'])
@jwt_required()
def start_interview_session():
    """
    POST /api/interview/start
    Accepts role, difficulty, question_count, resume_id.
    Creates InterviewSession in DB, generates AI questions, returns session & questions.
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}

        role = data.get('role', 'Software Engineer')
        difficulty = data.get('difficulty', 'Medium')
        question_count = int(data.get('question_count', 5))
        resume_id = data.get('resume_id')

        response, status_code = InterviewService.start_session(
            user_id=current_user_id,
            role=role,
            difficulty=difficulty,
            question_count=question_count,
            resume_id=resume_id
        )
        return jsonify(response), status_code

    except Exception as e:
        logger.exception("Error in start_interview_session endpoint")
        return jsonify({"error": f"Failed to start interview: {str(e)}"}), 500

@interview_bp.route('/interview/session/<session_id>', methods=['GET'])
@jwt_required()
def get_interview_session(session_id):
    """GET /api/interview/session/<session_id> - Fetch session details and all questions."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = InterviewService.get_session(current_user_id, session_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error in get_interview_session for session {session_id}")
        return jsonify({"error": f"Failed to fetch session: {str(e)}"}), 500

@interview_bp.route('/interview/answer', methods=['POST'])
@jwt_required()
def submit_question_answer():
    """
    POST /api/interview/answer
    Accepts session_id, question_id, answer.
    Saves candidate's response to PostgreSQL.
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}

        session_id = data.get('session_id')
        question_id = data.get('question_id')
        answer = data.get('answer', '')

        if not session_id or not question_id:
            return jsonify({"error": "session_id and question_id are required."}), 400

        response, status_code = InterviewService.submit_answer(
            user_id=current_user_id,
            session_id=session_id,
            question_id=question_id,
            answer=answer
        )
        return jsonify(response), status_code

    except Exception as e:
        logger.exception("Error submitting question answer")
        return jsonify({"error": f"Failed to save answer: {str(e)}"}), 500

@interview_bp.route('/interview/finish/<session_id>', methods=['POST'])
@jwt_required()
def finish_interview_session(session_id):
    """POST /api/interview/finish/<session_id> - Conclude interview session."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = InterviewService.finish_session(current_user_id, session_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error finishing interview session {session_id}")
        return jsonify({"error": f"Failed to finish interview: {str(e)}"}), 500

@interview_bp.route('/interview/evaluate/<session_id>', methods=['POST'])
@jwt_required()
def evaluate_interview_session(session_id):
    """
    POST /api/interview/evaluate/<session_id>
    Evaluates candidate responses using Gemini AI and returns performance report.
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        force = data.get('force', False)
        
        response, status_code = InterviewService.evaluate_session(current_user_id, session_id, force=force)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error evaluating interview session {session_id}")
        return jsonify({"error": f"Failed to evaluate interview: {str(e)}"}), 500

@interview_bp.route('/interview/report/<session_id>', methods=['GET'])
@jwt_required()
def get_interview_report(session_id):
    """GET /api/interview/report/<session_id> - Fetch complete performance report."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = InterviewService.get_report(current_user_id, session_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error fetching report for session {session_id}")
        return jsonify({"error": f"Failed to fetch report: {str(e)}"}), 500
