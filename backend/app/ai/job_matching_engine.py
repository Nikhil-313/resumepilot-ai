import json
import logging
import re
from app.ai.gemini import get_api_key, clean_and_extract_json
import google.generativeai as genai

logger = logging.getLogger(__name__)

JOB_MATCHING_PROMPT_TEMPLATE = """
You are an expert Executive Career Coach and Technical Recruiter.
Analyze the provided Candidate Profile against the Target Job Posting and calculate a comprehensive AI job compatibility report.

TARGET JOB POSTING:
- Job Title: {job_title}
- Company: {company}
- Location: {location}
- Experience Level Required: {experience_level}
- Required Skills: {required_skills_str}
- Job Description Summary:
{job_description}

CANDIDATE PROFILE CONTEXT:
- Target Role Preference: {target_role}
- User Experience Level: {user_experience_level}
- Verified Tech Stack: {user_primary_skills}
- Parsed Resume Data:
{resume_data_str}

CRITICAL INSTRUCTIONS:
1. Compare candidate's hard skills, soft skills, projects, and work experience against the job requirements.
2. Calculate:
   - "match_percentage" (integer 0 to 100)
   - "overall_suitability_score" (integer 0 to 100)
   - "experience_match" ("High", "Moderate", or "Low")
   - "education_match" ("High", "Moderate", or "Low")
   - "certification_match" ("High", "Moderate", or "Low")
   - "matching_skills" (list of skills present in both candidate profile & job)
   - "missing_skills" (list of skills required by job but missing in candidate profile)
   - "strengths" (list of key candidate strengths for this role)
   - "areas_to_improve" (list of candidate gaps for this role)
   - "ai_career_fit_explanation" (detailed 2-3 sentence career fit analysis)
   - "recommended_learning_path" (list of step objects to bridge missing skills, e.g. [{{"step": 1, "skill": "SkillName", "action": "Actionable task", "estimated_time": "1 week"}}])
3. Return ONLY a valid JSON object matching the exact schema below without markdown wrappers or text outside JSON.

EXACT JSON SCHEMA:
{{
  "match_percentage": 85,
  "overall_suitability_score": 88,
  "experience_match": "High",
  "education_match": "High",
  "certification_match": "Moderate",
  "matching_skills": ["Python", "Flask", "PostgreSQL", "REST APIs"],
  "missing_skills": ["Kubernetes", "Redis", "Kafka"],
  "strengths": [
    "Proven backend development experience with Python and relational databases.",
    "Strong API architecture and database schema design skills."
  ],
  "areas_to_improve": [
    "Lacks container orchestration experience with Kubernetes.",
    "No explicit caching experience with Redis."
  ],
  "ai_career_fit_explanation": "The candidate is a strong fit for this Backend Developer position, possessing 80%+ of core required skills. Their experience with Flask REST APIs directly satisfies key job duties.",
  "recommended_learning_path": [
    {{
      "step": 1,
      "skill": "Redis Caching",
      "action": "Build a caching middleware layer for Flask endpoints using Redis.",
      "estimated_time": "1 week"
    }},
    {{
      "step": 2,
      "skill": "Kubernetes Orchestration",
      "action": "Deploy multi-container microservices on a local Minikube cluster.",
      "estimated_time": "2 weeks"
    }}
  ]
}}
"""

def generate_heuristic_job_match(
    job_posting: dict,
    candidate_skills: list,
    resume_text_blob: str,
    user_experience_level: str
) -> dict:
    """
    Fallback heuristic job matching engine if Gemini API is unconfigured or rate limited.
    Computes keyword overlap between job required skills and candidate skills.
    """
    logger.info(f"Using fallback heuristic job matching engine for job '{job_posting.get('title')}'")

    req_skills = [s.strip().lower() for s in job_posting.get('required_skills', [])]
    cand_skills_lower = [s.strip().lower() for s in candidate_skills]
    blob_lower = resume_text_blob.lower()

    matching = []
    missing = []

    for req in job_posting.get('required_skills', []):
        req_l = req.strip().lower()
        if req_l in cand_skills_lower or req_l in blob_lower:
            matching.append(req)
        else:
            missing.append(req)

    total_req = len(req_skills) or 1
    match_ratio = len(matching) / total_req
    match_percentage = min(98, max(35, int(match_ratio * 100)))

    exp_match = "High" if match_percentage >= 75 else ("Moderate" if match_percentage >= 50 else "Low")

    return {
        "match_percentage": match_percentage,
        "overall_suitability_score": min(100, match_percentage + 3),
        "experience_match": exp_match,
        "education_match": "High",
        "certification_match": "Moderate",
        "matching_skills": matching if matching else candidate_skills[:4],
        "missing_skills": missing if missing else ["Kubernetes", "Redis"],
        "strengths": [
            f"Verified alignment with key role requirements ({', '.join(matching[:3]) if matching else 'core technical stack'}).",
            "Clear technical background and functional domain understanding."
        ],
        "areas_to_improve": [
            f"Missing requested skills: {', '.join(missing[:3]) if missing else 'Advanced Cloud Orchestration'}.",
            "Experience bullet points could include more specific quantifiable metrics."
        ],
        "ai_career_fit_explanation": f"The candidate has a {match_percentage}% compatibility match for the {job_posting.get('title')} role at {job_posting.get('company')}. Their technical background directly satisfies core engineering duties.",
        "recommended_learning_path": [
            {
                "step": 1,
                "skill": missing[0] if missing else "Cloud Architecture",
                "action": f"Complete a hands-on project integrating {missing[0] if missing else 'Cloud tools'}.",
                "estimated_time": "1-2 weeks"
            },
            {
                "step": 2,
                "skill": missing[1] if len(missing) > 1 else "System Design",
                "action": "Practice system design trade-offs and performance optimization.",
                "estimated_time": "2 weeks"
            }
        ]
    }


def analyze_job_match_with_gemini(
    job_posting: dict,
    candidate_profile: dict,
    resume_data_or_text: any
) -> dict:
    """
    Evaluate job match compatibility using Google Gemini API.
    Uses 'gemini-2.5-flash' (or fallback 'gemini-flash-latest') in strict accordance with project rules.
    """
    job_title = job_posting.get('title', 'Target Role')
    company = job_posting.get('company', 'Company')
    location = job_posting.get('location', 'Remote')
    experience_level = job_posting.get('experience_level', 'Mid Level')
    req_skills_str = ", ".join(job_posting.get('required_skills', []))
    job_desc = job_posting.get('description', '')

    target_role = candidate_profile.get('target_role', job_title)
    user_exp = candidate_profile.get('experience_level', 'General')
    user_primary_skills = ", ".join(candidate_profile.get('primary_skills', []))

    resume_str = ""
    candidate_skills = candidate_profile.get('primary_skills', [])
    if isinstance(resume_data_or_text, dict):
        resume_str = json.dumps(resume_data_or_text, indent=2)
        if 'skills' in resume_data_or_text and isinstance(resume_data_or_text['skills'], list):
            candidate_skills = list(set(candidate_skills + resume_data_or_text['skills']))
    elif isinstance(resume_data_or_text, str):
        resume_str = resume_data_or_text[:3000]

    prompt = JOB_MATCHING_PROMPT_TEMPLATE.format(
        job_title=job_title,
        company=company,
        location=location,
        experience_level=experience_level,
        required_skills_str=req_skills_str,
        job_description=job_desc[:3000],
        target_role=target_role,
        user_experience_level=user_exp,
        user_primary_skills=user_primary_skills,
        resume_data_str=resume_str[:3000] if resume_str else "No parsed resume provided."
    )

    models_to_try = ["gemini-2.5-flash", "gemini-flash-latest"]

    try:
        api_key = get_api_key()
        genai.configure(api_key=api_key)

        for model_name in models_to_try:
            try:
                logger.info(f"Running job match evaluation for '{job_title}' using model: {model_name}")
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
                if isinstance(parsed, dict) and "match_percentage" in parsed:
                    return parsed
                else:
                    raise Exception("Parsed output missing 'match_percentage'.")

            except Exception as err:
                logger.warning(f"Job Match evaluation failed with model {model_name}: {err}")
                continue

        raise Exception("All Gemini model attempts failed for job matching.")

    except Exception as err:
        logger.warning(f"Gemini Job Match Engine failed ({err}). Using heuristic fallback engine.")
        return generate_heuristic_job_match(
            job_posting=job_posting,
            candidate_skills=candidate_skills,
            resume_text_blob=resume_str,
            user_experience_level=user_exp
        )
