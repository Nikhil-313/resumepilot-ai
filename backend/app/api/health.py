from flask import Blueprint, jsonify
from sqlalchemy import text
from app.extensions import db

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify API and Database status."""
    db_status = "connected"
    try:
        # Simple ping query to verify database connection
        db.session.execute(text('SELECT 1'))
    except Exception as e:
        db_status = f"error: {str(e)}"

    return jsonify({
        "status": "online",
        "service": "ResumePilot AI Backend",
        "version": "1.0.0",
        "database": db_status
    }), 200
