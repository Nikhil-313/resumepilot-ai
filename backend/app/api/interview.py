import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

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
    """
    GET /api/interview/config
    Returns available role options and difficulty levels.
    """
    return jsonify(CONFIG_DATA), 200

@interview_bp.route('/interview/start', methods=['POST'])
@jwt_required()
def start_interview_session():
    """
    POST /api/interview/start
    Accepts role, difficulty, question_count, resume_id.
    Returns placeholder session initialization status.
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}

        role = data.get('role', 'Software Engineer')
        difficulty = data.get('difficulty', 'Medium')
        question_count = data.get('question_count', 5)
        resume_id = data.get('resume_id')

        logger.info(
            f"Initializing interview session for user={current_user_id}, "
            f"role={role}, difficulty={difficulty}, questions={question_count}, resume_id={resume_id}"
        )

        return jsonify({
            "status": "ready",
            "message": "Interview session initialized.",
            "session_data": {
                "user_id": current_user_id,
                "role": role,
                "difficulty": difficulty,
                "question_count": question_count,
                "resume_id": resume_id
            }
        }), 200

    except Exception as e:
        logger.exception("Error starting interview session")
        return jsonify({"error": f"Failed to initialize interview session: {str(e)}"}), 500
