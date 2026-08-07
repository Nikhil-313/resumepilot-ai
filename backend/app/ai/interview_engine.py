import json
import logging
import re
from app.ai.gemini import get_api_key, clean_and_extract_json
import google.generativeai as genai

logger = logging.getLogger(__name__)

INTERVIEW_QUESTION_PROMPT_TEMPLATE = """
You are an expert technical interviewer conducting a mock interview.
Generate exactly {question_count} role-specific interview questions tailored for a candidate applying for the role of "{role}".
The difficulty level is "{difficulty}".

Candidate Resume Context:
{resume_context}

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON array of question objects. Do NOT wrap in markdown or commentary outside the JSON array.
2. Each question object MUST contain:
   - "question_number": (integer from 1 to {question_count})
   - "question_text": (the interview question string)
   - "category": ("Technical", "Behavioral", or "System Design")

Example Output Schema:
[
  {{
    "question_number": 1,
    "question_text": "Explain the difference between process and thread in operating systems.",
    "category": "Technical"
  }},
  {{
    "question_number": 2,
    "question_text": "Describe a situation where you had to resolve a production outage under tight deadlines.",
    "category": "Behavioral"
  }}
]
"""

FALLBACK_QUESTIONS_BY_ROLE = {
    "Software Engineer": [
        {"question_number": 1, "question_text": "Explain the difference between pass-by-value and pass-by-reference. How does memory management handle object references in modern languages?", "category": "Technical"},
        {"question_number": 2, "question_text": "How do you optimize a REST API endpoint that is experiencing high latency under heavy concurrency?", "category": "Technical"},
        {"question_number": 3, "question_text": "Describe a complex bug you encountered in production. Walk me through your debugging methodology from initial alert to root-cause fix.", "category": "Behavioral"},
        {"question_number": 4, "question_text": "Design a high-throughput rate-limiting service for a public microservices gateway. What algorithms and data structures would you use?", "category": "System Design"},
        {"question_number": 5, "question_text": "How do you approach writing clean, testable code and managing technical debt when sprint deadlines are tight?", "category": "Behavioral"},
        {"question_number": 6, "question_text": "Compare SQL relational indexing (B-Trees) with NoSQL document stores. When would you choose one over the other?", "category": "Technical"},
        {"question_number": 7, "question_text": "Explain how garbage collection works in runtime environments like V8 or JVM, and how to prevent memory leaks.", "category": "Technical"},
        {"question_number": 8, "question_text": "Tell me about a time you had a strong technical disagreement with a senior teammate. How did you handle it?", "category": "Behavioral"},
        {"question_number": 9, "question_text": "How would you design a real-time collaborative document editor like Google Docs?", "category": "System Design"},
        {"question_number": 10, "question_text": "What steps do you take to secure web applications against OWASP Top 10 vulnerabilities like SQL Injection and XSS?", "category": "Technical"},
        {"question_number": 11, "question_text": "Explain CI/CD pipeline automation and blue-green vs canary deployment strategies.", "category": "Technical"},
        {"question_number": 12, "question_text": "Describe a project where you had to learn a completely unfamiliar technology stack quickly. What was your process?", "category": "Behavioral"},
        {"question_number": 13, "question_text": "How do message brokers like Kafka or RabbitMQ ensure event ordering and idempotency?", "category": "System Design"},
        {"question_number": 14, "question_text": "What are microservices design patterns for distributed transaction management (e.g. Saga pattern)?", "category": "System Design"},
        {"question_number": 15, "question_text": "Describe your strategy for conducting code reviews and mentoring junior developers.", "category": "Behavioral"}
    ],
    "Frontend Developer": [
        {"question_number": 1, "question_text": "Explain the Event Loop in JavaScript, including microtasks, macrotasks, and call stack execution.", "category": "Technical"},
        {"question_number": 2, "question_text": "How does React's Virtual DOM diffing algorithm work, and how do key props optimize rendering?", "category": "Technical"},
        {"question_number": 3, "question_text": "How do you optimize Core Web Vitals (LCP, FID, CLS) for a content-heavy web application?", "category": "Technical"},
        {"question_number": 4, "question_text": "Walk me through how you implement global state management (e.g. Redux Toolkit, Context API, Zustand) cleanly.", "category": "Technical"},
        {"question_number": 5, "question_text": "Describe a time when a UI design specification was technically infeasible. How did you negotiate alternatives with UX designers?", "category": "Behavioral"}
    ],
    "Backend Developer": [
        {"question_number": 1, "question_text": "Explain database isolation levels (Read Committed, Repeatable Read, Serializable) and concurrency anomalies like phantom reads.", "category": "Technical"},
        {"question_number": 2, "question_text": "How do you design an idempotent HTTP API for payment processing?", "category": "Technical"},
        {"question_number": 3, "question_text": "Compare gRPC with REST and GraphQL for inter-service communication in microservices.", "category": "Technical"},
        {"question_number": 4, "question_text": "How do connection pools (e.g. HikariCP, SQLAlchemy Pool) improve database performance and prevent connection exhaustion?", "category": "Technical"},
        {"question_number": 5, "question_text": "Describe a situation where a database query caused a bottleneck and how you used EXPLAIN ANALYZE to optimize it.", "category": "Behavioral"}
    ],
    "Data Scientist": [
        {"question_number": 1, "question_text": "Explain the bias-variance tradeoff and how regularization (L1 Lasso vs L2 Ridge) mitigates overfitting.", "category": "Technical"},
        {"question_number": 2, "question_text": "How do you handle severe class imbalance in a classification dataset?", "category": "Technical"},
        {"question_number": 3, "question_text": "Compare XGBoost gradient boosting with Random Forest decision trees. When is each preferred?", "category": "Technical"},
        {"question_number": 4, "question_text": "Walk me through an A/B testing experiment design from sample size calculation to p-value significance testing.", "category": "Technical"},
        {"question_number": 5, "question_text": "Describe a data science project where your model's predictions produced unexpected results in production.", "category": "Behavioral"}
    ],
    "ML Engineer": [
        {"question_number": 1, "question_text": "Explain how multi-head self-attention works in Transformer neural network architectures.", "category": "Technical"},
        {"question_number": 2, "question_text": "How do you optimize deep learning model inference latency for edge or real-time serving (quantization, TensorRT, ONNX)?", "category": "Technical"},
        {"question_number": 3, "question_text": "What is data drift and concept drift in machine learning, and how do you monitor for it in production ML pipelines?", "category": "Technical"},
        {"question_number": 4, "question_text": "Design an end-to-end vector search recommendation engine for an e-commerce platform.", "category": "System Design"},
        {"question_number": 5, "question_text": "Describe how you managed a failed model training experiment and what takeaways improved your pipeline.", "category": "Behavioral"}
    ]
}


def get_fallback_questions(role: str, question_count: int) -> list:
    """Generate fallback role-tailored questions if Gemini API is unconfigured or fails."""
    logger.info(f"Using fallback question generator for role '{role}', count={question_count}")
    questions_pool = FALLBACK_QUESTIONS_BY_ROLE.get(role, FALLBACK_QUESTIONS_BY_ROLE["Software Engineer"])
    
    # Repeat/slice if question_count exceeds pool size
    result = []
    for i in range(question_count):
        source_q = questions_pool[i % len(questions_pool)]
        result.append({
            "question_number": i + 1,
            "question_text": source_q["question_text"],
            "category": source_q.get("category", "Technical")
        })
    return result


def generate_interview_questions_with_gemini(
    role: str,
    difficulty: str,
    question_count: int = 5,
    resume_json_or_text: dict = None
) -> list:
    """
    Generate role & resume-tailored interview questions using Google Gemini API.
    
    :param role: Target job role.
    :param difficulty: Difficulty level (Easy, Medium, Hard).
    :param question_count: Number of questions (5, 10, 15).
    :param resume_json_or_text: Parsed JSON resume object or raw text context.
    :return: List of question dictionaries containing question_number, question_text, category.
    """
    resume_context = "No specific resume attached."
    if resume_json_or_text:
        if isinstance(resume_json_or_text, dict):
            skills = ", ".join(resume_json_or_text.get("skills", []))
            summary = resume_json_or_text.get("summary", "")
            exp_list = resume_json_or_text.get("experience", [])
            exp_text = " | ".join([f"{e.get('role')} at {e.get('company')}" for e in exp_list if isinstance(e, dict)])
            resume_context = f"Skills: {skills}\nSummary: {summary}\nExperience: {exp_text}"
        elif isinstance(resume_json_or_text, str):
            resume_context = resume_json_or_text[:1500] # Cap text snippet

    prompt = INTERVIEW_QUESTION_PROMPT_TEMPLATE.format(
        role=role,
        difficulty=difficulty,
        question_count=question_count,
        resume_context=resume_context
    )

    try:
        api_key = get_api_key()
        genai.configure(api_key=api_key)

        model_name = "gemini-2.5-flash"
        logger.info(f"Generating {question_count} interview questions using model: {model_name}")

        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config={"response_mime_type": "application/json", "temperature": 0.3}
            )
            response = model.generate_content(prompt)
        except Exception as e:
            logger.warning(f"Standard JSON mode failed: {e}. Retrying standard generation...")
            model = genai.GenerativeModel(model_name=model_name)
            response = model.generate_content(prompt)

        if not response or not hasattr(response, 'text') or not response.text:
            raise Exception("Gemini returned empty response text.")

        raw_text = response.text.strip()
        # Clean markdown code fences if present
        if "```" in raw_text:
            raw_text = re.sub(r"^```(?:json)?\n?", "", raw_text, flags=re.MULTILINE)
            raw_text = re.sub(r"\n?```$", "", raw_text, flags=re.MULTILINE)
            raw_text = raw_text.strip()

        parsed_questions = json.loads(raw_text)
        if isinstance(parsed_questions, dict) and "questions" in parsed_questions:
            parsed_questions = parsed_questions["questions"]

        if isinstance(parsed_questions, list) and len(parsed_questions) > 0:
            validated = []
            for idx, q in enumerate(parsed_questions[:question_count]):
                validated.append({
                    "question_number": idx + 1,
                    "question_text": q.get("question_text") or q.get("question") or str(q),
                    "category": q.get("category", "Technical")
                })
            return validated
        else:
            raise Exception("Parsed result is not a non-empty list of questions.")

    except Exception as err:
        logger.warning(f"Gemini Question Generation failed ({err}). Falling back to curated question suite.")
        return get_fallback_questions(role, question_count)
