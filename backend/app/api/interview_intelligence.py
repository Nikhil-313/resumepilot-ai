import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.interview_intelligence_service import InterviewIntelligenceService
from app.services.interview_practice_service import InterviewPracticeService

logger = logging.getLogger(__name__)
interview_intelligence_bp = Blueprint('interview_intelligence', __name__)

@interview_intelligence_bp.route('/interview-intelligence/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """GET /api/interview-intelligence/dashboard - Retrieve complete interview intelligence data."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = InterviewIntelligenceService.get_dashboard(current_user_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception("Error in get_dashboard endpoint")
        return jsonify({'error': f'Failed to fetch interview intelligence dashboard: {str(e)}'}), 500

@interview_intelligence_bp.route('/interview-intelligence/trends', methods=['GET'])
@jwt_required()
def get_trends():
    """GET /api/interview-intelligence/trends - Retrieve performance trends."""
    try:
        current_user_id = get_jwt_identity()
        dash, status_code = InterviewIntelligenceService.get_dashboard(current_user_id)
        if status_code != 200:
            return jsonify(dash), status_code
        return jsonify({
            'performance_overview': dash.get('performance_overview'),
            'trends': dash.get('trends')
        }), 200
    except Exception as e:
        logger.exception("Error in get_trends endpoint")
        return jsonify({'error': f'Failed to fetch trends: {str(e)}'}), 500

@interview_intelligence_bp.route('/interview-intelligence/strengths', methods=['GET'])
@jwt_required()
def get_strengths():
    """GET /api/interview-intelligence/strengths - Retrieve recurring strengths."""
    try:
        current_user_id = get_jwt_identity()
        dash, status_code = InterviewIntelligenceService.get_dashboard(current_user_id)
        if status_code != 200:
            return jsonify(dash), status_code
        return jsonify({'strengths': dash.get('recurring_strengths', [])}), 200
    except Exception as e:
        logger.exception("Error in get_strengths endpoint")
        return jsonify({'error': f'Failed to fetch strengths: {str(e)}'}), 500

@interview_intelligence_bp.route('/interview-intelligence/weaknesses', methods=['GET'])
@jwt_required()
def get_weaknesses():
    """GET /api/interview-intelligence/weaknesses - Retrieve recurring weaknesses."""
    try:
        current_user_id = get_jwt_identity()
        dash, status_code = InterviewIntelligenceService.get_dashboard(current_user_id)
        if status_code != 200:
            return jsonify(dash), status_code
        return jsonify({'weaknesses': dash.get('recurring_weaknesses', [])}), 200
    except Exception as e:
        logger.exception("Error in get_weaknesses endpoint")
        return jsonify({'error': f'Failed to fetch weaknesses: {str(e)}'}), 500

@interview_intelligence_bp.route('/interview-intelligence/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations():
    """GET /api/interview-intelligence/recommendations - Retrieve practice recommendations."""
    try:
        current_user_id = get_jwt_identity()
        recs, status_code = InterviewPracticeService.get_user_recommendations(current_user_id)
        return jsonify({'recommendations': recs}), status_code
    except Exception as e:
        logger.exception("Error in get_recommendations endpoint")
        return jsonify({'error': f'Failed to fetch recommendations: {str(e)}'}), 500

@interview_intelligence_bp.route('/interview-intelligence/recommendations/<id>', methods=['PUT'])
@jwt_required()
def update_recommendation(id):
    """PUT /api/interview-intelligence/recommendations/<id> - Update recommendation status."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        status = data.get('status')

        if not status:
            return jsonify({'error': 'status parameter is required.'}), 400

        response, status_code = InterviewPracticeService.update_recommendation_status(current_user_id, id, status)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception(f"Error updating recommendation {id}")
        return jsonify({'error': f'Failed to update recommendation: {str(e)}'}), 500

@interview_intelligence_bp.route('/interview-intelligence/coach', methods=['POST'])
@jwt_required()
def generate_coach():
    """POST /api/interview-intelligence/coach - Generate AI interview coaching."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = InterviewIntelligenceService.generate_ai_coaching(current_user_id)
        return jsonify(response), status_code
    except Exception as e:
        logger.exception("Error generating AI interview coaching")
        return jsonify({'error': f'Failed to generate coaching: {str(e)}'}), 500
