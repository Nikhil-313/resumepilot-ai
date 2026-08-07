import logging
from app.utils.pdf import extract_text_from_pdf, PDFProcessingError
from app.ai.gemini import parse_resume_with_gemini, GeminiServiceError

logger = logging.getLogger(__name__)

class ParserError(Exception):
    """General error raised during the parsing pipeline."""
    pass

def parse_resume_pipeline(filepath: str) -> dict:
    """
    Pipeline executing PDF text extraction via PyMuPDF and structured JSON parsing via Gemini AI.
    
    :param filepath: System path to PDF file.
    :return: Validated structured dictionary matching resume schema.
    """
    logger.info(f"Starting resume parsing pipeline for file: {filepath}")
    
    try:
        # Step 1: PDF Text Extraction via PyMuPDF
        logger.info("Extracting text from PDF via PyMuPDF...")
        raw_text = extract_text_from_pdf(filepath)
        logger.info(f"Successfully extracted {len(raw_text)} characters of text from PDF.")

        # Step 2: Gemini AI Structured Extraction
        logger.info("Sending extracted text to Gemini AI parser...")
        structured_json = parse_resume_with_gemini(raw_text)
        logger.info("Successfully extracted structured JSON from Gemini AI.")

        return structured_json

    except PDFProcessingError as e:
        logger.error(f"PDF Processing Error: {str(e)}")
        raise ParserError(f"PDF Parsing Failed: {str(e)}")

    except GeminiServiceError as e:
        logger.error(f"Gemini Service Error: {str(e)}")
        raise ParserError(f"AI Extraction Failed: {str(e)}")

    except Exception as e:
        logger.exception("Unexpected error in parse_resume_pipeline")
        raise ParserError(f"Unexpected Pipeline Error: {str(e)}")
