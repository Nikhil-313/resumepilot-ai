import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.command_center_service import CommandCenterService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)
command_center_bp = Blueprint('command_center', __name__)

@command_center_bp.route('/command-center', methods=['GET'])
@jwt_required()
def get_command_center_dashboard():
    """GET /api/command-center - Returns complete command center dashboard summary."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = CommandCenterService.get_dashboard_summary(current_user_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception("Error in get_command_center_dashboard endpoint")
        return jsonify({'error': f'Failed to fetch Command Center dashboard: {str(e)}'}), 500

@command_center_bp.route('/command-center/summary', methods=['GET'])
@jwt_required()
def get_command_center_summary():
    """GET /api/command-center/summary - Returns lightweight dashboard statistics."""
    try:
        current_user_id = get_jwt_identity()
        full_res, status_code = CommandCenterService.get_dashboard_summary(current_user_id)
        if status_code != 200:
            return jsonify(full_res), status_code

        lightweight = {
            'candidate_name': full_res.get('candidate_name'),
            'target_role': full_res.get('target_role'),
            'health_score': full_res.get('health', {}).get('score'),
            'quick_stats': full_res.get('quick_stats'),
            'unread_notifications_count': full_res.get('unread_notifications_count', 0)
        }
        return jsonify(lightweight), 200
    except Exception as e:
        logger.exception("Error in get_command_center_summary endpoint")
        return jsonify({'error': f'Failed to fetch summary: {str(e)}'}), 500

@command_center_bp.route('/command-center/actions', methods=['GET'])
@jwt_required()
def get_command_center_actions():
    """GET /api/command-center/actions - Returns prioritized recommended actions."""
    try:
        current_user_id = get_jwt_identity()
        full_res, status_code = CommandCenterService.get_dashboard_summary(current_user_id)
        if status_code != 200:
            return jsonify(full_res), status_code

        actions = full_res.get('priority_actions', [])
        return jsonify({'actions': actions}), 200
    except Exception as e:
        logger.exception("Error in get_command_center_actions endpoint")
        return jsonify({'error': f'Failed to fetch priority actions: {str(e)}'}), 500

@command_center_bp.route('/command-center/notifications', methods=['GET'])
@jwt_required()
def get_command_center_notifications():
    """GET /api/command-center/notifications - Returns candidate notifications."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = NotificationService.get_user_notifications(current_user_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception("Error in get_command_center_notifications endpoint")
        return jsonify({'error': f'Failed to fetch notifications: {str(e)}'}), 500

@command_center_bp.route('/command-center/notifications/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_as_read(notification_id):
    """PUT /api/command-center/notifications/<notification_id>/read - Mark notification as read."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = NotificationService.mark_as_read(current_user_id, notification_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error marking notification read {notification_id}")
        return jsonify({'error': f'Failed to update notification: {str(e)}'}), 500

@command_center_bp.route('/command-center/notifications/read-all', methods=['PUT'])
@jwt_required()
def mark_all_notifications_as_read():
    """PUT /api/command-center/notifications/read-all - Mark all notifications as read."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = NotificationService.mark_all_as_read(current_user_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception("Error marking all notifications read")
        return jsonify({'error': f'Failed to mark all notifications read: {str(e)}'}), 500

@command_center_bp.route('/command-center/notifications/<notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """DELETE /api/command-center/notifications/<notification_id> - Delete notification."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = NotificationService.delete_notification(current_user_id, notification_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error deleting notification {notification_id}")
        return jsonify({'error': f'Failed to delete notification: {str(e)}'}), 500

@command_center_bp.route('/command-center/ai-summary', methods=['POST'])
@jwt_required()
def generate_ai_career_summary():
    """POST /api/command-center/ai-summary - Generate AI Career Executive Summary."""
    try:
        current_user_id = get_jwt_identity()
        ai_summary = CommandCenterService.generate_ai_career_summary(current_user_id)
        return jsonify({'ai_summary': ai_summary}), 200
    except Exception as e:
        logger.exception("Error generating AI career summary")
        return jsonify({'error': f'Failed to generate AI career summary: {str(e)}'}), 500
