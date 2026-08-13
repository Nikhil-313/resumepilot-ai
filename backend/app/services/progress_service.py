import logging
from typing import Tuple, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy import desc, and_

from app.extensions import db
from app.models.user import User
from app.models.progress import CareerProgress, ProgressTask, ProgressMilestone
from app.models.career import CareerPlan, CareerGoal, SkillRoadmap
from app.models.interview_intelligence import InterviewPracticeRecommendation
from app.models.optimizer import ResumeOptimization, ResumeRecommendation
from app.models.application import JobApplication, ApplicationActivity, ApplicationFollowUp
from app.models.ats import ATSAnalysis
from app.models.interview import InterviewSession

from app.ai.progress_coach_engine import generate_progress_coaching_with_gemini

logger = logging.getLogger(__name__)

# In-memory cache for AI Progress Coaching
_AI_PROGRESS_COACH_CACHE: Dict[str, Any] = {}

class ProgressService:
    """Service layer managing career progress tracking, task synchronization, and goal execution."""

    @classmethod
    def sync_tasks_from_modules(cls, user_id: str):
        """Synchronizes actionable items from existing modules into ProgressTask records without duplicates."""
        try:
            # Helper to add task if missing by source_type + source_id
            def add_task_if_missing(source_type, source_id, title, description, category, priority, status, due_date=''):
                if not source_id:
                    return

                existing = ProgressTask.query.filter_by(
                    user_id=user_id,
                    source_type=source_type,
                    source_id=source_id
                ).first()

                if not existing:
                    task = ProgressTask(
                        user_id=user_id,
                        source_type=source_type,
                        source_id=source_id,
                        title=title,
                        description=description,
                        category=category,
                        priority=priority,
                        status=status,
                        due_date=due_date
                    )
                    db.session.add(task)
                else:
                    # Sync status if modified in source module
                    if existing.status != status and existing.status != 'dismissed':
                        existing.status = status

            # 1. Sync Career Goals
            career_plan = CareerPlan.query.filter_by(user_id=user_id).first()
            if career_plan:
                for goal in career_plan.goals:
                    status_map = {'not_started': 'pending', 'in_progress': 'in_progress', 'completed': 'completed'}
                    add_task_if_missing(
                        'career_goal',
                        goal.id,
                        f"Goal: {goal.title}",
                        goal.description,
                        'Career',
                        goal.priority or 'Medium',
                        status_map.get(goal.status, 'pending'),
                        goal.target_date or ''
                    )

                # 2. Sync Skill Roadmap
                for skill in career_plan.roadmap_skills:
                    status_map = {'not_started': 'pending', 'in_progress': 'in_progress', 'completed': 'completed'}
                    add_task_if_missing(
                        'skill_roadmap',
                        skill.id,
                        f"Learn Skill: {skill.skill_name}",
                        f"Target Level: {skill.target_level}. {skill.reason}",
                        'Skills',
                        skill.priority or 'High',
                        status_map.get(skill.status, 'pending'),
                        skill.estimated_time or '2 weeks'
                    )

            # 3. Sync Interview Practice Recommendations
            interview_recs = InterviewPracticeRecommendation.query.filter_by(user_id=user_id).all()
            for rec in interview_recs:
                add_task_if_missing(
                    'interview_recommendation',
                    rec.id,
                    f"Practice: {rec.title}",
                    rec.description,
                    'Interview',
                    rec.priority or 'Medium',
                    rec.status or 'pending'
                )

            # 4. Sync Resume Optimizer Recommendations
            latest_opt = ResumeOptimization.query.filter_by(user_id=user_id).order_by(desc(ResumeOptimization.created_at)).first()
            if latest_opt:
                for rec in latest_opt.recommendations:
                    status_map = {'pending': 'pending', 'accepted': 'completed', 'rejected': 'dismissed'}
                    add_task_if_missing(
                        'resume_recommendation',
                        rec.id,
                        f"Resume Improvement: [{rec.section.upper()}] {rec.recommendation_type.title()}",
                        rec.suggested_text,
                        'Resume',
                        rec.priority or 'Medium',
                        status_map.get(rec.status, 'pending')
                    )

            # 5. Sync Application Follow-Ups
            apps = JobApplication.query.filter_by(user_id=user_id).all()
            for app_rec in apps:
                for fu in app_rec.followups:
                    add_task_if_missing(
                        'application_followup',
                        fu.id,
                        f"Follow Up: {app_rec.company_name} ({app_rec.job_title})",
                        fu.title,
                        'Applications',
                        'High',
                        'completed' if fu.completed else 'pending',
                        fu.follow_up_date or ''
                    )

            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to sync progress tasks for user {user_id}: {e}")

    @classmethod
    def get_dashboard(cls, user_id: str) -> Tuple[Dict[str, Any], int]:
        """Fetch complete candidate progress tracking dashboard data."""
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found.'}, 404

        # 1. Sync tasks
        cls.sync_tasks_from_modules(user_id)

        # 2. Retrieve Data Sources
        career_plan = CareerPlan.query.filter_by(user_id=user_id).first()
        goals = career_plan.goals if career_plan else []
        skills = career_plan.roadmap_skills if career_plan else []

        interview_recs = InterviewPracticeRecommendation.query.filter_by(user_id=user_id).all()

        latest_opt = ResumeOptimization.query.filter_by(user_id=user_id).order_by(desc(ResumeOptimization.created_at)).first()
        resume_recs = latest_opt.recommendations if latest_opt else []

        applications = JobApplication.query.filter_by(user_id=user_id).all()

        all_tasks = ProgressTask.query.filter_by(user_id=user_id).order_by(desc(ProgressTask.created_at)).all()

        # 3. Calculate Deterministic Progress Score (0-100)
        goals_total = len(goals)
        goals_completed = sum(1 for g in goals if g.status == 'completed')
        goals_pct = (goals_completed / goals_total * 100) if goals_total > 0 else 0

        skills_total = len(skills)
        skills_completed = sum(1 for s in skills if s.status == 'completed')
        skills_pct = (skills_completed / skills_total * 100) if skills_total > 0 else 0

        interview_total = len(interview_recs)
        interview_completed = sum(1 for i in interview_recs if i.status == 'completed')
        interview_pct = (interview_completed / interview_total * 100) if interview_total > 0 else 0

        resume_total = len(resume_recs)
        resume_completed = sum(1 for r in resume_recs if r.status == 'accepted')
        resume_pct = (resume_completed / resume_total * 100) if resume_total > 0 else 0

        apps_count = len(applications)
        interviews_count = sum(1 for a in applications if a.current_stage in ['Assessment', 'Interview', 'Final Round', 'Offer'])
        app_pct = min(100, apps_count * 20 + interviews_count * 25)

        total_actionables = goals_total + skills_total + interview_total + resume_total
        has_activity = total_actionables > 0 or apps_count > 0

        if not has_activity:
            overall_progress = None
            rating = "Limited Data"
        else:
            weighted = (goals_pct * 0.25) + (skills_pct * 0.25) + (interview_pct * 0.20) + (resume_pct * 0.15) + (app_pct * 0.15)
            overall_progress = round(weighted)

            if overall_progress >= 85: rating = "Excellent Momentum"
            elif overall_progress >= 70: rating = "Good Progress"
            elif overall_progress >= 50: rating = "Building Momentum"
            else: rating = "Needs Attention"

        # 4. Weekly Progress Metrics
        tasks_completed_count = sum(1 for t in all_tasks if t.status == 'completed')
        tasks_pending_count = sum(1 for t in all_tasks if t.status in ['pending', 'in_progress'])

        weekly_summary = {
            "tasks_completed": tasks_completed_count,
            "tasks_remaining": tasks_pending_count,
            "goals_advanced": goals_completed,
            "skills_completed": skills_completed,
            "applications_submitted": apps_count,
            "interviews_completed": interviews_count,
            "weekly_trend": "Improving" if tasks_completed_count > 0 else "Stable"
        }

        # 5. Milestones Calculation
        milestones = []

        # Skill milestone
        if skills_completed > 0:
            milestones.append({
                "id": "ms_skill_1",
                "title": "Complete First Skill Roadmap Target",
                "description": f"Mastered {skills_completed} target technical skill(s).",
                "category": "Skills",
                "target_date": "Completed",
                "status": "completed",
                "completion_percentage": 100
            })
        elif skills_total > 0:
            milestones.append({
                "id": "ms_skill_1",
                "title": "Master First Skill Roadmap Target",
                "description": f"Complete {skills[0].skill_name} in learning roadmap.",
                "category": "Skills",
                "target_date": skills[0].estimated_time or "Upcoming",
                "status": "in_progress",
                "completion_percentage": 40
            })

        # ATS milestone
        latest_ats = ATSAnalysis.query.filter_by(user_id=user_id).order_by(desc(ATSAnalysis.created_at)).first()
        if latest_ats and latest_ats.ats_score and latest_ats.ats_score >= 80:
            milestones.append({
                "id": "ms_ats_80",
                "title": "Achieve 80%+ ATS Match Score",
                "description": f"Reached {latest_ats.ats_score}% ATS match score.",
                "category": "ATS",
                "target_date": "Completed",
                "status": "completed",
                "completion_percentage": 100
            })
        else:
            milestones.append({
                "id": "ms_ats_80",
                "title": "Achieve 80%+ ATS Match Score",
                "description": "Optimize resume keywords for target job description.",
                "category": "ATS",
                "target_date": "Upcoming",
                "status": "upcoming",
                "completion_percentage": latest_ats.ats_score if latest_ats and latest_ats.ats_score else 0
            })

        # Interview milestone
        latest_interview = InterviewSession.query.filter_by(user_id=user_id, status='completed').order_by(desc(InterviewSession.created_at)).first()
        if latest_interview:
            milestones.append({
                "id": "ms_interview_1",
                "title": "Complete Live Mock Interview Evaluation",
                "description": f"Evaluated mock session with rating of {latest_interview.overall_score}%.",
                "category": "Interview",
                "target_date": "Completed",
                "status": "completed",
                "completion_percentage": 100
            })

        # Application milestone
        if interviews_count > 0:
            milestones.append({
                "id": "ms_app_interview",
                "title": "Land First Recruiter Interview",
                "description": f"Advanced to active interview stage across tracked applications.",
                "category": "Applications",
                "target_date": "Completed",
                "status": "completed",
                "completion_percentage": 100
            })

        # AI Progress Coach payload
        progress_data_for_coach = {
            "overall_progress": overall_progress or 0,
            "goals_completed": goals_completed,
            "goals_total": goals_total,
            "skills_completed": skills_completed,
            "skills_total": skills_total,
            "applications_count": apps_count,
            "interview_recs_completed": interview_completed,
            "pending_tasks_count": tasks_pending_count
        }

        ai_coach = _AI_PROGRESS_COACH_CACHE.get(user_id)

        dashboard_payload = {
            "has_activity": has_activity,
            "overall": {
                "score": overall_progress,
                "rating": rating,
                "breakdown": {
                    "goals": goals_pct,
                    "skills": skills_pct,
                    "interview": interview_pct,
                    "resume": resume_pct,
                    "applications": app_pct
                }
            },
            "weekly": weekly_summary,
            "goals": [g.to_dict() for g in goals],
            "skills": [s.to_dict() for s in skills],
            "tasks": [t.to_dict() for t in all_tasks],
            "milestones": milestones,
            "ai_coach": ai_coach
        }

        return dashboard_payload, 200

    @classmethod
    def get_tasks(cls, user_id: str, category: str = None, status: str = None) -> Tuple[List[Dict[str, Any]], int]:
        """Fetch tasks for logged-in user with optional category & status filters."""
        cls.sync_tasks_from_modules(user_id)
        query = ProgressTask.query.filter_by(user_id=user_id)

        if category:
            query = query.filter_by(category=category)
        if status:
            query = query.filter_by(status=status)

        tasks = query.order_by(desc(ProgressTask.created_at)).all()
        return [t.to_dict() for t in tasks], 200

    @classmethod
    def update_task_status(cls, user_id: str, task_id: str, status: str) -> Tuple[Dict[str, Any], int]:
        """Update ProgressTask status and synchronize status back to source module with strict user ownership validation."""
        if status not in ['pending', 'in_progress', 'completed', 'dismissed']:
            return {'error': 'Invalid status.'}, 400

        task = ProgressTask.query.filter_by(id=task_id, user_id=user_id).first()
        if not task:
            return {'error': 'Task not found or access denied.'}, 404

        try:
            task.status = status
            if status == 'completed':
                task.completed_at = datetime.utcnow()

            # Sync back to source module model if source reference exists and belongs to authenticated user
            if task.source_type and task.source_id:
                if task.source_type == 'career_goal':
                    g = CareerGoal.query.get(task.source_id)
                    if g and g.career_plan and g.career_plan.user_id == user_id:
                        s_map = {'pending': 'not_started', 'in_progress': 'in_progress', 'completed': 'completed', 'dismissed': 'not_started'}
                        g.status = s_map.get(status, 'not_started')

                elif task.source_type == 'skill_roadmap':
                    s = SkillRoadmap.query.get(task.source_id)
                    if s and s.career_plan and s.career_plan.user_id == user_id:
                        s_map = {'pending': 'not_started', 'in_progress': 'in_progress', 'completed': 'completed', 'dismissed': 'not_started'}
                        s.status = s_map.get(status, 'not_started')

                elif task.source_type == 'interview_recommendation':
                    rec = InterviewPracticeRecommendation.query.get(task.source_id)
                    if rec and rec.user_id == user_id:
                        rec.status = status

                elif task.source_type == 'resume_recommendation':
                    r_rec = ResumeRecommendation.query.get(task.source_id)
                    if r_rec and r_rec.optimization and r_rec.optimization.user_id == user_id:
                        r_rec.status = 'accepted' if status == 'completed' else ('rejected' if status == 'dismissed' else 'pending')

                elif task.source_type == 'application_followup':
                    fu = ApplicationFollowUp.query.get(task.source_id)
                    if fu and fu.application and fu.application.user_id == user_id:
                        fu.completed = True if status == 'completed' else False

            db.session.commit()
            return {'message': f'Task status updated to {status}.', 'task': task.to_dict()}, 200
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to update task status {task_id}")
            return {'error': f'Failed to update task status: {str(e)}'}, 500

    @classmethod
    def generate_ai_coach(cls, user_id: str) -> Tuple[Dict[str, Any], int]:
        """Generate and cache AI Progress Coaching using Gemini AI."""
        dash, status_code = cls.get_dashboard(user_id)
        if status_code != 200:
            return {'error': 'Failed to retrieve progress data.'}, status_code

        overall = dash.get('overall', {})
        weekly = dash.get('weekly', {})

        progress_data = {
            "overall_progress": overall.get('score', 0) or 0,
            "goals_completed": weekly.get('goals_advanced', 0),
            "goals_total": len(dash.get('goals', [])),
            "skills_completed": weekly.get('skills_completed', 0),
            "skills_total": len(dash.get('skills', [])),
            "applications_count": weekly.get('applications_submitted', 0),
            "interview_recs_completed": 1 if weekly.get('interviews_completed', 0) > 0 else 0,
            "pending_tasks_count": weekly.get('tasks_remaining', 0)
        }

        coach = generate_progress_coaching_with_gemini(progress_data)
        _AI_PROGRESS_COACH_CACHE[user_id] = coach
        return {'ai_coach': coach}, 200
