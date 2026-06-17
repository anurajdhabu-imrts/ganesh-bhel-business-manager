# Ganesh Bhel Business Manager — Backend (FastAPI)

Python FastAPI service backed by PostgreSQL (via SQLAlchemy + Alembic), with
rolling JSON backups and Gemini AI endpoints.

## Project layout

```
backend/
├── app/
│   ├── main.py              # FastAPI app + CORS + router wiring
│   ├── core/
│   │   └── config.py        # Settings (env / .env), DB URL builder
│   ├── db/
│   │   ├── base.py          # Declarative Base
│   │   └── session.py       # Engine + session + get_db dependency
│   ├── models/
│   │   └── entities.py      # SQLAlchemy ORM models (users + business tables)
│   ├── schemas/
│   │   └── system.py        # Pydantic schemas (camelCase contract)
│   ├── services/
│   │   ├── auth.py          # Firebase (optional) / local-user identity
│   │   ├── sync_service.py  # Load/save the SystemData blob to Postgres
│   │   ├── backup_service.py# Local JSON snapshot + rolling backups
│   │   └── gemini_service.py# AI chat / forecast / health / voice parse
│   └── api/
│       ├── deps.py          # Shared dependencies (current user)
│       └── routes/          # health, data, backups, ai routers
├── alembic/                 # Migrations (env.py reads the app settings)
├── backups/                 # Timestamped JSON snapshots (gitignored)
├── alembic.ini
├── requirements.txt
└── .env.example
```

## Setup

```bash
python -m venv venv
venv\Scripts\activate            # Windows
pip install -r requirements.txt
copy .env.example .env           # edit credentials
```

Create the database, then run migrations:

```bash
psql -U postgres -c "CREATE DATABASE ganesh_bhel_business_manager;"
alembic upgrade head
uvicorn app.main:app --reload
```

Interactive API docs: <http://localhost:8000/docs>

## Configuration (`.env`)

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | Full SQLAlchemy URL (overrides the parts below) | — |
| `POSTGRES_HOST/PORT/USER/PASSWORD/DB` | Connection parts | `localhost:5432/postgres/postgres/ganesh_bhel_business_manager` |
| `BACKEND_CORS_ORIGINS` | Comma-separated allowed origins, or `*` | dev origins |
| `GEMINI_API_KEY` | Enables real AI responses (offline fallback otherwise) | — |
| `FIREBASE_ENABLED` | Verify Firebase Bearer tokens | `false` |
| `MAX_BACKUPS` | Rolling backup retention | `12` |

## API endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/data` | Load full system state for the current user |
| POST | `/api/data` | Save full system state (and snapshot) |
| GET | `/api/backups` | List backup snapshots |
| POST | `/api/backups/create` | Create a manual snapshot |
| POST | `/api/backups/restore` | Restore from a snapshot |
| POST | `/api/backups/upload` | Upload a snapshot as primary |
| POST | `/api/ai/chat` | Business-operations chat assistant |
| POST | `/api/ai/forecast` | Sales forecast |
| POST | `/api/ai/health` | Business health scorecard |
| POST | `/api/ai/parse-voice` | Natural-language entry parsing |

## Migrations

```bash
alembic revision --autogenerate -m "describe change"   # after editing models
alembic upgrade head
alembic downgrade -1
```

## Notes

- **Auth is optional.** With `FIREBASE_ENABLED=false` the API uses a single
  local user, so it works fully offline against PostgreSQL. Enable Firebase and
  send `Authorization: Bearer <token>` for multi-user/auth mode.
- **Resilience.** Every save also writes `db.json` and a timestamped backup, so
  data survives even if the database is temporarily unavailable.
