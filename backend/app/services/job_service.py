import logging
from typing import Tuple, Dict, Any, List
from sqlalchemy import desc, asc
from app.extensions import db
from app.models.job import JobPosting, JobMatchReport
from app.models.user import User
from app.models.resume import Resume
from app.models.ats import ATSAnalysis
from app.models.interview import InterviewSession
from app.ai.job_matching_engine import analyze_job_match_with_gemini

logger = logging.getLogger(__name__)

# Sample job seed data covering all 8 required roles
SAMPLE_JOB_POSTINGS = [
    {
        "title": "Software Engineer",
        "company": "Nexus Technologies",
        "location": "Remote (US/Canada)",
        "experience_level": "Mid Level",
        "employment_type": "Full-time",
        "salary_range": "$120,000 - $145,000",
        "description": "We are seeking a versatile Software Engineer to design, develop, and maintain high-performance web applications and backend services. You will collaborate with cross-functional teams to deliver scalable microservices and clean API architectures.",
        "required_skills": ["Python", "Flask", "PostgreSQL", "REST APIs", "Git", "Docker"],
        "preferred_skills": ["Redis", "Kubernetes", "AWS", "CI/CD"],
        "apply_url": "https://example.com/jobs/nexus-software-engineer"
    },
    {
        "title": "Frontend Developer",
        "company": "Vivid Cloud Systems",
        "location": "San Francisco, CA (Hybrid)",
        "experience_level": "Mid Level",
        "employment_type": "Full-time",
        "salary_range": "$115,000 - $140,000",
        "description": "Build stunning, responsive, and high-performance user interfaces using React, TypeScript, and modern CSS frameworks. You will partner with product design teams to create glassmorphic dashboards and real-time interactive user experiences.",
        "required_skills": ["React", "JavaScript", "TypeScript", "Tailwind CSS", "HTML5/CSS3", "REST APIs"],
        "preferred_skills": ["Next.js", "Redux", "Zustand", "Webpack/Vite", "Figma"],
        "apply_url": "https://example.com/jobs/vivid-frontend-developer"
    },
    {
        "title": "Backend Developer",
        "company": "Apex Data Infrastructure",
        "location": "New York, NY (Hybrid)",
        "experience_level": "Mid Level",
        "employment_type": "Full-time",
        "salary_range": "$125,000 - $155,000",
        "description": "Architect and scale mission-critical backend microservices, relational database schemas, and distributed caching pipelines. You will lead database query optimization and enforce high-throughput API security.",
        "required_skills": ["Python", "Flask", "SQLAlchemy", "PostgreSQL", "REST APIs", "Docker"],
        "preferred_skills": ["Redis", "RabbitMQ", "gRPC", "Kubernetes", "AWS"],
        "apply_url": "https://example.com/jobs/apex-backend-developer"
    },
    {
        "title": "Full Stack Engineer",
        "company": "Nova SaaS Labs",
        "location": "Austin, TX (Remote)",
        "experience_level": "Mid Level",
        "employment_type": "Full-time",
        "salary_range": "$130,000 - $160,000",
        "description": "Drive end-to-end feature delivery across our React SPA frontend and Python Flask microservice backend. You will build user-facing AI features, manage database ORM models, and optimize CI/CD deployment pipelines.",
        "required_skills": ["React", "Python", "Flask", "PostgreSQL", "JavaScript", "REST APIs"],
        "preferred_skills": ["Docker", "Tailwind CSS", "TypeScript", "Redis", "Vercel/Render"],
        "apply_url": "https://example.com/jobs/nova-fullstack-engineer"
    },
    {
        "title": "Data Scientist",
        "company": "Insight Intelligence AI",
        "location": "Boston, MA (Hybrid)",
        "experience_level": "Mid Level",
        "employment_type": "Full-time",
        "salary_range": "$135,000 - $165,000",
        "description": "Extract actionable business insights and train predictive machine learning models using Python, Pandas, Scikit-Learn, and SQL. You will build end-to-end data pipelines, run statistical hypothesis tests, and communicate findings to leadership.",
        "required_skills": ["Python", "SQL", "Pandas", "NumPy", "Scikit-Learn", "Data Visualization"],
        "preferred_skills": ["PyTorch", "TensorFlow", "PostgreSQL", "A/B Testing", "Spark"],
        "apply_url": "https://example.com/jobs/insight-data-scientist"
    },
    {
        "title": "Machine Learning Engineer",
        "company": "Cortex Applied AI",
        "location": "Seattle, WA (Remote)",
        "experience_level": "Senior Level",
        "employment_type": "Full-time",
        "salary_range": "$150,000 - $185,000",
        "description": "Train, fine-tune, and deploy state-of-the-art Deep Learning and Generative AI models into production inference pipelines. You will optimize LLM response latency, build vector search indexes, and engineer automated MLOps pipelines.",
        "required_skills": ["Python", "PyTorch", "Transformers", "LLMs", "Vector DBs", "Docker"],
        "preferred_skills": ["TensorRT", "ONNX", "FastAPI", "Kubernetes", "MLflow"],
        "apply_url": "https://example.com/jobs/cortex-ml-engineer"
    },
    {
        "title": "DevOps Engineer",
        "company": "Stratus Infrastructure Solutions",
        "location": "Denver, CO (Remote)",
        "experience_level": "Mid Level",
        "employment_type": "Full-time",
        "salary_range": "$125,000 - $155,000",
        "description": "Automate cloud infrastructure provisioning, container orchestration, and CI/CD deployment workflows. You will manage Kubernetes clusters, enforce zero-downtime blue-green deployments, and configure Prometheus monitoring.",
        "required_skills": ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Linux/Bash"],
        "preferred_skills": ["Python", "Prometheus/Grafana", "Helm", "Ansible"],
        "apply_url": "https://example.com/jobs/stratus-devops-engineer"
    },
    {
        "title": "Product Manager",
        "company": "Elevate Product Studio",
        "location": "Chicago, IL (Hybrid)",
        "experience_level": "Mid Level",
        "employment_type": "Full-time",
        "salary_range": "$130,000 - $160,000",
        "description": "Lead product roadmap vision, user research, feature prioritization, and sprint execution for our SaaS platform. You will work closely with engineering leads and UX designers to launch high-impact product experiences.",
        "required_skills": ["Product Strategy", "User Research", "Agile/Scrum", "Data Analytics", "Roadmap Planning", "Wireframing"],
        "preferred_skills": ["SQL", "A/B Testing", "Mixpanel", "Jira", "Technical Background"],
        "apply_url": "https://example.com/jobs/elevate-product-manager"
    }
]


class JobService:
    """Service layer managing job postings, AI match generation, and candidate match reports."""

    @classmethod
    def seed_jobs_if_empty(cls):
        """Seed sample job postings if database is empty."""
        try:
            count = JobPosting.query.count()
            if count == 0:
                logger.info("Seeding database with sample job postings...")
                for job_data in SAMPLE_JOB_POSTINGS:
                    jp = JobPosting(
                        title=job_data["title"],
                        company=job_data["company"],
                        location=job_data["location"],
                        experience_level=job_data["experience_level"],
                        employment_type=job_data["employment_type"],
                        salary_range=job_data["salary_range"],
                        description=job_data["description"],
                        required_skills=job_data["required_skills"],
                        preferred_skills=job_data["preferred_skills"],
                        apply_url=job_data["apply_url"]
                    )
                    db.session.add(jp)
                db.session.commit()
                logger.info(f"Successfully seeded {len(SAMPLE_JOB_POSTINGS)} job postings.")
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to seed job postings: {e}")

    @classmethod
    def get_available_jobs(
        cls,
        user_id: str,
        role_filter: str = None,
        location_filter: str = None,
        exp_filter: str = None,
        min_match: int = 0,
        sort_by: str = 'match_score' # 'match_score', 'company', 'role'
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Fetch available job postings with optional filters, sorting, and candidate match data."""
        # Ensure database has job postings
        cls.seed_jobs_if_empty()

        query = JobPosting.query

        if role_filter and role_filter.strip() and role_filter != 'All Roles':
            query = query.filter(JobPosting.title.ilike(f"%{role_filter.strip()}%"))

        if location_filter and location_filter.strip():
            query = query.filter(JobPosting.location.ilike(f"%{location_filter.strip()}%"))

        if exp_filter and exp_filter.strip() and exp_filter != 'All Levels':
            query = query.filter(JobPosting.experience_level.ilike(f"%{exp_filter.strip()}%"))

        jobs = query.all()

        # Fetch candidate's match reports to attach score & report_id
        match_reports = JobMatchReport.query.filter_by(user_id=user_id).all()
        report_by_job_id = {mr.job_id: mr for mr in match_reports}

        result_jobs = []
        for job in jobs:
            job_dict = job.to_dict()
            mr = report_by_job_id.get(job.id)

            if mr:
                job_dict['match_percentage'] = mr.match_percentage
                job_dict['match_report_id'] = mr.id
                job_dict['matching_skills'] = mr.matching_skills or []
                job_dict['missing_skills'] = mr.missing_skills or []
            else:
                # Basic skill overlap estimate if no AI report generated yet
                job_dict['match_percentage'] = 0
                job_dict['match_report_id'] = None
                job_dict['matching_skills'] = []
                job_dict['missing_skills'] = job.required_skills or []

            if job_dict['match_percentage'] >= min_match:
                result_jobs.append(job_dict)

        # Sorting logic
        if sort_by == 'company':
            result_jobs.sort(key=lambda x: x['company'].lower())
        elif sort_by == 'role':
            result_jobs.sort(key=lambda x: x['title'].lower())
        else: # Default: match_score
            result_jobs.sort(key=lambda x: x['match_percentage'], reverse=True)

        return result_jobs, 200

    @classmethod
    def generate_job_matches(cls, user_id: str, resume_id: str = None) -> Tuple[Dict[str, Any], int]:
        """
        Generate personalized AI job match reports comparing candidate's profile
        against all available job postings using Gemini AI.
        """
        cls.seed_jobs_if_empty()

        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found.'}, 404

        # 1. Fetch candidate profile details
        candidate_profile = user.to_dict()

        # 2. Fetch latest parsed resume
        resume = None
        if resume_id:
            resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
        if not resume:
            resume = Resume.query.filter_by(user_id=user_id).order_by(desc(Resume.created_at)).first()

        resume_data = resume.parsed_json if (resume and resume.parsed_json) else (resume.filename if resume else "")

        # 3. Fetch candidate's latest ATS and Interview context if available
        ats_latest = ATSAnalysis.query.filter_by(user_id=user_id).order_by(desc(ATSAnalysis.created_at)).first()
        interview_latest = InterviewSession.query.filter_by(user_id=user_id, status='completed').order_by(desc(InterviewSession.created_at)).first()

        if ats_latest and ats_latest.matching_skills:
            candidate_profile['primary_skills'] = list(set(
                (candidate_profile.get('primary_skills') or []) + (ats_latest.matching_skills or [])
            ))

        jobs = JobPosting.query.all()
        generated_reports = []

        try:
            for job in jobs:
                job_dict = job.to_dict()
                
                # Check existing report to update or create
                existing_report = JobMatchReport.query.filter_by(user_id=user_id, job_id=job.id).first()

                # Run Gemini AI Job Matcher (or fallback)
                match_result = analyze_job_match_with_gemini(
                    job_posting=job_dict,
                    candidate_profile=candidate_profile,
                    resume_data_or_text=resume_data
                )

                if existing_report:
                    report = existing_report
                else:
                    report = JobMatchReport(user_id=user_id, job_id=job.id)
                    db.session.add(report)

                report.resume_id = resume.id if resume else None
                report.match_percentage = match_result.get('match_percentage', 70)
                report.overall_suitability_score = match_result.get('overall_suitability_score', 75)
                report.experience_match = match_result.get('experience_match', 'Moderate')
                report.education_match = match_result.get('education_match', 'High')
                report.certification_match = match_result.get('certification_match', 'Moderate')
                report.matching_skills = match_result.get('matching_skills', [])
                report.missing_skills = match_result.get('missing_skills', [])
                report.strengths = match_result.get('strengths', [])
                report.areas_to_improve = match_result.get('areas_to_improve', [])
                report.ai_career_fit_explanation = match_result.get('ai_career_fit_explanation', '')
                report.recommended_learning_path = match_result.get('recommended_learning_path', [])

                db.session.flush()
                generated_reports.append(report.to_dict())

            db.session.commit()
            logger.info(f"Successfully generated {len(generated_reports)} AI job match reports for user {user_id}")

            return {
                "message": f"Successfully generated AI job matches for {len(generated_reports)} jobs.",
                "matches": generated_reports
            }, 200

        except Exception as e:
            db.session.rollback()
            logger.exception("Failed to generate AI job matches")
            return {'error': f'Failed to generate job matches: {str(e)}'}, 500

    @classmethod
    def get_user_match_reports(cls, user_id: str) -> Tuple[List[Dict[str, Any]], int]:
        """Fetch all previous job match reports for logged-in user."""
        reports = JobMatchReport.query.filter_by(user_id=user_id).order_by(desc(JobMatchReport.match_percentage)).all()
        return [r.to_dict() for r in reports], 200

    @classmethod
    def get_match_report_by_id(cls, user_id: str, report_id: str) -> Tuple[Dict[str, Any], int]:
        """Fetch detailed single JobMatchReport by ID."""
        report = JobMatchReport.query.filter_by(id=report_id, user_id=user_id).first()
        if not report:
            return {'error': 'Job Match Report not found or access denied.'}, 404
        return {'report': report.to_dict()}, 200

    @classmethod
    def delete_match_report(cls, user_id: str, report_id: str) -> Tuple[Dict[str, Any], int]:
        """Delete a job match report."""
        report = JobMatchReport.query.filter_by(id=report_id, user_id=user_id).first()
        if not report:
            return {'error': 'Job Match Report not found or access denied.'}, 404

        try:
            db.session.delete(report)
            db.session.commit()
            return {'message': 'Job match report deleted successfully.'}, 200
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Failed to delete job match report {report_id}")
            return {'error': f'Failed to delete report: {str(e)}'}, 500
