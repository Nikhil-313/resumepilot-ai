import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.application_service import ApplicationService

logger = logging.getLogger(__name__)
applications_bp = Blueprint('applications', __name__)

@applications_bp.route('/applications', methods=['POST'])
@jwt_required()
def create_manual_application():
    """POST /api/applications - Create a manual job application."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        response, status_code = ApplicationService.create_manual_application(current_user_id, data)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception("Error in create_manual_application endpoint")
        return jsonify({'error': f'Failed to create application: {str(e)}'}), 500

@applications_bp.route('/applications/from-job/<job_id>', methods=['POST'])
@jwt_required()
def create_application_from_job(job_id):
    """POST /api/applications/from-job/<job_id> - Track application from existing JobPosting."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        resume_id = data.get('resume_id')

        response, status_code = ApplicationService.create_application_from_job(
            user_id=current_user_id,
            job_id=job_id,
            resume_id=resume_id
        )
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error tracking application from job {job_id}")
        return jsonify({'error': f'Failed to track application: {str(e)}'}), 500

@applications_bp.route('/applications', methods=['GET'])
@jwt_required()
def get_user_applications():
    """
    GET /api/applications
    Retrieve candidate applications.
    Query params: stage, status, company, search, sort_by
    """
    try:
        current_user_id = get_jwt_identity()
        stage = request.args.get('stage')
        status = request.args.get('status')
        company = request.args.get('company')
        search = request.args.get('search')
        sort_by = request.args.get('sort_by', 'updated_at')

        apps, status_code = ApplicationService.get_user_applications(
            user_id=current_user_id,
            stage=stage,
            status=status,
            company=company,
            search=search,
            sort_by=sort_by
        )
        return jsonify({'applications': apps}), status_code
    except Exception as e:
        logger.exception("Error in get_user_applications endpoint")
        return jsonify({'error': f'Failed to fetch applications: {str(e)}'}), 500

@applications_bp.route('/applications/statistics', methods=['GET'])
@jwt_required()
def get_application_statistics():
    """GET /api/applications/statistics - Retrieve application statistics & smart recommendations."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = ApplicationService.get_application_statistics(current_user_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception("Error in get_application_statistics endpoint")
        return jsonify({'error': f'Failed to fetch statistics: {str(e)}'}), 500

@applications_bp.route('/applications/<application_id>', methods=['GET'])
@jwt_required()
def get_application_by_id(application_id):
    """GET /api/applications/<application_id> - Retrieve single application."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = ApplicationService.get_application_by_id(current_user_id, application_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error in get_application_by_id for {application_id}")
        return jsonify({'error': f'Failed to fetch application: {str(e)}'}), 500

@applications_bp.route('/applications/<application_id>', methods=['PUT'])
@jwt_required()
def update_application(application_id):
    """PUT /api/applications/<application_id> - Update application info."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        response, status_code = ApplicationService.update_application(current_user_id, application_id, data)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error updating application {application_id}")
        return jsonify({'error': f'Failed to update application: {str(e)}'}), 500

@applications_bp.route('/applications/<application_id>/stage', methods=['PUT'])
@jwt_required()
def update_application_stage(application_id):
    """PUT /api/applications/<application_id>/stage - Update application stage & status."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        stage = data.get('stage')
        status = data.get('status')

        if not stage:
            return jsonify({'error': 'stage parameter is required.'}), 400

        response, status_code = ApplicationService.update_application_stage(
            user_id=current_user_id,
            application_id=application_id,
            stage=stage,
            status=status
        )
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error updating stage for application {application_id}")
        return jsonify({'error': f'Failed to update stage: {str(e)}'}), 500

@applications_bp.route('/applications/<application_id>/activity', methods=['POST'])
@jwt_required()
def add_application_activity(application_id):
    """POST /api/applications/<application_id>/activity - Log activity."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        response, status_code = ApplicationService.add_activity(current_user_id, application_id, data)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error adding activity for application {application_id}")
        return jsonify({'error': f'Failed to add activity: {str(e)}'}), 500

@applications_bp.route('/applications/<application_id>/activities', methods=['GET'])
@jwt_required()
def get_application_activities(application_id):
    """GET /api/applications/<application_id>/activities - Get timeline activities."""
    try:
        current_user_id = get_jwt_identity()
        app_res, status_code = ApplicationService.get_application_by_id(current_user_id, application_id)
        if status_code != 200:
            return jsonify(app_res), status_code
        activities = app_res['application'].get('activities', [])
        return jsonify({'activities': activities}), 200
    except Exception as e:
        logger.exception(f"Error fetching activities for application {application_id}")
        return jsonify({'error': f'Failed to fetch activities: {str(e)}'}), 500

@applications_bp.route('/applications/<application_id>/follow-up', methods=['POST'])
@jwt_required()
def create_application_followup(application_id):
    """POST /api/applications/<application_id>/follow-up - Create scheduled follow-up."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        response, status_code = ApplicationService.create_followup(current_user_id, application_id, data)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error creating follow-up for application {application_id}")
        return jsonify({'error': f'Failed to create follow-up: {str(e)}'}), 500

@applications_bp.route('/applications/follow-up/<follow_up_id>', methods=['PUT'])
@jwt_required()
def update_application_followup(follow_up_id):
    """PUT /api/applications/follow-up/<follow_up_id> - Update follow-up status or notes."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        response, status_code = ApplicationService.update_followup(current_user_id, follow_up_id, data)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error updating follow-up {follow_up_id}")
        return jsonify({'error': f'Failed to update follow-up: {str(e)}'}), 500

@applications_bp.route('/applications/<application_id>/generate-followup', methods=['POST'])
@jwt_required()
def generate_ai_followup_message(application_id):
    """POST /api/applications/<application_id>/generate-followup - Generate AI follow-up message."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = ApplicationService.generate_ai_followup(current_user_id, application_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error generating AI follow-up for application {application_id}")
        return jsonify({'error': f'Failed to generate follow-up: {str(e)}'}), 500

@applications_bp.route('/applications/<application_id>', methods=['DELETE'])
@jwt_required()
def delete_application(application_id):
    """DELETE /api/applications/<application_id> - Delete job application."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = ApplicationService.delete_application(current_user_id, application_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error deleting application {application_id}")
        return jsonify({'error': f'Failed to delete application: {str(e)}'}), 500
