import os
import json
import re
import logging
from flask import current_app
import google.generativeai as genai
from app.ai.prompts import RESUME_PARSER_SYSTEM_PROMPT, RESUME_PARSER_USER_PROMPT

logger = logging.getLogger(__name__)

class GeminiServiceError(Exception):
    """Custom exception for Gemini API integration errors."""
    pass

REQUIRED_FIELDS = [
    "name", "email", "phone", "summary", "skills", "education",
    "experience", "projects", "certifications", "languages",
    "linkedin", "github", "portfolio"
]

def get_api_key() -> str:
    """Retrieve and validate the Gemini API key from Flask app config or environment."""
    api_key = ''
    try:
        if current_app:
            api_key = current_app.config.get('GEMINI_API_KEY', '')
    except RuntimeError:
        pass # Outside application context

    if not api_key:
        api_key = os.getenv('GEMINI_API_KEY', '')

    if not api_key or api_key.strip() in ['', 'your_google_gemini_api_key_here', 'your_gemini_api_key_here']:
        raise GeminiServiceError(
            "GEMINI_API_KEY is missing or unconfigured. "
            "Please add a valid Google Gemini API key to your backend/.env file."
        )

    return api_key.strip()

def clean_and_extract_json(raw_text: str) -> dict:
    """
    Extract and parse JSON from Gemini's response text.
    Handles raw JSON, markdown triple-backtick blocks, and embedded JSON objects.
    """
    if not raw_text or not raw_text.strip():
        raise GeminiServiceError("Gemini returned an empty response.")

    text = raw_text.strip()

    # Step 1: Remove markdown code fences if present
    if "```" in text:
        text = re.sub(r"^```(?:json)?\n?", "", text, flags=re.MULTILINE)
        text = re.sub(r"\n?```$", "", text, flags=re.MULTILINE)
        text = text.strip()

    # Step 2: Try direct JSON parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Step 3: Regex fallback to find the outer JSON object {...}
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as err:
            logger.error(f"Regex extracted text failed JSON parsing: {err}")

    raise GeminiServiceError(
        f"Failed to parse structured JSON from Gemini response. Raw output preview: {text[:200]}..."
    )

def validate_resume_json(data: dict) -> dict:
    """Ensure all 13 required schema fields are present with correct data types."""
    if not isinstance(data, dict):
        raise GeminiServiceError("Extracted data is not a valid JSON object.")

    validated = {}
    for field in REQUIRED_FIELDS:
        val = data.get(field)
        if field in ["skills", "education", "experience", "projects", "certifications", "languages"]:
            validated[field] = val if isinstance(val, list) else []
        else:
            validated[field] = str(val) if val is not None else ""

    return validated

def parse_resume_with_gemini(resume_text: str) -> dict:
    """
    Send extracted resume text to Google Gemini API and return structured JSON resume data.
    
    :param resume_text: Plain text extracted from PDF.
    :return: Validated dictionary containing all required fields.
    """
    if not resume_text or not resume_text.strip():
        raise GeminiServiceError("No readable text provided for Gemini AI processing.")

    api_key = get_api_key()
    logger.info("Initializing Gemini API client...")
    genai.configure(api_key=api_key)

    user_prompt = RESUME_PARSER_USER_PROMPT.format(resume_text=resume_text)

    # Models to try in order of preference
    models_to_try = [
    "gemini-2.5-flash",
    "gemini-flash-latest"
    ]
    last_exception = None

    for model_name in models_to_try:
        try:
            logger.info(f"Attempting resume extraction with model: {model_name}")
            
            # Configure model with system instruction and JSON output mode if supported
            generation_config = {"temperature": 0.1}
            try:
                generation_config["response_mime_type"] = "application/json"
            except Exception:
                pass

            try:
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=RESUME_PARSER_SYSTEM_PROMPT,
                    generation_config=generation_config
                )
                response = model.generate_content(user_prompt)
            except Exception as init_err:
                logger.warning(f"GenerativeModel init with system_instruction failed for {model_name}: {init_err}. Retrying standard prompt...")
                # Fallback without system_instruction parameter for older SDK versions
                model = genai.GenerativeModel(model_name=model_name)
                full_prompt = f"{RESUME_PARSER_SYSTEM_PROMPT}\n\n{user_prompt}"
                response = model.generate_content(full_prompt)

            if not response or not hasattr(response, 'text') or not response.text:
                raise GeminiServiceError(f"Model {model_name} returned empty text response.")

            logger.info(f"Successfully received response from {model_name}.")
            parsed_json = clean_and_extract_json(response.text)
            validated_json = validate_resume_json(parsed_json)
            return validated_json

        except Exception as err:
            import traceback

            print("\n" + "=" * 80)
            print(f"MODEL FAILED: {model_name}")
            traceback.print_exc()
            print("=" * 80 + "\n")

            logger.exception(f"Extraction failed with model {model_name}")

            last_exception = err
            continue

    # If all models failed
    error_msg = str(last_exception) if last_exception else "All Gemini model attempts failed."
    logger.error(f"Gemini API pipeline failed completely: {error_msg}")
    raise GeminiServiceError(f"Gemini AI Extraction Failed: {error_msg}")
