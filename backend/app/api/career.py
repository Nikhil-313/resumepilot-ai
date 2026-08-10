import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.career_service import CareerService

logger = logging.getLogger(__name__)
career_bp = Blueprint('career', __name__)

@career_bp.route('/career/plan', methods=['POST'])
@jwt_required()
def generate_career_plan():
    """
    POST /api/career/plan
    Generate or regenerate candidate's personalized AI Career Development Plan.
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        target_role = data.get('target_role')

        response, status_code = CareerService.generate_career_plan(
            user_id=current_user_id,
            target_role=target_role
        )
        return jsonify(response), status_code

    except Exception as e:
        logger.exception("Error in generate_career_plan endpoint")
        return jsonify({'error': f'Failed to generate career plan: {str(e)}'}), 500

@career_bp.route('/career/plan', methods=['GET'])
@jwt_required()
def get_career_plan():
    """GET /api/career/plan - Retrieve candidate's active career plan."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = CareerService.get_user_career_plan(current_user_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception("Error in get_career_plan endpoint")
        return jsonify({'error': f'Failed to fetch career plan: {str(e)}'}), 500

@career_bp.route('/career/goals', methods=['GET'])
@jwt_required()
def get_career_goals():
    """GET /api/career/goals - Retrieve career goals list."""
    try:
        current_user_id = get_jwt_identity()
        goals, status_code = CareerService.get_user_goals(current_user_id)
        return jsonify({'goals': goals}), status_code
    except Exception as e:
        logger.exception("Error in get_career_goals endpoint")
        return jsonify({'error': f'Failed to fetch career goals: {str(e)}'}), 500

@career_bp.route('/career/goals/<goal_id>', methods=['PUT'])
@jwt_required()
def update_career_goal_status(goal_id):
    """PUT /api/career/goals/<goal_id> - Update status of a career goal."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        status = data.get('status')

        if not status:
            return jsonify({'error': 'status parameter is required.'}), 400

        response, status_code = CareerService.update_goal_status(
            user_id=current_user_id,
            goal_id=goal_id,
            status=status
        )
        return jsonify(response), status_code

    except Exception as e:
        logger.exception(f"Error updating career goal {goal_id}")
        return jsonify({'error': f'Failed to update goal: {str(e)}'}), 500

@career_bp.route('/career/roadmap', methods=['GET'])
@jwt_required()
def get_skill_roadmap():
    """GET /api/career/roadmap - Retrieve personalized skill roadmap."""
    try:
        current_user_id = get_jwt_identity()
        roadmap, status_code = CareerService.get_user_roadmap(current_user_id)
        return jsonify({'roadmap': roadmap}), status_code
    except Exception as e:
        logger.exception("Error in get_skill_roadmap endpoint")
        return jsonify({'error': f'Failed to fetch skill roadmap: {str(e)}'}), 500

@career_bp.route('/career/roadmap/<roadmap_id>', methods=['PUT'])
@jwt_required()
def update_roadmap_skill_status(roadmap_id):
    """PUT /api/career/roadmap/<roadmap_id> - Update status of a skill roadmap item."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        status = data.get('status')

        if not status:
            return jsonify({'error': 'status parameter is required.'}), 400

        response, status_code = CareerService.update_roadmap_status(
            user_id=current_user_id,
            roadmap_id=roadmap_id,
            status=status
        )
        return jsonify(response), status_code

    except Exception as e:
        logger.exception(f"Error updating roadmap skill {roadmap_id}")
        return jsonify({'error': f'Failed to update skill: {str(e)}'}), 500

@career_bp.route('/career/plan', methods=['DELETE'])
@jwt_required()
def delete_career_plan():
    """DELETE /api/career/plan - Delete candidate's active career plan."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = CareerService.delete_career_plan(current_user_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception("Error in delete_career_plan endpoint")
        return jsonify({'error': f'Failed to delete career plan: {str(e)}'}), 500
