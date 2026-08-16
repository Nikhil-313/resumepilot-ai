# ResumePilot AI 🚀

> AI-powered career intelligence platform for job seekers who want to improve resumes, match with job descriptions, assess ATS compatibility, and prepare for interviews with Gemini-powered guidance.

---

## 🌐 Live Deployment

- Frontend: https://resumepilot-ai-delta.vercel.app/
- Backend API: https://resumepilot-backend-n2xh.onrender.com
- Backend Health Check: https://resumepilot-backend-n2xh.onrender.com/api/v1/health
- Database: Render PostgreSQL (production)
- Local database: PostgreSQL via Docker

---

## ✨ Key Features

- Resume parsing and structured extraction
- ATS compatibility analysis
- Job description matching and recommendation
- Application tracking and career guidance
- Interview preparation and AI-powered mock interviews
- Resume optimization suggestions
- Career coaching and progress tracking

---

## 🛠️ Tech Stack

- Frontend: React 18, Vite, Tailwind CSS, Axios, Recharts, Framer Motion, Lucide Icons
- Backend: Python, Flask, Flask-SQLAlchemy, Flask-JWT-Extended, PyMuPDF
- Database: PostgreSQL (Docker locally / Render PostgreSQL in production)
- AI engine: Google Gemini API
- Deployment: Vercel + Render
- Containerization: Docker and Docker Compose

---

## 📁 Repository Structure

```text
resumepilot-ai/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json
├── README.md
├── docs/
│   ├── api.md
│   ├── architecture.md
│   └── database.md
├── backend/
│   ├── .env.example
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── run.py
│   ├── uploads/
│   ├── tests/
│   └── app/
│       ├── __init__.py
│       ├── config.py
│       ├── extensions.py
│       ├── ai/
│       ├── api/
│       ├── logs/
│       ├── models/
│       ├── parsers/
│       ├── prompts/
│       ├── schemas/
│       ├── services/
│       ├── utils/
│       └── vectorstore/
├── frontend/
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   └── tests/
└── .github/
```

---

## 🚀 Quick Start

### 1) Backend setup

```bash
cd backend
python -m venv venv
```

On Windows:

```bash
venv\Scripts\activate
```

On macOS/Linux:

```bash
source venv/bin/activate
```

Then install dependencies and start the API:

```bash
pip install -r requirements.txt
cp .env.example .env
python run.py
```

The backend runs at:

- http://localhost:5000

> Note: the app is configured to use PostgreSQL in Docker-based local development, but the backend also has a SQLite fallback for quick local testing.

### 2) Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend runs at:

- http://localhost:3000

### 3) Docker Compose setup

Run the full stack with a single command from the project root:

```bash
docker-compose up --build
```

This starts the frontend, backend, and PostgreSQL database together.

---

## 🔐 Environment Variables

The project expects environment variables for both local and production setups.

### Root environment file

Example values are defined in [.env.example](.env.example).

Required variables include:

- FLASK_ENV
- SECRET_KEY
- JWT_SECRET_KEY
- DATABASE_URL
- GEMINI_API_KEY
- CORS_ORIGINS
- VITE_API_BASE_URL

### Frontend environment file

The frontend uses a dedicated [.env.example](frontend/.env.example) file for client configuration.

---

## 🧪 Health Checks

### Local

```text
GET http://localhost:5000/api/v1/health
```

### Production

```text
GET https://resumepilot-backend-n2xh.onrender.com/api/v1/health
```

The health endpoint verifies that the backend is running and that the database connection is available.

---

## 🔒 Production Security

The backend includes production hardening for:

- strict validation of SECRET_KEY
- strict validation of JWT_SECRET_KEY
- secure environment-based configuration
- explicit CORS origin management
- JWT-based authentication
- exclusion of sensitive values from Git

Development environments continue to support safe local defaults without requiring production secrets.

---

## ⏱️ Mock Interview Timing

The interview flow includes a countdown timer based on question count:

- 5 questions: 15 minutes
- 10 questions: 25 minutes
- 15 questions: 35 minutes
- other counts: fallback duration based on the number of questions

The timer persists through question navigation and submits the interview automatically when the time expires.

---

## 🐳 Docker Architecture

```text
ResumePilot AI
    │
    ├── Frontend (React/Vite) :3000
    ├── Backend (Flask) :5000
    └── PostgreSQL :5432
```

### Production flow

```text
Internet
  │
  ▼
Vercel Frontend
  │
  ▼
Render Backend (Flask/Gunicorn)
  │
  ├── Gemini API
  └── Render PostgreSQL
```

---

## 📦 Data and File Storage

### Local development

- PostgreSQL runs in Docker and stores application data in a Docker volume.
- Uploaded resume files are stored in backend/uploads/.

### Production

- Application data is stored in Render PostgreSQL.
- Uploaded files are stored in the runtime upload directory of the backend service.

> Note: the current free Render deployment uses ephemeral storage, so uploaded files should be treated as temporary in the demo environment.

---

## ✅ Production Verification

The deployed app has been validated with the following checks:

- Flask production app starts successfully
- Render PostgreSQL connection is verified
- Health endpoint responds successfully
- Frontend is deployed successfully on Vercel
- Backend is deployed successfully on Render
- CORS is configured correctly for the frontend
- SECRET_KEY and JWT_SECRET_KEY validation is active
- Docker-based backend deployment is verified
- Frontend production build completes successfully
- Mock interview countdown timer works as expected
- No secrets are committed to the repository

---

## 📄 License

MIT License.

Built for production-quality AI-powered career applications.
