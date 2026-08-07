import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.ats_service import ATSService

logger = logging.getLogger(__name__)
ats_bp = Blueprint('ats', __name__)

@ats_bp.route('/ats/analyze', methods=['POST'])
@jwt_required()
def analyze_ats():
    """
    POST /api/ats/analyze
    Compare selected resume against Job Description and return ATS report.
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}

        resume_id = data.get('resume_id')
        job_description = data.get('job_description', '')
        job_title = data.get('job_title', 'Target Role')
        company_name = data.get('company_name', '')

        if not resume_id:
            return jsonify({'error': 'resume_id is required.'}), 400

        if not job_description or not job_description.strip():
            return jsonify({'error': 'job_description text is required.'}), 400

        response, status_code = ATSService.analyze_resume_vs_jd(
            user_id=current_user_id,
            resume_id=resume_id,
            job_description=job_description,
            job_title=job_title,
            company_name=company_name
        )
        return jsonify(response), status_code

    except Exception as e:
        logger.exception("Error in analyze_ats endpoint")
        return jsonify({'error': f'Failed to execute ATS analysis: {str(e)}'}), 500

@ats_bp.route('/ats/report/<analysis_id>', methods=['GET'])
@jwt_required()
def get_ats_report(analysis_id):
    """GET /api/ats/report/<analysis_id> - Fetch single ATS report."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = ATSService.get_analysis(current_user_id, analysis_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error fetching ATS report {analysis_id}")
        return jsonify({'error': f'Failed to fetch report: {str(e)}'}), 500

@ats_bp.route('/ats/history', methods=['GET'])
@jwt_required()
def get_ats_history():
    """GET /api/ats/history - Fetch past ATS analyses for logged-in user."""
    try:
        current_user_id = get_jwt_identity()
        history, status_code = ATSService.get_user_history(current_user_id)
        return jsonify({'history': history}), status_code
    except Exception as e:
        logger.exception("Error fetching ATS history")
        return jsonify({'error': f'Failed to fetch ATS history: {str(e)}'}), 500

@ats_bp.route('/ats/report/<analysis_id>', methods=['DELETE'])
@jwt_required()
def delete_ats_report(analysis_id):
    """DELETE /api/ats/report/<analysis_id> - Delete an ATS report."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = ATSService.delete_analysis(current_user_id, analysis_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error deleting ATS report {analysis_id}")
        return jsonify({'error': f'Failed to delete report: {str(e)}'}), 500
