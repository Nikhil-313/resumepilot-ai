import logging
from typing import Tuple, Dict, Any, List
from datetime import datetime
from collections import Counter
from app.models.interview import InterviewSession, InterviewQuestion
from app.models.user import User
from app.services.interview_practice_service import InterviewPracticeService
from app.ai.interview_coach_engine import generate_interview_coaching_with_gemini

logger = logging.getLogger(__name__)

# In-memory cache for AI Interview Coaching
_AI_COACHING_CACHE: Dict[str, Any] = {}

class InterviewIntelligenceService:
    """Service layer managing interview performance analytics, trends, strengths, weaknesses, and practice plans."""

    @classmethod
    def get_dashboard(cls, user_id: str) -> Tuple[Dict[str, Any], int]:
        """Fetch complete Interview Intelligence dashboard payload."""
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found.'}, 404

        # Fetch evaluated completed sessions ordered by creation date ascending
        sessions = InterviewSession.query.filter_by(user_id=user_id, status='completed')\
                                         .order_by(InterviewSession.created_at.asc()).all()

        total_sessions = len(sessions)

        # 1. Empty State (0 Sessions)
        if total_sessions == 0:
            return {
                "has_data": False,
                "total_sessions": 0,
                "readiness": {
                    "score": None,
                    "rating": "No Data",
                    "message": "No interview evaluation data yet. Complete your first mock interview to start building your Interview Intelligence profile."
                },
                "performance_overview": {
                    "overall": {"latest": None, "previous": None, "trend": "Insufficient Data"},
                    "technical": {"latest": None, "previous": None, "trend": "Insufficient Data"},
                    "communication": {"latest": None, "previous": None, "trend": "Insufficient Data"},
                    "problem_solving": {"latest": None, "previous": None, "trend": "Insufficient Data"},
                    "confidence": {"latest": None, "previous": None, "trend": "Insufficient Data"}
                },
                "trends": [],
                "recurring_weaknesses": [],
                "recurring_strengths": [],
                "recommendations": [],
                "recent_sessions": [],
                "ai_coaching": None
            }, 200

        # Helper to safely pull scores
        scores_history = []
        for s in sessions:
            eval_date = s.evaluated_at.strftime('%Y-%m-%d') if s.evaluated_at else s.created_at.strftime('%Y-%m-%d')
            scores_history.append({
                "id": s.id,
                "role": s.role,
                "difficulty": s.difficulty,
                "date": eval_date,
                "overall": s.overall_score or 0,
                "technical": s.technical_score or 0,
                "communication": s.communication_score or 0,
                "problem_solving": s.problem_solving_score or 0,
                "confidence": s.confidence_score or 0,
                "strengths": s.strengths_summary or [],
                "weaknesses": s.weaknesses_summary or []
            })

        latest = scores_history[-1]
        previous = scores_history[-2] if total_sessions > 1 else None

        # 2. Performance Trends Calculation
        def compute_trend(score_key):
            if total_sessions < 2:
                return "Insufficient Data"

            half = total_sessions // 2
            older_avg = sum(item[score_key] for item in scores_history[:half]) / max(1, half)
            recent_avg = sum(item[score_key] for item in scores_history[half:]) / max(1, total_sessions - half)

            diff = recent_avg - older_avg
            if diff >= 4: return "Improving"
            elif diff <= -4: return "Declining"
            else: return "Stable"

        trends = {
            "overall": compute_trend("overall"),
            "technical": compute_trend("technical"),
            "communication": compute_trend("communication"),
            "problem_solving": compute_trend("problem_solving"),
            "confidence": compute_trend("confidence")
        }

        # 3. Deterministic Interview Readiness Score
        if total_sessions == 1:
            readiness_score = latest['overall']
            readiness_rating = "Limited Data"
        else:
            avg_overall = sum(item['overall'] for item in scores_history) / total_sessions
            lowest_sub = min(latest['technical'], latest['communication'], latest['problem_solving'], latest['confidence'])
            trend_bonus = 5 if trends['overall'] == 'Improving' else (-5 if trends['overall'] == 'Declining' else 0)

            raw_readiness = (latest['overall'] * 0.4) + (avg_overall * 0.3) + (lowest_sub * 0.15) + (75 + trend_bonus) * 0.15
            readiness_score = min(100, max(0, round(raw_readiness)))

            if readiness_score >= 85: readiness_rating = "Interview Ready"
            elif readiness_score >= 70: readiness_rating = "Strong Progress"
            elif readiness_score >= 50: readiness_rating = "Developing"
            else: readiness_rating = "Needs Practice"

        # 4. Recurring Weakness Detection
        all_weakness_items = []
        for s in scores_history:
            if s['weaknesses'] and isinstance(s['weaknesses'], list):
                all_weakness_items.extend(s['weaknesses'])

        weakness_counts = Counter(all_weakness_items)
        recurring_weaknesses = []

        for w_text, freq in weakness_counts.most_common(5):
            # Find most recent date
            recent_date = next((s['date'] for s in reversed(scores_history) if w_text in s['weaknesses']), latest['date'])
            severity = "High" if (freq > 1 or (latest['overall'] < 70 and w_text in latest['weaknesses'])) else "Medium"
            
            recurring_weaknesses.append({
                "weakness": w_text,
                "frequency": f"{freq} of {total_sessions} sessions",
                "severity": severity,
                "most_recent_occurrence": recent_date,
                "recommended_action": f"Practice answer conciseness and STAR structuring for '{w_text[:40]}'."
            })

        # 5. Recurring Strength Detection
        all_strength_items = []
        for s in scores_history:
            if s['strengths'] and isinstance(s['strengths'], list):
                all_strength_items.extend(s['strengths'])

        strength_counts = Counter(all_strength_items)
        recurring_strengths = []

        for s_text, freq in strength_counts.most_common(5):
            recent_date = next((s['date'] for s in reversed(scores_history) if s_text in s['strengths']), latest['date'])
            recurring_strengths.append({
                "strength": s_text,
                "frequency": f"{freq} of {total_sessions} sessions",
                "most_recent_occurrence": recent_date,
                "supporting_dimension": "Technical & Architectural Accuracy"
            })

        # 6. Adaptive Practice Recommendations
        recommendations = InterviewPracticeService.generate_recommendations_from_sessions(user_id, sessions)

        # 7. AI Interview Coaching payload assembly
        candidate_interview_data = {
            "target_role": latest['role'],
            "total_sessions": total_sessions,
            "latest_score": latest['overall'],
            "latest_technical": latest['technical'],
            "latest_communication": latest['communication'],
            "latest_problem_solving": latest['problem_solving'],
            "latest_confidence": latest['confidence'],
            "recurring_strengths": recurring_strengths,
            "recurring_weaknesses": recurring_weaknesses,
            "overall_trend": trends['overall']
        }

        ai_coaching = _AI_COACHING_CACHE.get(user_id)

        dashboard_payload = {
            "has_data": True,
            "total_sessions": total_sessions,
            "readiness": {
                "score": readiness_score,
                "rating": readiness_rating,
                "message": f"Interview readiness computed from {total_sessions} evaluated session(s)."
            },
            "performance_overview": {
                "overall": {"latest": latest['overall'], "previous": previous['overall'] if previous else None, "trend": trends['overall']},
                "technical": {"latest": latest['technical'], "previous": previous['technical'] if previous else None, "trend": trends['technical']},
                "communication": {"latest": latest['communication'], "previous": previous['communication'] if previous else None, "trend": trends['communication']},
                "problem_solving": {"latest": latest['problem_solving'], "previous": previous['problem_solving'] if previous else None, "trend": trends['problem_solving']},
                "confidence": {"latest": latest['confidence'], "previous": previous['confidence'] if previous else None, "trend": trends['confidence']}
            },
            "trends": [
                {"date": item['date'], "overall": item['overall'], "technical": item['technical'], "communication": item['communication'], "problem_solving": item['problem_solving'], "confidence": item['confidence']}
                for item in scores_history
            ],
            "recurring_weaknesses": recurring_weaknesses,
            "recurring_strengths": recurring_strengths,
            "recommendations": recommendations,
            "recent_sessions": [
                {
                    "id": item['id'],
                    "role": item['role'],
                    "difficulty": item['difficulty'],
                    "date": item['date'],
                    "overall": item['overall'],
                    "technical": item['technical'],
                    "communication": item['communication'],
                    "problem_solving": item['problem_solving'],
                    "confidence": item['confidence']
                } for item in reversed(scores_history)
            ],
            "ai_coaching": ai_coaching
        }

        return dashboard_payload, 200

    @classmethod
    def generate_ai_coaching(cls, user_id: str) -> Tuple[Dict[str, Any], int]:
        """Generate and cache AI Interview Coaching using Gemini AI."""
        dash, status_code = cls.get_dashboard(user_id)
        if status_code != 200 or not dash.get('has_data'):
            return {'error': 'No completed interview evaluations found.'}, 400

        recent_sessions = dash.get('recent_sessions', [])
        latest = recent_sessions[0] if recent_sessions else {}

        candidate_data = {
            "target_role": latest.get('role', 'Software Engineer'),
            "total_sessions": dash.get('total_sessions', 1),
            "latest_score": latest.get('overall', 0),
            "latest_technical": latest.get('technical', 0),
            "latest_communication": latest.get('communication', 0),
            "latest_problem_solving": latest.get('problem_solving', 0),
            "latest_confidence": latest.get('confidence', 0),
            "recurring_strengths": dash.get('recurring_strengths', []),
            "recurring_weaknesses": dash.get('recurring_weaknesses', []),
            "overall_trend": dash.get('performance_overview', {}).get('overall', {}).get('trend', 'Stable')
        }

        coaching = generate_interview_coaching_with_gemini(candidate_data)
        _AI_COACHING_CACHE[user_id] = coaching

        return {'ai_coaching': coaching}, 200
