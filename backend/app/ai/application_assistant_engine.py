import json
import logging
from datetime import datetime
from app.ai.gemini import get_api_key, clean_and_extract_json
import google.generativeai as genai

logger = logging.getLogger(__name__)

FOLLOWUP_PROMPT_TEMPLATE = """
You are an expert Executive Career Coach assisting a candidate with writing a polite, professional follow-up email/message.

APPLICATION DETAILS:
- Target Job Title: {job_title}
- Company Name: {company_name}
- Current Stage: {current_stage}
- Application Notes/Context: {notes}
- Days Since Last Activity: {days_since_activity}

CRITICAL RULES:
1. Write a clear, concise, professional follow-up email tailored to the candidate's current stage ({current_stage}) at {company_name}.
2. DO NOT invent fake interview promises, false feedback, or unverified hiring outcomes.
3. Express genuine enthusiasm for the role and inquire respectfully about the hiring timeline.
4. Return ONLY a valid JSON object matching the exact schema below without markdown code fences or text outside JSON.

EXACT JSON SCHEMA:
{{
  "subject": "Following up on {job_title} Application - Candidate Name",
  "message_body": "Dear Hiring Team,\\n\\nI hope this email finds you well...\\n\\nSincerely,\\nCandidate Name"
}}
"""

def generate_heuristic_followup(company_name: str, job_title: str, current_stage: str, days: int) -> dict:
    """Fallback deterministic follow-up generator when Gemini API is unconfigured or rate limited."""
    logger.info(f"Using fallback heuristic follow-up generator for '{job_title}' at '{company_name}'")

    subject = f"Following up on {job_title} Application - {company_name}"
    
    if current_stage in ['Interview', 'Final Round']:
        body = (
            f"Dear Hiring Team at {company_name},\n\n"
            f"I hope you are having a great week! I wanted to touch base regarding my recent interview for the {job_title} position. "
            f"I remain very enthusiastic about the opportunity to contribute to {company_name} and wanted to kindly check if there are any updates regarding next steps in the hiring process.\n\n"
            f"Please let me know if you need any additional information or work samples from my end.\n\n"
            f"Best regards,\nCandidate"
        )
    elif current_stage == 'Assessment':
        body = (
            f"Dear Hiring Team at {company_name},\n\n"
            f"I hope you are doing well. I am following up on my recently submitted technical assessment for the {job_title} role. "
            f"I enjoyed working through the assessment and look forward to hearing your feedback whenever convenient.\n\n"
            f"Thank you for your time and consideration.\n\n"
            f"Sincerely,\nCandidate"
        )
    else:
        body = (
            f"Dear Hiring Team at {company_name},\n\n"
            f"I hope this message finds you well. I am writing to reaffirm my strong interest in the {job_title} position. "
            f"Having submitted my application recently, I wanted to inquire if there are any updates regarding the initial review timeline.\n\n"
            f"Thank you for your time, and I look forward to potential next steps.\n\n"
            f"Best regards,\nCandidate"
        )

    return {
        "subject": subject,
        "message_body": body
    }


def generate_followup_with_gemini(
    company_name: str,
    job_title: str,
    current_stage: str = "Applied",
    notes: str = "",
    last_activity_date_str: str = ""
) -> dict:
    """Generate professional follow-up email using Google Gemini API."""
    days_since = 7
    if last_activity_date_str:
        try:
            dt = datetime.strptime(last_activity_date_str[:10], '%Y-%m-%d')
            days_since = (datetime.utcnow() - dt).days
        except Exception:
            pass

    prompt = FOLLOWUP_PROMPT_TEMPLATE.format(
        job_title=job_title or "Position",
        company_name=company_name or "Hiring Team",
        current_stage=current_stage or "Applied",
        notes=notes or "None provided",
        days_since_activity=days_since if days_since >= 0 else 5
    )

    models_to_try = ["gemini-2.5-flash", "gemini-flash-latest"]

    try:
        api_key = get_api_key()
        genai.configure(api_key=api_key)

        for model_name in models_to_try:
            try:
                logger.info(f"Generating AI follow-up for '{job_title}' using model: {model_name}")
                generation_config = {"response_mime_type": "application/json", "temperature": 0.3}

                try:
                    model = genai.GenerativeModel(
                        model_name=model_name,
                        generation_config=generation_config
                    )
                    response = model.generate_content(prompt)
                except Exception as e:
                    logger.warning(f"GenerativeModel init with response_mime_type failed for {model_name}: {e}. Retrying standard prompt...")
                    model = genai.GenerativeModel(model_name=model_name)
                    response = model.generate_content(prompt)

                if not response or not hasattr(response, 'text') or not response.text:
                    raise Exception(f"Model {model_name} returned empty text response.")

                parsed = clean_and_extract_json(response.text)
                if isinstance(parsed, dict) and "subject" in parsed and "message_body" in parsed:
                    return parsed
                else:
                    raise Exception("Parsed output missing 'subject' or 'message_body'.")

            except Exception as err:
                logger.warning(f"AI follow-up generation failed with model {model_name}: {err}")
                continue

        raise Exception("All Gemini model attempts failed for AI follow-up assistant.")

    except Exception as err:
        logger.warning(f"Gemini Application Assistant Engine failed ({err}). Using heuristic fallback engine.")
        return generate_heuristic_followup(company_name, job_title, current_stage, days_since)
