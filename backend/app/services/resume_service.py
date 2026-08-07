import os
import uuid
import logging
from typing import Tuple, Dict, Any, List
from werkzeug.utils import secure_filename
from flask import current_app
from app.extensions import db
from app.models.resume import Resume
from app.ai.parser import parse_resume_pipeline, ParserError

logger = logging.getLogger(__name__)

class ResumeService:
    """Service layer managing resume PDF file operations and database CRUD."""

    @staticmethod
    def allowed_file(filename: str) -> bool:
        """Check if file has a .pdf extension."""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'pdf'

    @classmethod
    def upload_resume(cls, user_id: str, file) -> Tuple[Dict[str, Any], int]:
        """Validate, save PDF file with unique UUID name, and store Resume database record."""
        if not file or file.filename == '':
            return {'error': 'No file selected for upload.'}, 400

        if not cls.allowed_file(file.filename):
            return {'error': 'Invalid file format. Only PDF documents are allowed.'}, 400

        original_filename = secure_filename(file.filename)
        
        # Unique filename using UUID to prevent overwriting existing files
        unique_filename = f"{uuid.uuid4().hex}_{original_filename}"
        upload_folder = current_app.config['UPLOAD_FOLDER']
        os.makedirs(upload_folder, exist_ok=True)
        filepath = os.path.join(upload_folder, unique_filename)

        try:
            # Save physical file to backend/uploads/
            file.save(filepath)
            file_size = os.path.getsize(filepath)

            # Max size limit 10MB (10,485,760 bytes)
            max_size = current_app.config.get('MAX_CONTENT_LENGTH', 10 * 1024 * 1024)
            if file_size > max_size:
                os.remove(filepath)
                return {'error': 'File size exceeds maximum allowed limit of 10MB.'}, 400

            # Create Database Record
            resume = Resume(
                user_id=user_id,
                filename=original_filename,
                filepath=filepath,
                file_size=file_size,
                parsed_json=None
            )
            db.session.add(resume)
            db.session.commit()

            logger.info(f"Successfully uploaded resume ID {resume.id} for user {user_id}")

            return {
                'resume_id': resume.id,
                'filename': resume.filename,
                'status': 'uploaded',
                'resume': resume.to_dict()
            }, 201

        except Exception as e:
            logger.exception("Failed to save uploaded resume file")
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except OSError:
                    pass
            db.session.rollback()
            return {'error': f'Failed to upload resume file: {str(e)}'}, 500

    @classmethod
    def parse_resume(cls, user_id: str, resume_id: str) -> Tuple[Dict[str, Any], int]:
        """Trigger PyMuPDF text extraction and Gemini AI structured extraction for a resume."""
        logger.info(f"Parsing request received for resume_id={resume_id}, user_id={user_id}")
        
        resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
        if not resume:
            logger.warning(f"Resume {resume_id} not found for user {user_id}")
            return {'error': 'Resume not found or access denied.'}, 404

        if not os.path.exists(resume.filepath):
            logger.error(f"Source PDF missing at path: {resume.filepath}")
            return {'error': 'Resume source PDF file is missing from server storage.'}, 404

        try:
            # Run PDF -> Gemini Pipeline
            structured_data = parse_resume_pipeline(resume.filepath)
            
            # Save parsed JSON to database column
            resume.parsed_json = structured_data
            db.session.commit()

            logger.info(f"Successfully parsed resume_id={resume_id}")

            return {
                'message': 'Resume parsed successfully with Gemini AI.',
                'resume_id': resume.id,
                'parsed_json': structured_data,
                'resume': resume.to_dict()
            }, 200

        except ParserError as e:
            logger.error(f"ParserError for resume_id={resume_id}: {str(e)}")
            return {'error': str(e)}, 422
        except Exception as e:
            logger.exception(f"Unexpected exception parsing resume_id={resume_id}")
            db.session.rollback()
            return {'error': f'Unexpected parsing error: {str(e)}'}, 500

    @classmethod
    def get_user_resumes(cls, user_id: str) -> Tuple[List[Dict[str, Any]], int]:
        """Fetch all uploaded resumes belonging to the authenticated user."""
        resumes = Resume.query.filter_by(user_id=user_id).order_by(Resume.created_at.desc()).all()
        return [r.to_dict() for r in resumes], 200

    @classmethod
    def get_resume(cls, user_id: str, resume_id: str) -> Tuple[Dict[str, Any], int]:
        """Fetch single resume details by ID with owner validation."""
        resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
        if not resume:
            return {'error': 'Resume not found or access denied.'}, 404
        return resume.to_dict(), 200

    @classmethod
    def update_resume(cls, user_id: str, resume_id: str, new_parsed_json: dict) -> Tuple[Dict[str, Any], int]:
        """Update parsed resume JSON data after candidate edits."""
        resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
        if not resume:
            return {'error': 'Resume not found or access denied.'}, 404

        if not isinstance(new_parsed_json, dict):
            return {'error': 'Invalid JSON data payload.'}, 400

        try:
            resume.parsed_json = new_parsed_json
            db.session.commit()
            return {
                'message': 'Resume data updated successfully.',
                'resume': resume.to_dict()
            }, 200
        except Exception as e:
            logger.exception("Failed to update resume JSON")
            db.session.rollback()
            return {'error': f'Failed to update resume: {str(e)}'}, 500

    @classmethod
    def delete_resume(cls, user_id: str, resume_id: str) -> Tuple[Dict[str, Any], int]:
        """Delete resume record and remove physical file from storage."""
        resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
        if not resume:
            return {'error': 'Resume not found or access denied.'}, 404

        try:
            if os.path.exists(resume.filepath):
                try:
                    os.remove(resume.filepath)
                except OSError:
                    pass

            db.session.delete(resume)
            db.session.commit()
            return {'message': 'Resume deleted successfully.'}, 200
        except Exception as e:
            logger.exception("Failed to delete resume")
            db.session.rollback()
            return {'error': f'Failed to delete resume: {str(e)}'}, 500
