# ResumePilot AI 🚀

> **AI-Powered Career Intelligence Platform**  
> Help job seekers (Students, Freshers, Software Engineers, Data Scientists) optimize resumes, analyze ATS compatibility, match job descriptions, and prepare for interviews using Gemini AI.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios, Recharts, Framer Motion
- **Backend**: Python Flask (Application Factory), Flask-SQLAlchemy, Flask-JWT-Extended, PyMuPDF
- **Database**: PostgreSQL (Docker / Neon / Managed Postgres)
- **AI Engine**: Google Gemini 1.5 API
- **Deployment**: Vercel (Frontend) + Render / Docker (Backend)

---

## 📁 Repository Structure

```
resumepilot-ai/
├── frontend/             # React 18 SPA (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/   # Modular UI components
│   │   ├── pages/        # Application views
│   │   ├── services/     # API integration services
│   │   └── styles/       # Design system & Tailwind setup
│   ├── Dockerfile
│   └── package.json
├── backend/              # Python Flask REST API
│   ├── app/
│   │   ├── api/          # Route handlers & endpoints
│   │   ├── models/       # Database models (SQLAlchemy)
│   │   ├── services/     # PDF parsing & Gemini AI pipelines
│   │   └── utils/        # Decorators & helpers
│   ├── Dockerfile
│   ├── requirements.txt
│   └── run.py
├── docker-compose.yml     # Multi-container orchestration (DB + API + Web)
├── .env.example
└── README.md
```

---

## 🚦 Quick Start Development Setup

### Option 1: Local Environment Setup

#### 1. Backend Setup (Flask)
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
python run.py
```
Backend server will run at: `http://localhost:5000`

#### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Frontend app will run at: `http://localhost:3000`

---

### Option 2: Docker Compose Setup

Run the entire application stack (PostgreSQL + Flask API + React Frontend) with a single command:

```bash
docker-compose up --build
```

---

## 🧪 Health Check Endpoints

- **API Status**: `GET http://localhost:5000/api/v1/health`
- **Database Health**: Included in `/api/v1/health` JSON response.

---

## 📄 License
MIT License. Built for Production Quality SaaS Applications.
