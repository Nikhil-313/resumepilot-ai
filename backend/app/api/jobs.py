import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.job_service import JobService

logger = logging.getLogger(__name__)
jobs_bp = Blueprint('jobs', __name__)

@jobs_bp.route('/jobs', methods=['GET'])
@jwt_required()
def get_available_jobs():
    """
    GET /api/jobs
    Retrieve available job postings with filtering parameters.
    Query params: role, location, experience_level, min_match, sort_by
    """
    try:
        current_user_id = get_jwt_identity()
        role_filter = request.args.get('role', None)
        location_filter = request.args.get('location', None)
        exp_filter = request.args.get('experience_level', None)
        min_match = int(request.args.get('min_match', 0))
        sort_by = request.args.get('sort_by', 'match_score')

        jobs, status_code = JobService.get_available_jobs(
            user_id=current_user_id,
            role_filter=role_filter,
            location_filter=location_filter,
            exp_filter=exp_filter,
            min_match=min_match,
            sort_by=sort_by
        )
        return jsonify({'jobs': jobs}), status_code

    except Exception as e:
        logger.exception("Error in get_available_jobs endpoint")
        return jsonify({'error': f'Failed to fetch available jobs: {str(e)}'}), 500

@jobs_bp.route('/jobs/match', methods=['POST'])
@jwt_required()
def generate_job_matches():
    """
    POST /api/jobs/match
    Generate personalized AI job compatibility match reports for current candidate.
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        resume_id = data.get('resume_id')

        response, status_code = JobService.generate_job_matches(
            user_id=current_user_id,
            resume_id=resume_id
        )
        return jsonify(response), status_code

    except Exception as e:
        logger.exception("Error in generate_job_matches endpoint")
        return jsonify({'error': f'Failed to generate job matches: {str(e)}'}), 500

@jobs_bp.route('/jobs/matches', methods=['GET'])
@jwt_required()
def get_user_matches():
    """GET /api/jobs/matches - Retrieve candidate's previous job match reports."""
    try:
        current_user_id = get_jwt_identity()
        matches, status_code = JobService.get_user_match_reports(current_user_id)
        return jsonify({'matches': matches}), status_code

    except Exception as e:
        logger.exception("Error in get_user_matches endpoint")
        return jsonify({'error': f'Failed to fetch job matches: {str(e)}'}), 500

@jobs_bp.route('/jobs/match/<report_id>', methods=['GET'])
@jwt_required()
def get_match_report_by_id(report_id):
    """GET /api/jobs/match/<report_id> - View detailed job compatibility report."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = JobService.get_match_report_by_id(current_user_id, report_id)
        return jsonify(response), status_code

    except Exception as e:
        logger.exception(f"Error in get_match_report_by_id for ID {report_id}")
        return jsonify({'error': f'Failed to fetch report: {str(e)}'}), 500

@jobs_bp.route('/jobs/match/<report_id>', methods=['DELETE'])
@jwt_required()
def delete_match_report_by_id(report_id):
    """DELETE /api/jobs/match/<report_id> - Delete a job match report."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = JobService.delete_match_report(current_user_id, report_id)
        return jsonify(response), status_code

    except Exception as e:
        logger.exception(f"Error in delete_match_report_by_id for ID {report_id}")
        return jsonify({'error': f'Failed to delete report: {str(e)}'}), 500
