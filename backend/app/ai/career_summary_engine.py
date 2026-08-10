import json
import logging
from app.ai.gemini import get_api_key, clean_and_extract_json
import google.generativeai as genai

logger = logging.getLogger(__name__)

CAREER_SUMMARY_PROMPT_TEMPLATE = """
You are an Executive Career Strategist and Technical Talent Advisor.
Synthesize the candidate's cross-module diagnostic evidence into an executive career summary.

CANDIDATE EVIDENCE SUMMARY:
- Target Role: {target_role}
- Resume Status: {resume_status}
- Latest ATS Score: {ats_score} (Missing Keywords: {ats_missing})
- Latest Interview Score: {interview_score} (Weaknesses: {interview_weaknesses})
- Best Job Match: {best_job_match}% (Missing Skills: {job_missing})
- Career Readiness Score: {career_readiness}%
- Application Pipeline: {active_apps} Active Applications, {interviews_count} Interviews, {offers_count} Offers.

CRITICAL RULES:
1. DO NOT invent fake candidate achievements, companies, or experience metrics.
2. Provide a sharp, empowering executive summary reflecting candidate's actual current standing.
3. Return ONLY a valid JSON object matching the exact schema below without markdown fences or text outside JSON.

EXACT JSON SCHEMA:
{{
  "summary": "You have a solid foundation in software engineering with verified API development experience, currently standing at an ATS score of {ats_score}% for {target_role} positions.",
  "biggest_strength": "High technical accuracy in backend API architecture and relational database schema design.",
  "biggest_weakness": "Resume keyword alignment for target cloud infrastructure skills like Docker and CI/CD.",
  "next_step": "Incorporate key target keywords into your resume and practice STAR-style responses in the AI Mock Interview Arena.",
  "short_term_focus": "Bridge top skill gaps in Docker and complete pending application follow-ups."
}}
"""

def generate_heuristic_career_summary(data: dict) -> dict:
    """Fallback deterministic career summary engine when Gemini API is unconfigured or rate-limited."""
    target_role = data.get('target_role') or 'Software Engineer'
    ats_score = data.get('ats_score') or 75
    interview_score = data.get('interview_score') or 70

    return {
        "summary": f"Your candidate profile is actively developing toward '{target_role}' positions, backed by an ATS score of {ats_score}% and interview rating of {interview_score}%.",
        "biggest_strength": "Strong core technical foundation and clear application tracking discipline.",
        "biggest_weakness": "Resume keyword optimization for high-priority ATS job requirements.",
        "next_step": "Review recommended actions in the Command Center and optimize your resume using the Resume Studio.",
        "short_term_focus": "Focus on high-priority skill gaps and schedule timely recruiter follow-ups."
    }


def generate_career_summary_with_gemini(candidate_data: dict) -> dict:
    """Run AI Career Executive Summary synthesis using Google Gemini API."""
    target_role = candidate_data.get('target_role') or "Software Engineer"
    ats_score = candidate_data.get('ats_score', "Not Assessed")
    interview_score = candidate_data.get('interview_score', "Not Assessed")
    best_job_match = candidate_data.get('best_job_match', 0)
    career_readiness = candidate_data.get('career_readiness', 75)

    prompt = CAREER_SUMMARY_PROMPT_TEMPLATE.format(
        target_role=target_role,
        resume_status=candidate_data.get('resume_filename', 'Uploaded'),
        ats_score=ats_score,
        ats_missing=", ".join(candidate_data.get('ats_missing_keywords', [])[:3]) or "None",
        interview_score=interview_score,
        interview_weaknesses=", ".join(candidate_data.get('interview_weaknesses', [])[:2]) or "None",
        best_job_match=best_job_match,
        job_missing=", ".join(candidate_data.get('job_missing_skills', [])[:3]) or "None",
        career_readiness=career_readiness,
        active_apps=candidate_data.get('active_applications', 0),
        interviews_count=candidate_data.get('interviews_count', 0),
        offers_count=candidate_data.get('offers_count', 0)
    )

    models_to_try = ["gemini-2.5-flash", "gemini-flash-latest"]

    try:
        api_key = get_api_key()
        genai.configure(api_key=api_key)

        for model_name in models_to_try:
            try:
                logger.info(f"Running AI Career Executive Summary for '{target_role}' using model: {model_name}")
                generation_config = {"response_mime_type": "application/json", "temperature": 0.2}

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
                if isinstance(parsed, dict) and "summary" in parsed:
                    return parsed
                else:
                    raise Exception("Parsed output missing 'summary'.")

            except Exception as err:
                logger.warning(f"AI Career Summary failed with model {model_name}: {err}")
                continue

        raise Exception("All Gemini model attempts failed for AI career summary.")

    except Exception as err:
        logger.warning(f"Gemini Career Summary Engine failed ({err}). Using heuristic fallback engine.")
        return generate_heuristic_career_summary(candidate_data)
