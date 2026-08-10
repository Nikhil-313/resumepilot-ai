import json
import logging
from app.ai.gemini import get_api_key, clean_and_extract_json
import google.generativeai as genai

logger = logging.getLogger(__name__)

PROGRESS_COACH_PROMPT_TEMPLATE = """
You are an Executive Career Coach and Execution Specialist.
Synthesize the candidate's actual completed career execution evidence into a progress assessment.

CANDIDATE PROGRESS EVIDENCE:
- Overall Execution Progress: {overall_progress}%
- Career Goals Completed: {goals_completed} of {goals_total}
- Roadmap Skills Completed: {skills_completed} of {skills_total}
- Active Applications Tracked: {applications_count}
- Completed Interview Practice: {interview_recs_completed}
- Active Pending Tasks: {pending_tasks_count}

CRITICAL RULES:
1. DO NOT invent fake candidate accomplishments, completed tasks, or unverified achievements.
2. Provide empowering, sharp coaching focused on execution momentum for the next 7 days.
3. Return ONLY a valid JSON object matching the exact schema below without markdown fences or text outside JSON.

EXACT JSON SCHEMA:
{{
  "summary": "You are making steady progress toward your career goals, having completed key roadmap skills and maintaining active job application tracking.",
  "biggest_accomplishment": "Completing target technical skills in your learning roadmap.",
  "biggest_blocker": "Completing pending recruiter follow-ups for active applications.",
  "next_7_days": [
    "Complete 1 pending STAR interview practice recommendation.",
    "Follow up on active job application pipelines.",
    "Advance the next item on your skill learning roadmap."
  ]
}}
"""

def generate_heuristic_progress_coaching(data: dict) -> dict:
    """Fallback deterministic progress coach engine when Gemini API is unconfigured or rate-limited."""
    overall = data.get('overall_progress', 70)
    goals_c = data.get('goals_completed', 0)
    skills_c = data.get('skills_completed', 0)

    return {
        "summary": f"Your career execution momentum stands at {overall}%, backed by verified progress across goals and technical skill roadmaps.",
        "biggest_accomplishment": f"Successfully advancing {goals_c} career goals and {skills_c} roadmap skills.",
        "biggest_blocker": "Maintaining consistent weekly execution on high-priority practice tasks.",
        "next_7_days": [
            "Complete high-priority pending progress tasks.",
            "Review your weekly goal execution in the Progress workspace.",
            "Schedule upcoming recruiter follow-up reminders."
        ]
    }


def generate_progress_coaching_with_gemini(candidate_progress_data: dict) -> dict:
    """Run AI Progress Coaching synthesis using Google Gemini API."""
    prompt = PROGRESS_COACH_PROMPT_TEMPLATE.format(
        overall_progress=candidate_progress_data.get('overall_progress', 0),
        goals_completed=candidate_progress_data.get('goals_completed', 0),
        goals_total=candidate_progress_data.get('goals_total', 0),
        skills_completed=candidate_progress_data.get('skills_completed', 0),
        skills_total=candidate_progress_data.get('skills_total', 0),
        applications_count=candidate_progress_data.get('applications_count', 0),
        interview_recs_completed=candidate_progress_data.get('interview_recs_completed', 0),
        pending_tasks_count=candidate_progress_data.get('pending_tasks_count', 0)
    )

    models_to_try = ["gemini-2.5-flash", "gemini-flash-latest"]

    try:
        api_key = get_api_key()
        genai.configure(api_key=api_key)

        for model_name in models_to_try:
            try:
                logger.info(f"Running AI Progress Coaching using model: {model_name}")
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
                logger.warning(f"AI Progress Coaching failed with model {model_name}: {err}")
                continue

        raise Exception("All Gemini model attempts failed for AI progress coaching.")

    except Exception as err:
        logger.warning(f"Gemini Progress Coach Engine failed ({err}). Using heuristic fallback engine.")
        return generate_heuristic_progress_coaching(candidate_progress_data)
