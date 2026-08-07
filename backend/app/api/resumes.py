import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.resume_service import ResumeService

logger = logging.getLogger(__name__)
resumes_bp = Blueprint('resumes', __name__)

@resumes_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_resume():
    """
    POST /api/upload (or /api/v1/upload)
    JWT Protected PDF upload endpoint.
    """
    try:
        current_user_id = get_jwt_identity()
        if 'file' not in request.files:
            return jsonify({'error': 'No file field provided in upload request.'}), 400

        file = request.files['file']
        response, status_code = ResumeService.upload_resume(current_user_id, file)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception("Error in upload_resume endpoint")
        return jsonify({'error': f'Server upload error: {str(e)}'}), 500

@resumes_bp.route('/parse/<resume_id>', methods=['POST'])
@jwt_required()
def parse_resume(resume_id):
    """
    POST /api/parse/<resume_id>
    Extract text via PyMuPDF and parse JSON via Gemini AI.
    """
    try:
        current_user_id = get_jwt_identity()
        logger.info(f"Endpoint POST /parse/{resume_id} called by user {current_user_id}")
        response, status_code = ResumeService.parse_resume(current_user_id, resume_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Unhandled exception in parse_resume endpoint for ID {resume_id}")
        return jsonify({'error': f'AI Parsing server error: {str(e)}'}), 500

@resumes_bp.route('/resumes', methods=['GET'])
@jwt_required()
def get_all_resumes():
    """GET /api/resumes - Fetch all uploaded resumes for logged-in user."""
    try:
        current_user_id = get_jwt_identity()
        resumes, status_code = ResumeService.get_user_resumes(current_user_id)
        return jsonify({'resumes': resumes}), status_code
    except Exception as e:
        logger.exception("Error in get_all_resumes endpoint")
        return jsonify({'error': f'Server error fetching resumes: {str(e)}'}), 500

@resumes_bp.route('/resume/<resume_id>', methods=['GET'])
@jwt_required()
def get_resume_by_id(resume_id):
    """GET /api/resume/<id> - Fetch single resume details."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = ResumeService.get_resume(current_user_id, resume_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error in get_resume_by_id for ID {resume_id}")
        return jsonify({'error': f'Server error fetching resume details: {str(e)}'}), 500

@resumes_bp.route('/resume/<resume_id>', methods=['PUT'])
@jwt_required()
def update_resume_by_id(resume_id):
    """PUT /api/resume/<id> - Update parsed JSON content after editing."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        parsed_json = data.get('parsed_json', data)
        response, status_code = ResumeService.update_resume(current_user_id, resume_id, parsed_json)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error in update_resume_by_id for ID {resume_id}")
        return jsonify({'error': f'Server error updating resume: {str(e)}'}), 500

@resumes_bp.route('/resume/<resume_id>', methods=['DELETE'])
@jwt_required()
def delete_resume_by_id(resume_id):
    """DELETE /api/resume/<id> - Delete resume and remove physical file."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = ResumeService.delete_resume(current_user_id, resume_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error in delete_resume_by_id for ID {resume_id}")
        return jsonify({'error': f'Server error deleting resume: {str(e)}'}), 500
