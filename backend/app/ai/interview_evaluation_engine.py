import json
import logging
import re
from app.ai.gemini import get_api_key, clean_and_extract_json
import google.generativeai as genai

logger = logging.getLogger(__name__)

INTERVIEW_EVALUATION_PROMPT = """
You are an elite Senior Technical Hiring Manager and Interview Coach conducting a comprehensive post-interview evaluation.
Evaluate the candidate's responses for a mock interview session for the role of "{role}" at difficulty level "{difficulty}".

CANDIDATE INTERVIEW QA DATA:
{qa_json_str}

CRITICAL INSTRUCTIONS:
1. Evaluate every question individually based on technical accuracy, clarity, completeness, and structure (e.g. STAR method).
2. Generate an overall session score (0 to 100) and category scores.
3. For each question, provide a score out of 10, technical accuracy ("High", "Moderate", "Needs Improvement"), communication clarity ("High", "Moderate", "Needs Improvement"), completeness ("Comprehensive", "Partial", "Brief"), confidence level ("High", "Moderate", "Low"), detailed feedback string, strengths list, weaknesses list, and an exemplary ideal answer.
4. Return ONLY a valid JSON object matching the exact schema below without markdown wrappers or commentary outside JSON.

EXACT JSON SCHEMA:
{{
  "overall_score": 85,
  "technical_score": 88,
  "communication_score": 82,
  "problem_solving_score": 84,
  "confidence_score": 80,
  "strengths_summary": [
    "Demonstrated strong technical depth in system architecture and concurrency patterns.",
    "Structured responses clearly with situation context."
  ],
  "weaknesses_summary": [
    "Could incorporate more quantitative metrics (e.g. QPS, latency % improvements).",
    "Some technical explanations were overly concise."
  ],
  "recommendations": [
    "Practice framing behavioral answers using explicit STAR method metrics.",
    "Review distributed caching mechanisms and database indexing internals."
  ],
  "question_evaluations": [
    {{
      "question_id": "question_id_here",
      "question_number": 1,
      "score": 9,
      "technical_accuracy": "High",
      "communication_clarity": "High",
      "completeness": "Comprehensive",
      "confidence_level": "High",
      "feedback": "Excellent breakdown of operating system process vs thread memory spaces.",
      "strengths": ["Accurate memory layout explanation", "Clear distinction between stack and heap"],
      "weaknesses": ["None notable"],
      "ideal_answer": "An ideal answer explains that a process represents an executing program with isolated memory space, while threads are light execution units sharing the process heap..."
    }}
  ]
}}
"""

def generate_heuristic_evaluation(role: str, difficulty: str, questions_data: list) -> dict:
    """
    Fallback heuristic evaluation engine calculating realistic scores and feedback
    if Gemini API is unconfigured or encounters temporary rate limits.
    """
    logger.info(f"Using fallback heuristic evaluation for role '{role}'")
    
    question_evals = []
    total_q_scores = 0

    for q in questions_data:
        q_id = q.get("id", "")
        q_num = q.get("question_number", 1)
        q_text = q.get("question_text", "")
        ans = (q.get("candidate_answer") or "").strip()

        word_count = len(ans.split()) if ans else 0

        # Heuristic scoring based on response length and depth
        if word_count > 60:
            score = 9
            tech_acc = "High"
            comm_clarity = "High"
            completeness = "Comprehensive"
            confidence = "High"
            feedback = "Strong and thorough answer with clear technical terms."
            strengths = ["Comprehensive technical depth", "Clear logical structure"]
            weaknesses = ["Could include explicit metrics"]
        elif word_count > 25:
            score = 7
            tech_acc = "Moderate"
            comm_clarity = "Moderate"
            completeness = "Partial"
            confidence = "Moderate"
            feedback = "Good foundational answer, though expanding with specific examples would strengthen impact."
            strengths = ["Correct basic concepts"]
            weaknesses = ["Lacks detailed implementation steps"]
        elif word_count > 5:
            score = 5
            tech_acc = "Needs Improvement"
            comm_clarity = "Moderate"
            completeness = "Brief"
            confidence = "Moderate"
            feedback = "Answer is very brief. Provide more technical context and elaboration."
            strengths = ["Identifies key terminology"]
            weaknesses = ["Overly brief response", "Missing STAR structure"]
        else:
            score = 2
            tech_acc = "Needs Improvement"
            comm_clarity = "Needs Improvement"
            completeness = "Brief"
            confidence = "Low"
            feedback = "No substantive response was provided for this question."
            strengths = []
            weaknesses = ["Question skipped or unattempted"]

        total_q_scores += score
        ideal_ans = f"An exemplary response for a {role} at {difficulty} level would clearly address {q_text} by providing specific technical architecture examples and quantifiable outcomes."

        question_evals.append({
            "question_id": q_id,
            "question_number": q_num,
            "score": score,
            "technical_accuracy": tech_acc,
            "communication_clarity": comm_clarity,
            "completeness": completeness,
            "confidence_level": confidence,
            "feedback": feedback,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "ideal_answer": ideal_ans
        })

    avg_q_score = (total_q_scores / len(questions_data)) if questions_data else 5
    overall_score = min(100, max(20, int(avg_q_score * 10)))

    return {
        "overall_score": overall_score,
        "technical_score": min(100, overall_score + 3),
        "communication_score": min(100, overall_score - 2),
        "problem_solving_score": min(100, overall_score + 1),
        "confidence_score": min(100, overall_score - 1),
        "strengths_summary": [
            f"Demonstrated good baseline understanding for target role: {role}.",
            "Structured answers steadily across questions."
        ],
        "weaknesses_summary": [
            "Incorporate more quantifiable metrics (e.g. latency improvements, percentage gains).",
            "Elaborate on edge cases and system failure recovery."
        ],
        "recommendations": [
            "Practice the STAR framework (Situation, Task, Action, Result) for all technical scenarios.",
            "Review core data structures, system trade-offs, and architecture best practices."
        ],
        "question_evaluations": question_evals
    }


def evaluate_interview_session_with_gemini(
    role: str,
    difficulty: str,
    questions_data: list
) -> dict:
    """
    Evaluate candidate mock interview responses using Google Gemini API.
    
    :param role: Target job role.
    :param difficulty: Difficulty level (Easy, Medium, Hard).
    :param questions_data: List of dicts containing id, question_number, question_text, candidate_answer.
    :return: Dictionary containing overall scores, breakdown scores, summaries, and per-question evaluations.
    """
    if not questions_data:
        return generate_heuristic_evaluation(role, difficulty, [])

    qa_list = []
    for q in questions_data:
        qa_list.append({
            "question_id": q.get("id", ""),
            "question_number": q.get("question_number", 1),
            "question_text": q.get("question_text", ""),
            "candidate_answer": q.get("candidate_answer", "")
        })

    prompt = INTERVIEW_EVALUATION_PROMPT.format(
        role=role,
        difficulty=difficulty,
        qa_json_str=json.dumps(qa_list, indent=2)
    )

    try:
        api_key = get_api_key()
        genai.configure(api_key=api_key)

        model_name = 'gemini-2.5-flash'
        logger.info(f"Evaluating mock interview session for role '{role}' using model: {model_name}")

        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config={"response_mime_type": "application/json", "temperature": 0.2}
            )
            response = model.generate_content(prompt)
        except Exception as e:
            logger.warning(f"JSON mode failed for evaluation: {e}. Retrying standard prompt...")
            model = genai.GenerativeModel(model_name=model_name)
            response = model.generate_content(prompt)

        if not response or not hasattr(response, 'text') or not response.text:
            raise Exception("Gemini evaluation returned empty text.")

        parsed_eval = clean_and_extract_json(response.text)

        if isinstance(parsed_eval, dict) and "overall_score" in parsed_eval:
            return parsed_eval
        else:
            raise Exception("Parsed result does not contain overall_score.")

    except Exception as err:
        logger.warning(f"Gemini Interview Evaluation failed ({err}). Using heuristic fallback engine.")
        return generate_heuristic_evaluation(role, difficulty, questions_data)
