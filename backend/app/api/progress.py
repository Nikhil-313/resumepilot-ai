import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.progress_service import ProgressService

logger = logging.getLogger(__name__)
progress_bp = Blueprint('progress', __name__)

@progress_bp.route('/progress/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """GET /api/progress/dashboard - Retrieve complete progress dashboard."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = ProgressService.get_dashboard(current_user_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception("Error in get_dashboard endpoint")
        return jsonify({'error': f'Failed to fetch progress dashboard: {str(e)}'}), 500

@progress_bp.route('/progress/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    """GET /api/progress/tasks - Retrieve candidate progress tasks."""
    try:
        current_user_id = get_jwt_identity()
        category = request.args.get('category')
        status = request.args.get('status')
        tasks, status_code = ProgressService.get_tasks(current_user_id, category=category, status=status)
        return jsonify({'tasks': tasks}), status_code
    except Exception as e:
        logger.exception("Error in get_tasks endpoint")
        return jsonify({'error': f'Failed to fetch tasks: {str(e)}'}), 500

@progress_bp.route('/progress/tasks/<task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    """PUT /api/progress/tasks/<task_id> - Update task status."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        status = data.get('status')

        if not status:
            return jsonify({'error': 'status parameter is required.'}), 400

        response, status_code = ProgressService.update_task_status(current_user_id, task_id, status)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error updating task {task_id}")
        return jsonify({'error': f'Failed to update task: {str(e)}'}), 500

@progress_bp.route('/progress/milestones', methods=['GET'])
@jwt_required()
def get_milestones():
    """GET /api/progress/milestones - Retrieve milestones."""
    try:
        current_user_id = get_jwt_identity()
        dash, status_code = ProgressService.get_dashboard(current_user_id)
        if status_code != 200:
            return jsonify(dash), status_code
        return jsonify({'milestones': dash.get('milestones', [])}), 200
    except Exception as e:
        logger.exception("Error in get_milestones endpoint")
        return jsonify({'error': f'Failed to fetch milestones: {str(e)}'}), 500

@progress_bp.route('/progress/weekly', methods=['GET'])
@jwt_required()
def get_weekly():
    """GET /api/progress/weekly - Retrieve weekly summary."""
    try:
        current_user_id = get_jwt_identity()
        dash, status_code = ProgressService.get_dashboard(current_user_id)
        if status_code != 200:
            return jsonify(dash), status_code
        return jsonify({'weekly': dash.get('weekly', {})}), 200
    except Exception as e:
        logger.exception("Error in get_weekly endpoint")
        return jsonify({'error': f'Failed to fetch weekly summary: {str(e)}'}), 500

@progress_bp.route('/progress/monthly', methods=['GET'])
@jwt_required()
def get_monthly():
    """GET /api/progress/monthly - Retrieve monthly summary."""
    try:
        current_user_id = get_jwt_identity()
        dash, status_code = ProgressService.get_dashboard(current_user_id)
        if status_code != 200:
            return jsonify(dash), status_code
        return jsonify({'monthly': dash.get('overall', {})}), 200
    except Exception as e:
        logger.exception("Error in get_monthly endpoint")
        return jsonify({'error': f'Failed to fetch monthly summary: {str(e)}'}), 500

@progress_bp.route('/progress/trends', methods=['GET'])
@jwt_required()
def get_trends():
    """GET /api/progress/trends - Retrieve progress trends."""
    try:
        current_user_id = get_jwt_identity()
        dash, status_code = ProgressService.get_dashboard(current_user_id)
        if status_code != 200:
            return jsonify(dash), status_code
        return jsonify({
            'overall': dash.get('overall'),
            'weekly_trend': dash.get('weekly', {}).get('weekly_trend', 'Stable')
        }), 200
    except Exception as e:
        logger.exception("Error in get_trends endpoint")
        return jsonify({'error': f'Failed to fetch trends: {str(e)}'}), 500

@progress_bp.route('/progress/sync', methods=['POST'])
@jwt_required()
def sync_progress():
    """POST /api/progress/sync - Synchronize actionable tasks from existing modules."""
    try:
        current_user_id = get_jwt_identity()
        ProgressService.sync_tasks_from_modules(current_user_id)
        dash, status_code = ProgressService.get_dashboard(current_user_id)
        return jsonify({'message': 'Progress synchronized successfully.', 'dashboard': dash}), status_code
    except Exception as e:
        logger.exception("Error in sync_progress endpoint")
        return jsonify({'error': f'Failed to sync progress: {str(e)}'}), 500

@progress_bp.route('/progress/coach', methods=['POST'])
@jwt_required()
def generate_coach():
    """POST /api/progress/coach - Generate AI progress coaching."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = ProgressService.generate_ai_coach(current_user_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception("Error generating AI progress coaching")
        return jsonify({'error': f'Failed to generate coach: {str(e)}'}), 500
