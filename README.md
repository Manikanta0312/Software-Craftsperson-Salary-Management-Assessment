## Live Demo
- **Video Demo**: https://www.loom.com/share/ca8f3ebfb4c44c2b80a0a9cfcb0567a2
- **GitHub**: https://github.com/Manikanta0312/Software-Craftsperson-Salary-Management-Assessment

# SalaryHQ — Salary Management Tool

HR salary management platform for 10,000+ employees. Built with FastAPI, React, and SQLite.

## Features

- **Employee CRUD** — Add, view, edit, soft-delete employees via paginated table
- **Rich filters** — Search by name/email, filter by country, department, employment type, salary range  
- **Salary history** — Every salary change is automatically recorded with old/new values
- **Analytics dashboard** — Min/max/avg/median salary per country, avg per job title, top earners, salary distribution histogram
- **Seed script** — 10,000 realistic employees in ~0.13s using bulk `executemany`

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + SQLAlchemy 2 + Pydantic v2 |
| Database | SQLite (WAL mode) + Alembic |
| Frontend | React 18 + Vite + TailwindCSS |
| Charts | Recharts |
| Server state | TanStack Query |
| Tests | pytest + httpx (backend) · vitest + RTL (frontend) |

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
python seed.py          # seeds 10,000 employees
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Running Tests

```bash
# Backend — 26 tests
cd backend && python -m pytest tests/ -v

# Frontend — 4 tests
cd frontend && npm test
```

## API Docs

Auto-generated at http://localhost:8000/docs (Swagger UI)

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
