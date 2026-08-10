import json
import logging
from app.ai.gemini import get_api_key, clean_and_extract_json
import google.generativeai as genai

logger = logging.getLogger(__name__)

INTERVIEW_COACH_PROMPT_TEMPLATE = """
You are an expert Technical Interview Coach and Talent Assessor.
Synthesize the candidate's actual historical mock interview evaluation evidence into a qualitative coaching assessment.

CANDIDATE HISTORICAL INTERVIEW DATA:
- Target Role / Primary Role: {target_role}
- Completed Sessions Evaluated: {total_sessions}
- Latest Session Score: {latest_score}% (Technical: {latest_tech}%, Communication: {latest_comm}%, Problem Solving: {latest_problem}%, Confidence: {latest_conf}%)
- Recurring Strengths: {recurring_strengths_str}
- Recurring Weaknesses: {recurring_weaknesses_str}
- Performance Trend: {trend_str}

CRITICAL RULES:
1. DO NOT invent fake interview scores, unverified questions, or fake achievements.
2. Provide actionable, empowering coaching tailored to candidate's actual strengths and weaknesses.
3. Return ONLY a valid JSON object matching the exact schema below without markdown fences or text outside JSON.

EXACT JSON SCHEMA:
{{
  "summary": "You have demonstrated strong technical reasoning in software architecture, showing steady communication improvement across recent mock sessions.",
  "biggest_strength": "Technical accuracy and clear explanation of database schemas and API microservices.",
  "biggest_weakness": "Structuring STAR-style responses concisely during high-pressure timed questions.",
  "next_practice_priority": "Practice 60-second concise STAR summaries for technical behavioral questions.",
  "interview_strategy": "Lead with your architectural solution first before diving into implementation details.",
  "preparation_plan": [
    "Review technical explanations for system design trade-offs.",
    "Record 2-minute timed responses focusing on active problem formulation.",
    "Complete a 5-question timed mock interview session."
  ]
}}
"""

def generate_heuristic_interview_coaching(data: dict) -> dict:
    """Fallback deterministic interview coach engine when Gemini API is unconfigured or rate-limited."""
    target_role = data.get('target_role') or 'Software Engineer'
    latest_score = data.get('latest_score', 75)
    weaknesses = data.get('recurring_weaknesses', [])
    strengths = data.get('recurring_strengths', [])

    w_str = weaknesses[0]['weakness'] if (weaknesses and isinstance(weaknesses[0], dict)) else "Technical explanation conciseness"
    s_str = strengths[0]['strength'] if (strengths and isinstance(strengths[0], dict)) else "Solid technical accuracy"

    return {
        "summary": f"Based on your evaluated mock interviews for {target_role}, your overall interview performance is standing at {latest_score}%.",
        "biggest_strength": f"Demonstrated strength in: {s_str}.",
        "biggest_weakness": f"Primary recurring area for practice: {w_str}.",
        "next_practice_priority": "Focus on structuring technical answers using the STAR framework.",
        "interview_strategy": "State your core technical approach clearly before elaborating on edge cases.",
        "preparation_plan": [
            "Practice structuring technical explanations into clear key points.",
            "Review past evaluation feedback in the Interview Intelligence workspace.",
            "Complete an adaptive 5-question mock interview session."
        ]
    }


def generate_interview_coaching_with_gemini(candidate_interview_data: dict) -> dict:
    """Run AI Interview Performance Coaching synthesis using Google Gemini API."""
    target_role = candidate_interview_data.get('target_role') or "Software Engineer"
    total_sessions = candidate_interview_data.get('total_sessions', 0)
    latest_score = candidate_interview_data.get('latest_score', 0)

    strengths_list = candidate_interview_data.get('recurring_strengths', [])
    weaknesses_list = candidate_interview_data.get('recurring_weaknesses', [])

    str_formatted = ", ".join([s['strength'] if isinstance(s, dict) else str(s) for s in strengths_list[:3]]) if strengths_list else "None noted"
    weak_formatted = ", ".join([w['weakness'] if isinstance(w, dict) else str(w) for w in weaknesses_list[:3]]) if weaknesses_list else "None noted"

    prompt = INTERVIEW_COACH_PROMPT_TEMPLATE.format(
        target_role=target_role,
        total_sessions=total_sessions,
        latest_score=latest_score,
        latest_tech=candidate_interview_data.get('latest_technical', 0),
        latest_comm=candidate_interview_data.get('latest_communication', 0),
        latest_problem=candidate_interview_data.get('latest_problem_solving', 0),
        latest_conf=candidate_interview_data.get('latest_confidence', 0),
        recurring_strengths_str=str_formatted,
        recurring_weaknesses_str=weak_formatted,
        trend_str=candidate_interview_data.get('overall_trend', 'Stable')
    )

    models_to_try = ["gemini-2.5-flash", "gemini-flash-latest"]

    try:
        api_key = get_api_key()
        genai.configure(api_key=api_key)

        for model_name in models_to_try:
            try:
                logger.info(f"Running AI Interview Coaching for role '{target_role}' using model: {model_name}")
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
                logger.warning(f"AI Interview Coaching failed with model {model_name}: {err}")
                continue

        raise Exception("All Gemini model attempts failed for AI interview coaching.")

    except Exception as err:
        logger.warning(f"Gemini Interview Coach Engine failed ({err}). Using heuristic fallback engine.")
        return generate_heuristic_interview_coaching(candidate_interview_data)
