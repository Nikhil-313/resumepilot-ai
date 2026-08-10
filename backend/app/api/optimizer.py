import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.optimizer_service import OptimizerService

logger = logging.getLogger(__name__)
optimizer_bp = Blueprint('optimizer', __name__)

@optimizer_bp.route('/resume-optimizer/analyze', methods=['POST'])
@jwt_required()
def analyze_resume_optimization():
    """
    POST /api/resume-optimizer/analyze
    Generate AI resume optimization analysis.
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}

        resume_id = data.get('resume_id')
        target_role = data.get('target_role', 'Software Engineer')
        target_company = data.get('target_company', '')

        response, status_code = OptimizerService.analyze_resume(
            user_id=current_user_id,
            resume_id=resume_id,
            target_role=target_role,
            target_company=target_company
        )
        return jsonify(response), status_code

    except Exception as e:
        logger.exception("Error in analyze_resume_optimization endpoint")
        return jsonify({'error': f'Failed to optimize resume: {str(e)}'}), 500

@optimizer_bp.route('/resume-optimizer/history', methods=['GET'])
@jwt_required()
def get_optimization_history():
    """GET /api/resume-optimizer/history - Retrieve past optimization reports."""
    try:
        current_user_id = get_jwt_identity()
        history, status_code = OptimizerService.get_user_history(current_user_id)
        return jsonify({'history': history}), status_code
    except Exception as e:
        logger.exception("Error in get_optimization_history endpoint")
        return jsonify({'error': f'Failed to fetch optimization history: {str(e)}'}), 500

@optimizer_bp.route('/resume-optimizer/<optimization_id>', methods=['GET'])
@jwt_required()
def get_optimization_report(optimization_id):
    """GET /api/resume-optimizer/<optimization_id> - Retrieve single optimization report."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = OptimizerService.get_optimization(current_user_id, optimization_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error fetching optimization report {optimization_id}")
        return jsonify({'error': f'Failed to fetch optimization report: {str(e)}'}), 500

@optimizer_bp.route('/resume-optimizer/recommendation/<recommendation_id>', methods=['PUT'])
@jwt_required()
def update_recommendation_status(recommendation_id):
    """
    PUT /api/resume-optimizer/recommendation/<recommendation_id>
    Update recommendation status (pending, accepted, rejected).
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        status = data.get('status')

        if not status:
            return jsonify({'error': 'status parameter is required.'}), 400

        response, status_code = OptimizerService.update_recommendation_status(
            user_id=current_user_id,
            recommendation_id=recommendation_id,
            status=status
        )
        return jsonify(response), status_code

    except Exception as e:
        logger.exception(f"Error updating recommendation {recommendation_id}")
        return jsonify({'error': f'Failed to update recommendation: {str(e)}'}), 500

@optimizer_bp.route('/resume-optimizer/<optimization_id>', methods=['DELETE'])
@jwt_required()
def delete_optimization_report(optimization_id):
    """DELETE /api/resume-optimizer/<optimization_id> - Delete optimization report."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = OptimizerService.delete_optimization(current_user_id, optimization_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error deleting optimization report {optimization_id}")
        return jsonify({'error': f'Failed to delete optimization report: {str(e)}'}), 500
