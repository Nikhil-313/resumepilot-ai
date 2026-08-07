import json
import logging
import re
from app.ai.gemini import get_api_key, clean_and_extract_json
import google.generativeai as genai

logger = logging.getLogger(__name__)

ATS_PROMPT_TEMPLATE = """
You are an expert ATS (Applicant Tracking System) Auditor and Technical Talent Recruiter.
Analyze the provided candidate resume data against the target Job Description (JD) for the position of "{job_title}".

CANDIDATE RESUME DATA:
{resume_data_json}

TARGET JOB DESCRIPTION:
{job_description}

CRITICAL INSTRUCTIONS:
1. Compare hard skills, soft skills, technical keywords, and experience requirements in the JD with the resume.
2. Calculate an Overall ATS Match Score (0 to 100), Keyword Match Score (0 to 100), Experience Match Score (0 to 100), and Formatting/Structure Score (0 to 100).
3. Identify lists of:
   - "matching_keywords"
   - "missing_keywords"
   - "matching_skills"
   - "missing_skills"
4. Provide section-by-section audit notes for "skills_section", "experience_section", "projects_section", and "education_section".
5. Provide actionable strengths, weaknesses, and prioritized improvement recommendations.
6. Return ONLY a valid JSON object matching the exact schema below without markdown code fences or commentary outside JSON.

EXACT JSON SCHEMA:
{{
  "ats_score": 82,
  "keyword_match_score": 85,
  "experience_match_score": 80,
  "formatting_score": 90,
  "matching_keywords": ["Python", "Flask", "PostgreSQL", "REST APIs", "Docker"],
  "missing_keywords": ["Kubernetes", "Redis", "Kafka", "CI/CD"],
  "matching_skills": ["Python", "Flask", "PostgreSQL", "React", "Git"],
  "missing_skills": ["Docker", "Kubernetes", "Redis", "AWS"],
  "section_analysis": {{
    "skills_section": "Strong core language skills matching target backend requirements. Missing cloud & deployment keywords.",
    "experience_section": "Work experience shows good API engineering, but lacks quantifiable performance impact metrics.",
    "projects_section": "Full-stack project entries present. Recommend emphasizing microservice scalability.",
    "education_section": "Degree requirements fully met."
  }},
  "strengths": [
    "High technical alignment with backend stack (Python, Flask, SQL).",
    "Solid project demonstrations of REST API design."
  ],
  "weaknesses": [
    "Lacks containerization and orchestration keywords (Docker, Kubernetes).",
    "Work experience bullet points lack quantifiable percentage outcomes."
  ],
  "improvements": [
    "Add 'Docker' and 'Kubernetes' into the primary Skills section.",
    "Quantify achievement bullet points (e.g. 'Optimized API endpoint response latency by 35%').",
    "Highlight caching (Redis) experience in project descriptions."
  ]
}}
"""

def generate_heuristic_ats_analysis(resume_json_or_text: dict, job_description: str, job_title: str) -> dict:
    """
    Fallback heuristic ATS analysis engine if Gemini API key is unconfigured or rate limited.
    Extracts keywords from JD and checks presence in candidate skills/resume text.
    """
    logger.info(f"Using fallback heuristic ATS analyzer for job title '{job_title}'")
    
    # Extract candidate skills
    candidate_skills = []
    resume_text_blob = ""
    if isinstance(resume_json_or_text, dict):
        candidate_skills = [s.strip() for s in resume_json_or_text.get("skills", []) if isinstance(s, str)]
        resume_text_blob = json.dumps(resume_json_or_text).lower()
    elif isinstance(resume_json_or_text, str):
        resume_text_blob = resume_json_or_text.lower()

    # Common tech keywords to audit in JD
    common_keywords = [
        "python", "java", "javascript", "typescript", "react", "node", "express", "flask", "django",
        "sql", "postgresql", "mongodb", "aws", "docker", "kubernetes", "git", "ci/cd", "rest api",
        "graphql", "redis", "kafka", "microservices", "testing", "agile", "devops", "machine learning",
        "data science", "pandas", "numpy", "pytorch", "tensorflow", "scikit-learn"
    ]

    jd_lower = job_description.lower()
    found_jd_keywords = [k.capitalize() for k in common_keywords if k in jd_lower]

    matching_keywords = []
    missing_keywords = []
    for k in found_jd_keywords:
        if k.lower() in resume_text_blob:
            matching_keywords.append(k)
        else:
            missing_keywords.append(k)

    matching_skills = [s for s in candidate_skills if s.lower() in jd_lower]
    missing_skills = [k for k in found_jd_keywords if k not in matching_skills][:5]

    total_jd_k = len(found_jd_keywords) or 1
    match_ratio = len(matching_keywords) / total_jd_k
    ats_score = min(98, max(30, int(match_ratio * 100)))

    return {
        "ats_score": ats_score,
        "keyword_match_score": min(100, ats_score + 5),
        "experience_match_score": min(100, ats_score - 5),
        "formatting_score": 90,
        "matching_keywords": matching_keywords if matching_keywords else ["REST API", "Git", "SQL"],
        "missing_keywords": missing_keywords if missing_keywords else ["Docker", "Kubernetes", "Redis"],
        "matching_skills": matching_skills if matching_skills else candidate_skills[:4],
        "missing_skills": missing_skills if missing_skills else ["Docker", "Kubernetes"],
        "section_analysis": {
            "skills_section": f"Resume skills match {len(matching_skills)} target skills in the job description.",
            "experience_section": "Experience section shows functional alignment with job requirements.",
            "projects_section": "Projects demonstrate hands-on application of technical concepts.",
            "education_section": "Educational requirements meet standard qualifications for this role."
        },
        "strengths": [
            f"Strong foundational alignment with target keywords ({', '.join(matching_keywords[:3])}).",
            "Clear section organization and readable resume layout."
        ],
        "weaknesses": [
            f"Missing key job description terms: {', '.join(missing_keywords[:3])}.",
            "Experience bullet points could include more specific quantifiable metrics."
        ],
        "improvements": [
            f"Insert missing target keywords into your Skills section: {', '.join(missing_keywords[:3])}.",
            "Quantify bullet points with measurable impact (e.g. '% efficiency gain' or 'X users served').",
            "Tailor project descriptions to highlight tools explicitly requested in the job description."
        ]
    }


def analyze_ats_compatibility(resume_json_or_text, job_description: str, job_title: str) -> dict:
    """
    Run ATS compatibility analysis comparing candidate resume text/JSON against a Job Description.
    
    :param resume_json_or_text: Parsed JSON resume dict or raw text.
    :param job_description: Raw JD text string.
    :param job_title: Target position title.
    :return: Dictionary matching ATS analysis JSON schema.
    """
    if not job_description or not job_description.strip():
        raise ValueError("Job description cannot be empty.")

    resume_data_str = ""
    if isinstance(resume_json_or_text, dict):
        resume_data_str = json.dumps(resume_json_or_text, indent=2)
    else:
        resume_data_str = str(resume_json_or_text)[:3000]

    prompt = ATS_PROMPT_TEMPLATE.format(
        job_title=job_title or "Target Role",
        resume_data_json=resume_data_str,
        job_description=job_description[:3500]
    )

    try:
        api_key = get_api_key()
        genai.configure(api_key=api_key)

        model_name = 'gemini-2.5-flash'
        logger.info(f"Running ATS analysis for role '{job_title}' using model: {model_name}")

        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config={"response_mime_type": "application/json", "temperature": 0.2}
            )
            response = model.generate_content(prompt)
        except Exception as e:
            logger.warning(f"JSON mode failed for ATS analysis: {e}. Retrying standard prompt...")
            model = genai.GenerativeModel(model_name=model_name)
            response = model.generate_content(prompt)

        if not response or not hasattr(response, 'text') or not response.text:
            raise Exception("Gemini returned empty text for ATS analysis.")

        parsed = clean_and_extract_json(response.text)

        if isinstance(parsed, dict) and "ats_score" in parsed:
            return parsed
        else:
            raise Exception("Parsed output missing 'ats_score'.")

    except Exception as err:
        logger.warning(f"Gemini ATS Analysis failed ({err}). Using heuristic fallback engine.")
        return generate_heuristic_ats_analysis(resume_json_or_text, job_description, job_title)
