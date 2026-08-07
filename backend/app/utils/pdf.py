import fitz  # PyMuPDF
import os

class PDFProcessingError(Exception):
    """Custom exception raised during PDF parsing failures."""
    pass

def extract_text_from_pdf(filepath: str) -> str:
    """
    Extract readable plain text from a multi-page PDF document using PyMuPDF.
    
    :param filepath: Absolute or relative system path to the PDF file.
    :return: Cleaned text string with preserved line breaks.
    :raises PDFProcessingError: If file is missing, empty, or unreadable.
    """
    if not os.path.exists(filepath):
        raise PDFProcessingError(f"PDF file not found at path: {filepath}")

    try:
        doc = fitz.open(filepath)
        if doc.is_encrypted:
            raise PDFProcessingError("The uploaded PDF file is password protected or encrypted.")

        if doc.page_count == 0:
            raise PDFProcessingError("The uploaded PDF file contains no pages.")

        text_pages = []
        for page_num in range(doc.page_count):
            page = doc.load_page(page_num)
            # Extract text preserving layout blocks and line breaks
            page_text = page.get_text("text")
            if page_text.strip():
                text_pages.append(page_text.strip())

        doc.close()

        full_text = "\n\n--- PAGE BREAK ---\n\n".join(text_pages)
        if not full_text.strip():
            raise PDFProcessingError("No readable text could be extracted from the PDF. The file may contain scanned images only.")

        return full_text

    except fitz.FileDataError:
        raise PDFProcessingError("Corrupted or invalid PDF file format.")
    except Exception as e:
        if isinstance(e, PDFProcessingError):
            raise e
        raise PDFProcessingError(f"Failed to process PDF: {str(e)}")
