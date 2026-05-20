# AI Prompts & Usage Log

Used Claude (claude.ai) throughout the assessment.

## Prompts used

1. **Architecture planning** — "Design a full-stack salary management tool for 10K employees. 
   Python backend, React frontend, SQLite. Give me the architecture diagram, API design, 
   data model, and TDD commit plan."

2. **Backend scaffolding** — "Generate FastAPI code for employee CRUD with SQLAlchemy 2 ORM,
   Pydantic v2 schemas, soft delete, salary history tracking. Follow TDD: write tests first."

3. **Analytics service** — "Write analytics functions: min/max/avg/median by country, 
   avg by job title, top earners, salary distribution histogram. Use SQLAlchemy 2 select()."

4. **Seed script** — "Write a performant seed script for 10K employees using sqlite3.executemany.
   Must be idempotent. Use first_names.txt × last_names.txt cross product."

5. **React UI** — "Build a React + TailwindCSS employee management UI with:
   paginated table, filters (country, department, search), add/edit/delete modals,
   salary insights dashboard with Recharts bar charts."

## What AI accelerated
- Boilerplate (SQLAlchemy models, Pydantic schemas, router wiring)
- Test scaffolding (conftest setup, parametrized fixtures)
- Chart component wiring

## What I validated manually
- All 26 backend tests pass
- All 4 frontend tests pass  
- Frontend builds without TypeScript errors
- Seed script performance (0.13s for 10K rows)
- API correctness verified against running server
