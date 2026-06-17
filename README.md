# Ganesh Bhel Business Manager

A business management system for the Ganesh Bhel snack stalls (sales, purchases,
staff, advances, salaries, inventory, daily closing, reports and an AI helper).

## Architecture

```
ganesh-bhel-business-manager/
├── backend/      # Python FastAPI + SQLAlchemy + Alembic (PostgreSQL)
└── frontend/     # React + Vite + TypeScript + Tailwind
```

- **Backend** — FastAPI REST API. Persists the operational state to PostgreSQL
  (`ganesh_bhel_business_manager`), keeps rolling JSON backups, and exposes
  Gemini-backed AI endpoints (with offline fallbacks).
- **Frontend** — React single-page app that reads/writes the system state via
  `/api/*`. In development, Vite proxies `/api` to the backend on port 8000.

## Quick start

### 1. Database
Create the PostgreSQL database (one time):

```bash
createdb ganesh_bhel_business_manager
# or: psql -U postgres -c "CREATE DATABASE ganesh_bhel_business_manager;"
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows  (source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
copy .env.example .env           # then edit DB credentials / GEMINI_API_KEY
alembic upgrade head             # create the schema
uvicorn app.main:app --reload    # http://localhost:8000  (docs at /docs)
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

See [backend/README.md](backend/README.md) for full backend details.
