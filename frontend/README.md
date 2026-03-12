# DataQuest AI Prototype - Monorepo

Welcome to the DataQuest AI monorepo. This project is structured to support independent deployment of the frontend and backend services.

## Project Structure

- **[/frontend](file:///d:/experiments/dataquest-ai-prototype/frontend/)**: React (Vite) frontend application.
  - Recommended Deployment: **Vercel**
  - Path: `frontend/`
- **[/backend](file:///d:/experiments/dataquest-ai-prototype/backend/)**: FastAPI backend and ML infrastructure.
  - Recommended Deployment: **Render**
  - Path: `backend/`

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r api/requirements.txt
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

## Deployment Instructions

For platform-specific deployment steps, please refer to:
- [Manual Deployment Guide](file:///C:/Users/chand/.gemini/antigravity/brain/6893b688-f4c9-4eba-bca5-a407bcedf47c/deployment_guide.md)
- [Frontend README](file:///d:/experiments/dataquest-ai-prototype/frontend/README.md)
- [Backend README](file:///d:/experiments/dataquest-ai-prototype/backend/README.md)

