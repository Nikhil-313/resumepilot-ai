from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    create_access_token
)
from app.services.auth_service import AuthService
from app.models.user import User

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """POST /api/v1/auth/register - Candidate Account Registration"""
    data = request.get_json() or {}
    response, status_code = AuthService.register_user(data)
    return jsonify(response), status_code

@auth_bp.route('/login', methods=['POST'])
def login():
    """POST /api/v1/auth/login - Candidate Authentication"""
    data = request.get_json() or {}
    response, status_code = AuthService.authenticate_user(data)
    return jsonify(response), status_code

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """POST /api/v1/auth/refresh - Refresh Access Token using valid Refresh Token"""
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    return jsonify({
        'access_token': new_access_token
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """GET /api/v1/auth/me - Fetch Currently Authenticated User Profile"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404
    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """PUT /api/v1/auth/profile - Update Target Role & Candidate Profile"""
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    response, status_code = AuthService.update_profile(current_user_id, data)
    return jsonify(response), status_code

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """POST /api/v1/auth/logout - Client-side Logout Acknowledgment"""
    return jsonify({'message': 'Logged out successfully.'}), 200
