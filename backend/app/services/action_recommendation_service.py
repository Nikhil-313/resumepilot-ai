import logging
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class ActionRecommendationService:
    """Service generating deterministic, prioritized candidate actions based on cross-module evidence."""

    @classmethod
    def generate_priority_actions(cls, candidate_data: dict) -> List[Dict[str, Any]]:
        """Generates deterministic prioritized actions matching candidate's actual diagnostic needs."""
        actions = []

        ats_score = candidate_data.get('ats_score')
        interview_score = candidate_data.get('interview_score')
        interview_comm = candidate_data.get('interview_communication_score')
        active_apps = candidate_data.get('active_applications', 0)
        overdue_followups = candidate_data.get('overdue_followups_count', 0)
        pending_opt_recs = candidate_data.get('pending_opt_recs_count', 0)
        job_missing_skills = candidate_data.get('job_missing_skills', [])

        # 1. High Priority: Overdue Application Follow-ups
        if overdue_followups > 0:
            actions.append({
                "id": "act_followup",
                "title": f"Follow Up on {overdue_followups} Active Job Applications",
                "description": "You have scheduled follow-up reminders due for your active applications. Reach out to hiring recruiters to maintain momentum.",
                "priority": "High",
                "category": "Applications",
                "route": "/applications",
                "created_at": datetime.utcnow().isoformat()
            })

        # 2. High Priority: ATS Score Below Target
        if ats_score is not None and ats_score < 70:
            actions.append({
                "id": "act_ats",
                "title": f"Improve ATS Resume Keyword Alignment ({ats_score}% Score)",
                "description": "Your ATS match score is below target. Run a targeted ATS scan and incorporate high-priority missing keywords.",
                "priority": "High",
                "category": "ATS",
                "route": "/ats",
                "created_at": datetime.utcnow().isoformat()
            })

        # 3. High/Medium Priority: Interview Performance
        if interview_score is not None and interview_score < 70:
            actions.append({
                "id": "act_interview",
                "title": f"Practice Mock Interview Communication ({interview_score}% Score)",
                "description": f"Refine your technical answers and STAR communication clarity in the AI Mock Interview Arena.",
                "priority": "High" if (interview_comm and interview_comm < 65) else "Medium",
                "category": "Interview",
                "route": "/interview",
                "created_at": datetime.utcnow().isoformat()
            })

        # 4. Medium Priority: Pending Resume Studio Recommendations
        if pending_opt_recs > 0:
            actions.append({
                "id": "act_opt",
                "title": f"Review {pending_opt_recs} AI Wording Recommendations",
                "description": "You have unreviewed AI resume recommendations in Resume Studio. Accept STAR-style achievement bullets.",
                "priority": "Medium",
                "category": "Resume",
                "route": "/resume-optimizer",
                "created_at": datetime.utcnow().isoformat()
            })

        # 5. Medium Priority: Skill Gaps in Job Matches
        if job_missing_skills and len(job_missing_skills) > 0:
            top_skills = ", ".join(job_missing_skills[:3])
            actions.append({
                "id": "act_skills",
                "title": f"Bridge Skill Gaps ({top_skills})",
                "description": f"Target skills {top_skills} repeatedly appear in your Job Matches. Review your Career Roadmap to complete learning steps.",
                "priority": "Medium",
                "category": "Skills",
                "route": "/career",
                "created_at": datetime.utcnow().isoformat()
            })

        # 6. Default Action: Explore Job Matches if applications are low
        if active_apps == 0:
            actions.append({
                "id": "act_jobs",
                "title": "Explore Recommended Job Matches & Track Applications",
                "description": "You have no active job applications tracked. Explore AI job matches and track target opportunities.",
                "priority": "Medium",
                "category": "Jobs",
                "route": "/jobs",
                "created_at": datetime.utcnow().isoformat()
            })

        return actions
