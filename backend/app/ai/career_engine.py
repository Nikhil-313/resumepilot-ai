import json
import logging
import re
from app.ai.gemini import get_api_key, clean_and_extract_json
import google.generativeai as genai

logger = logging.getLogger(__name__)

CAREER_PLANNING_PROMPT_TEMPLATE = """
You are an elite Executive Career Architect and Technical Hiring Strategist.
Build a personalized, highly actionable Career Development Plan and Skill Roadmap for the candidate aiming for the position of "{target_role}".

CANDIDATE CONTEXT:
- Target Role: {target_role}
- Current Experience Level: {user_experience_level}
- Primary Skills: {primary_skills_str}
- Parsed Resume Summary:
{resume_summary_str}

DIAGNOSTIC CROSS-MODULE EVIDENCE:
- ATS Missing Keywords/Skills (from past job scans): {ats_missing_skills_str}
- Interview Performance Weaknesses (from mock interviews): {interview_weaknesses_str}
- Job Match Missing Requirements (from job target scans): {job_missing_skills_str}

CRITICAL INSTRUCTIONS:
1. Synthesize candidate's actual skill gaps from ATS scans, interview scores, and job matching reports to prioritize roadmap skills for "{target_role}".
2. Calculate:
   - "overall_readiness_score" (integer 0 to 100)
   - "current_level" (string: e.g. "Junior / Entry", "Mid Level", "Senior Ready")
   - "career_summary" (detailed 2-3 sentence career assessment)
   - "strengths" (list of top verified candidate strengths)
   - "skill_gaps" (list of objects: [{{"skill": "SkillName", "current_level": "Missing", "why_it_matters": "Why needed for target role", "priority": "High"}}])
   - "goals" (list of objects: [{{"title": "Goal Title", "description": "Details", "category": "Short-term", "priority": "High", "target_date": "1-3 Months"}}]) Note: category MUST be "Short-term", "Medium-term", or "Long-term".
   - "skill_roadmap" (list of objects: [{{"skill_name": "SkillName", "current_level": "Missing", "target_level": "Proficient", "priority": "High", "reason": "Reason for roadmap", "recommended_resources": ["Official Documentation", "Guided Course"], "estimated_time": "2 weeks"}}])
   - "recommended_projects" (list of objects: [{{"title": "Project Idea", "description": "Overview", "skills_developed": ["Skill1", "Skill2"], "employability_impact": "Impact on resume"}}])
   - "interview_prep_recommendations" (list of specific practice actions based on candidate weaknesses)
   - "ats_resume_recommendations" (list of specific resume optimization actions based on missing ATS keywords)
   - "career_progression_explanation" (explanation of candidate's growth trajectory over the next 1-2 years)
3. Return ONLY a valid JSON object matching the exact schema below without markdown code fences or extra text outside JSON.

EXACT JSON SCHEMA:
{{
  "overall_readiness_score": 78,
  "current_level": "Mid Level",
  "career_summary": "The candidate possesses strong core foundational skills for the Software Engineer role, demonstrating solid REST API engineering and relational database design. However, advancing to senior roles requires container orchestration and cloud caching capabilities.",
  "strengths": [
    "Proven Python & Flask API design experience",
    "Solid PostgreSQL query optimization and schema modeling"
  ],
  "skill_gaps": [
    {{
      "skill": "Docker & Containerization",
      "current_level": "Missing",
      "why_it_matters": "Essential for containerized microservice deployments in target production environments.",
      "priority": "High"
    }},
    {{
      "skill": "Redis Caching",
      "current_level": "Missing",
      "why_it_matters": "Required to pass high-throughput backend architecture interviews.",
      "priority": "Medium"
    }}
  ],
  "goals": [
    {{
      "title": "Master Docker & Containerization Basics",
      "description": "Containerize existing Flask and PostgreSQL microservices and push images to Docker Hub.",
      "category": "Short-term",
      "priority": "High",
      "target_date": "1 Month"
    }},
    {{
      "title": "Build High-Scale Caching Architecture Project",
      "description": "Implement Redis caching layer for API response optimization.",
      "category": "Medium-term",
      "priority": "High",
      "target_date": "3 Months"
    }},
    {{
      "title": "Achieve Senior Engineer Interview Readiness",
      "description": "Complete mock system design interviews with 85%+ technical accuracy score.",
      "category": "Long-term",
      "priority": "Medium",
      "target_date": "6 Months"
    }}
  ],
  "skill_roadmap": [
    {{
      "skill_name": "Docker",
      "current_level": "Missing",
      "target_level": "Proficient",
      "priority": "High",
      "reason": "Crucial requirement identified across 80% of backend job match targets.",
      "recommended_resources": ["Docker Official Docs", "Containerization Crash Course"],
      "estimated_time": "2 weeks"
    }},
    {{
      "skill_name": "Redis Caching",
      "current_level": "Missing",
      "target_level": "Proficient",
      "priority": "Medium",
      "reason": "Reduces API latency and addresses missing ATS keyword gap.",
      "recommended_resources": ["Redis University", "Flask-Caching Docs"],
      "estimated_time": "1 week"
    }}
  ],
  "recommended_projects": [
    {{
      "title": "Containerized E-Commerce API Gateway",
      "description": "Build an API Gateway service with Redis rate-limiting and Docker container orchestration.",
      "skills_developed": ["Docker", "Redis", "Flask", "PostgreSQL"],
      "employability_impact": "Directly demonstrates high-concurrency microservice design to hiring managers."
    }}
  ],
  "interview_prep_recommendations": [
    "Practice framing behavioral answers using explicit STAR method quantifiable metrics.",
    "Review distributed caching mechanisms and database indexing internal trade-offs."
  ],
  "ats_resume_recommendations": [
    "Add 'Docker' and 'Redis' into the primary Skills section on your resume.",
    "Quantify achievement bullet points (e.g. 'Reduced SQL query latency by 40% using indexing')."
  ],
  "career_progression_explanation": "By completing the Docker and Redis roadmap over the next 3 months, the candidate will increase job match compatibility from 78% to 92%+, qualifying for Senior-track backend roles."
}}
"""

def generate_heuristic_career_plan(
    target_role: str,
    user_experience_level: str,
    primary_skills: list,
    ats_missing_skills: list,
    job_missing_skills: list,
    interview_weaknesses: list
) -> dict:
    """
    Fallback deterministic career planning engine when Gemini API is unconfigured or rate limited.
    Synthesizes real missing skills from candidate context.
    """
    logger.info(f"Using fallback heuristic career planning engine for role '{target_role}'")

    # Determine unique missing skills
    combined_missing = list(set(ats_missing_skills + job_missing_skills))
    if not combined_missing:
        combined_missing = ["Docker", "Kubernetes", "Redis", "CI/CD Pipeline"]

    readiness_score = max(55, min(92, 85 - len(combined_missing) * 4))

    skill_gaps = []
    skill_roadmap = []
    goals = []

    for idx, skill in enumerate(combined_missing[:4]):
        prio = "High" if idx < 2 else "Medium"
        skill_gaps.append({
            "skill": skill,
            "current_level": "Missing",
            "why_it_matters": f"Frequently required for target role {target_role} across job match listings.",
            "priority": prio
        })

        skill_roadmap.append({
            "skill_name": skill,
            "current_level": "Missing",
            "target_level": "Proficient",
            "priority": prio,
            "reason": f"Fills identified ATS & job description gap for {target_role}.",
            "recommended_resources": [f"{skill} Official Documentation", f"{skill} Hands-on Tutorial"],
            "estimated_time": f"{idx + 1} to {idx + 2} weeks"
        })

    # Goals
    goals.append({
        "title": f"Master {combined_missing[0]} Fundamentals",
        "description": f"Build a practical hands-on project incorporating {combined_missing[0]}.",
        "category": "Short-term",
        "priority": "High",
        "target_date": "1 Month"
    })
    if len(combined_missing) > 1:
        goals.append({
            "title": f"Integrate {combined_missing[1]} into Full-Stack Application",
            "description": f"Deploy a production-grade service showcasing {combined_missing[1]}.",
            "category": "Medium-term",
            "priority": "High",
            "target_date": "3 Months"
        })
    goals.append({
        "title": f"Target Senior {target_role} Interview Readiness",
        "description": "Achieve 85%+ overall readiness score across all AI mock interviews and ATS scans.",
        "category": "Long-term",
        "priority": "Medium",
        "target_date": "6 Months"
    })

    return {
        "overall_readiness_score": readiness_score,
        "current_level": user_experience_level or "Mid Level",
        "career_summary": f"Candidate demonstrates strong core competencies for {target_role}. Closing key skill gaps in {', '.join(combined_missing[:3])} will elevate career readiness significantly.",
        "strengths": [
            f"Verified foundational stack: {', '.join(primary_skills[:3]) if primary_skills else 'Software Engineering Basics'}.",
            "Clear technical background and structured problem-solving experience."
        ],
        "skill_gaps": skill_gaps,
        "goals": goals,
        "skill_roadmap": skill_roadmap,
        "recommended_projects": [
            {
                "title": f"{target_role} Capstone System Architecture",
                "description": f"Develop a scalable project integrating {', '.join(combined_missing[:2])} with existing {', '.join(primary_skills[:2]) if primary_skills else 'core stack'}.",
                "skills_developed": combined_missing[:3],
                "employability_impact": "Directly proves ability to deliver production-grade software features."
            }
        ],
        "interview_prep_recommendations": interview_weaknesses if interview_weaknesses else [
            "Practice structuring behavioral questions using explicit STAR metrics.",
            "Review core data structures and architectural trade-offs."
        ],
        "ats_resume_recommendations": [
            f"Insert missing key terms ({', '.join(combined_missing[:3])}) into your primary Skills section.",
            "Quantify project achievements with specific metric outcomes."
        ],
        "career_progression_explanation": f"Following this roadmap will help advance candidate from {user_experience_level or 'Mid Level'} to a Senior-track {target_role} position within 6 months."
    }


def generate_career_plan_with_gemini(
    target_role: str,
    user_experience_level: str,
    primary_skills: list,
    resume_data_or_text: any,
    ats_missing_skills: list,
    interview_weaknesses: list,
    job_missing_skills: list
) -> dict:
    """
    Generate personalized AI career plan using Google Gemini API.
    Uses 'gemini-2.5-flash' (or fallback 'gemini-flash-latest') in strict accordance with project rules.
    """
    primary_skills_str = ", ".join(primary_skills) if primary_skills else "Software Development"
    ats_missing_str = ", ".join(ats_missing_skills) if ats_missing_skills else "None noted"
    interview_weaknesses_str = "; ".join(interview_weaknesses) if interview_weaknesses else "None noted"
    job_missing_str = ", ".join(job_missing_skills) if job_missing_skills else "None noted"

    resume_summary_str = ""
    if isinstance(resume_data_or_text, dict):
        resume_summary_str = json.dumps(resume_data_or_text, indent=2)[:3000]
    elif isinstance(resume_data_or_text, str):
        resume_summary_str = resume_data_or_text[:3000]

    prompt = CAREER_PLANNING_PROMPT_TEMPLATE.format(
        target_role=target_role or "Software Engineer",
        user_experience_level=user_experience_level or "Mid Level",
        primary_skills_str=primary_skills_str,
        resume_summary_str=resume_summary_str or "No parsed resume provided.",
        ats_missing_skills_str=ats_missing_str,
        interview_weaknesses_str=interview_weaknesses_str,
        job_missing_skills_str=job_missing_str
    )

    models_to_try = ["gemini-2.5-flash", "gemini-flash-latest"]

    try:
        api_key = get_api_key()
        genai.configure(api_key=api_key)

        for model_name in models_to_try:
            try:
                logger.info(f"Running career plan generation for target role '{target_role}' using model: {model_name}")
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
                if isinstance(parsed, dict) and "overall_readiness_score" in parsed:
                    return parsed
                else:
                    raise Exception("Parsed output missing 'overall_readiness_score'.")

            except Exception as err:
                logger.warning(f"Career plan evaluation failed with model {model_name}: {err}")
                continue

        raise Exception("All Gemini model attempts failed for career planning.")

    except Exception as err:
        logger.warning(f"Gemini Career Planning Engine failed ({err}). Using heuristic fallback engine.")
        return generate_heuristic_career_plan(
            target_role=target_role,
            user_experience_level=user_experience_level,
            primary_skills=primary_skills,
            ats_missing_skills=ats_missing_skills,
            job_missing_skills=job_missing_skills,
            interview_weaknesses=interview_weaknesses
        )
