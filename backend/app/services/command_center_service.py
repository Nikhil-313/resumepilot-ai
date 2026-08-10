import logging
from typing import Tuple, Dict, Any, List
from datetime import datetime
from sqlalchemy import desc

from app.models.user import User
from app.models.resume import Resume
from app.models.ats import ATSAnalysis
from app.models.interview import InterviewSession
from app.models.job import JobMatchReport, JobPosting
from app.models.career import CareerPlan
from app.models.optimizer import ResumeOptimization
from app.models.application import JobApplication

from app.services.action_recommendation_service import ActionRecommendationService
from app.services.notification_service import NotificationService
from app.ai.career_summary_engine import generate_career_summary_with_gemini

logger = logging.getLogger(__name__)

# In-memory cache for AI Career Summary to prevent redundant Gemini API calls on page refresh
_AI_SUMMARY_CACHE: Dict[str, Any] = {}

class CommandCenterService:
    """Central Command Center service synthesizing all candidate modules and calculating health metrics."""

    @classmethod
    def get_dashboard_summary(cls, user_id: str) -> Tuple[Dict[str, Any], int]:
        """Synthesizes cross-module candidate data and returns complete command center dashboard summary."""
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found.'}, 404

        # 1. Resume Snapshot
        latest_resume = Resume.query.filter_by(user_id=user_id).order_by(desc(Resume.created_at)).first()
        resume_data = latest_resume.parsed_json if (latest_resume and latest_resume.parsed_json) else {}
        resume_skills = resume_data.get('skills') or []

        # 2. ATS Snapshot
        ats_records = ATSAnalysis.query.filter_by(user_id=user_id).order_by(desc(ATSAnalysis.created_at)).all()
        latest_ats = ats_records[0] if len(ats_records) > 0 else None
        prev_ats = ats_records[1] if len(ats_records) > 1 else None

        ats_score = latest_ats.ats_score if latest_ats else None
        prev_ats_score = prev_ats.ats_score if prev_ats else None
        ats_improvement = (ats_score - prev_ats_score) if (ats_score and prev_ats_score) else 0

        ats_missing_keywords = latest_ats.missing_keywords if (latest_ats and latest_ats.missing_keywords) else []

        # 3. Interview Snapshot
        interviews = InterviewSession.query.filter_by(user_id=user_id, status='completed').order_by(desc(InterviewSession.created_at)).all()
        latest_interview = interviews[0] if len(interviews) > 0 else None

        interview_score = latest_interview.overall_score if latest_interview else None
        interview_tech = latest_interview.technical_score if latest_interview else None
        interview_comm = latest_interview.communication_score if latest_interview else None
        interview_problem = latest_interview.problem_solving_score if latest_interview else None
        interview_conf = latest_interview.confidence_score if latest_interview else None
        interview_weaknesses = (latest_interview.weaknesses_summary or []) if latest_interview else []

        # 4. Job Matches Snapshot
        job_reports = JobMatchReport.query.filter_by(user_id=user_id).order_by(desc(JobMatchReport.match_percentage)).all()
        total_job_matches = len(job_reports)
        best_job_match = job_reports[0].match_percentage if len(job_reports) > 0 else 0

        job_missing_skills = []
        for jr in job_reports[:5]:
            if jr.missing_skills and isinstance(jr.missing_skills, list):
                job_missing_skills.extend(jr.missing_skills)
        job_missing_skills = list(set(job_missing_skills))

        # 5. Career Planner Snapshot
        career_plan = CareerPlan.query.filter_by(user_id=user_id).first()
        career_readiness = career_plan.overall_readiness_score if career_plan else 75
        target_role = (career_plan.target_role if career_plan else None) or (latest_ats.job_title if latest_ats else "Software Engineer")

        career_skill_gaps = []
        if career_plan and career_plan.skill_gaps:
            for gap in career_plan.skill_gaps:
                if isinstance(gap, dict) and 'skill' in gap:
                    career_skill_gaps.append(gap['skill'])

        incomplete_goals_count = len([g for g in career_plan.goals if g.status != 'completed']) if career_plan else 0
        incomplete_roadmap_count = len([r for r in career_plan.roadmap_skills if r.status != 'completed']) if career_plan else 0

        # 6. Resume Optimizer Snapshot
        latest_opt = ResumeOptimization.query.filter_by(user_id=user_id).order_by(desc(ResumeOptimization.created_at)).first()
        opt_score = latest_opt.overall_improvement_score if latest_opt else None
        pending_opt_recs_count = len([r for r in latest_opt.recommendations if r.status == 'pending']) if latest_opt else 0

        # 7. Application Tracker Snapshot
        applications = JobApplication.query.filter_by(user_id=user_id).all()
        total_applications = len(applications)
        active_applications = sum(1 for a in applications if a.status == 'Active')
        interviews_count = sum(1 for a in applications if a.current_stage in ['Assessment', 'Interview', 'Final Round', 'Offer'])
        offers_count = sum(1 for a in applications if a.current_stage == 'Offer' or a.status == 'Successful')
        rejections_count = sum(1 for a in applications if a.current_stage == 'Rejected' or a.status == 'Rejected')

        # Overdue / upcoming follow-ups
        overdue_followups = []
        for app_rec in applications:
            for fu in app_rec.followups:
                if not fu.completed:
                    overdue_followups.append({
                        'application_id': app_rec.id,
                        'company_name': app_rec.company_name,
                        'job_title': app_rec.job_title,
                        'title': fu.title,
                        'follow_up_date': fu.follow_up_date
                    })

        # Applications requiring attention
        apps_needing_attention = []
        for app_rec in applications:
            if app_rec.status == 'Active':
                if app_rec.current_stage in ['Interview', 'Final Round'] or len(app_rec.followups) > 0:
                    apps_needing_attention.append({
                        'id': app_rec.id,
                        'job_title': app_rec.job_title,
                        'company_name': app_rec.company_name,
                        'current_stage': app_rec.current_stage,
                        'application_date': app_rec.application_date,
                        'reason': f"Active stage ({app_rec.current_stage}) requiring candidate follow-up"
                    })

        # 8. Deterministic Career Health Score Calculation (0-100)
        score_components = []
        if ats_score is not None: score_components.append(ats_score)
        if interview_score is not None: score_components.append(interview_score)
        if best_job_match > 0: score_components.append(best_job_match)
        if opt_score is not None: score_components.append(opt_score)
        score_components.append(career_readiness)

        overall_health_score = round(sum(score_components) / len(score_components)) if score_components else 75

        if overall_health_score >= 85: health_rating = "Excellent"
        elif overall_health_score >= 70: health_rating = "Strong"
        elif overall_health_score >= 50: health_rating = "Developing"
        else: health_rating = "Needs Attention"

        # 9. Deduplicated Skill Gap Synthesis
        dedup_gaps = []
        raw_gaps = list(set(ats_missing_keywords + job_missing_skills + career_skill_gaps))
        for s in raw_gaps[:6]:
            source = "Job Matches" if s in job_missing_skills else ("ATS Scanner" if s in ats_missing_keywords else "Career Roadmap")
            dedup_gaps.append({
                "skill": s,
                "priority": "High" if s in job_missing_skills and s in ats_missing_keywords else "Medium",
                "source": source,
                "recommended_action": f"Add {s} to your learning roadmap and update resume evidence."
            })

        # Assemble Candidate Payload for Action & Notification Services
        candidate_data = {
            "user_name": user.full_name or "Candidate",
            "target_role": target_role,
            "resume_filename": latest_resume.filename if latest_resume else "Uploaded",
            "ats_score": ats_score,
            "ats_missing_keywords": ats_missing_keywords,
            "interview_score": interview_score,
            "interview_communication_score": interview_comm,
            "interview_weaknesses": interview_weaknesses,
            "best_job_match": best_job_match,
            "job_missing_skills": job_missing_skills,
            "career_readiness": career_readiness,
            "active_applications": active_applications,
            "interviews_count": interviews_count,
            "offers_count": offers_count,
            "overdue_followups_count": len(overdue_followups),
            "pending_opt_recs_count": pending_opt_recs_count
        }

        # Priority Actions
        priority_actions = ActionRecommendationService.generate_priority_actions(candidate_data)

        # Smart Notifications
        NotificationService.generate_candidate_notifications(user_id)
        notifications_data, _ = NotificationService.get_user_notifications(user_id)

        dashboard_payload = {
            "candidate_name": user.full_name or "Candidate",
            "target_role": target_role,
            "health": {
                "score": overall_health_score,
                "rating": health_rating,
                "last_updated": datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'),
                "contributing_scores": {
                    "resume_health": opt_score if opt_score is not None else 85,
                    "ats_performance": ats_score if ats_score is not None else 75,
                    "interview_performance": interview_score if interview_score is not None else 70,
                    "job_match_strength": best_job_match if best_job_match > 0 else 80,
                    "career_readiness": career_readiness,
                    "application_activity": min(100, active_applications * 25 + 50)
                }
            },
            "quick_stats": {
                "ats_score": ats_score if ats_score is not None else "N/A",
                "interview_score": interview_score if interview_score is not None else "N/A",
                "best_job_match": f"{best_job_match}%" if best_job_match > 0 else "N/A",
                "active_applications": active_applications,
                "upcoming_followups": len(overdue_followups),
                "career_readiness": f"{career_readiness}%"
            },
            "snapshots": {
                "ats": {
                    "score": ats_score,
                    "improvement": ats_improvement,
                    "missing_keywords": ats_missing_keywords[:4]
                },
                "interview": {
                    "score": interview_score,
                    "technical": interview_tech,
                    "communication": interview_comm,
                    "problem_solving": interview_problem,
                    "confidence": interview_conf,
                    "weaknesses": interview_weaknesses[:2]
                },
                "job_matches": {
                    "total_matches": total_job_matches,
                    "best_match": best_job_match,
                    "missing_skills": job_missing_skills[:4],
                    "tracked_applications": total_applications
                },
                "optimizer": {
                    "score": opt_score,
                    "pending_recommendations": pending_opt_recs_count
                }
            },
            "priority_actions": priority_actions,
            "notifications": notifications_data.get('notifications', []),
            "unread_notifications_count": notifications_data.get('unread_count', 0),
            "applications_attention": apps_needing_attention,
            "skill_gaps": dedup_gaps,
            "ai_summary": _AI_SUMMARY_CACHE.get(user_id) or cls.generate_ai_career_summary(user_id, candidate_data)
        }

        return dashboard_payload, 200

    @classmethod
    def generate_ai_career_summary(cls, user_id: str, candidate_data: dict = None) -> dict:
        """Generate and cache AI Executive Career Summary using Gemini 2.5 API."""
        if not candidate_data:
            summary_res, _ = cls.get_dashboard_summary(user_id)
            candidate_data = summary_res.get('quick_stats', {})

        ai_summary = generate_career_summary_with_gemini(candidate_data)
        _AI_SUMMARY_CACHE[user_id] = ai_summary
        return ai_summary
