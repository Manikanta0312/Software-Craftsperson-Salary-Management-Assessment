# Architecture

## Stack

| Layer | Technology | Rationale |
|---|---|---|
| Backend | FastAPI (Python 3.12) | Async-capable, automatic OpenAPI docs, Pydantic validation |
| ORM | SQLAlchemy 2 | Type-safe queries, easy migration path to Postgres |
| DB | SQLite + WAL mode | Zero-infra, sufficient for 10K employees, fast writes |
| Migrations | Alembic | Schema versioning without raw SQL |
| Frontend | React 18 + Vite | Fast HMR, great DX |
| Styling | TailwindCSS | Utility-first, no design system overhead |
| Server state | TanStack Query | Caching, background refetch, optimistic updates |
| Charts | Recharts | Composable, well-typed |

## Data flow

```
React UI
  ↓ axios + TanStack Query
FastAPI routers (/api/employees, /api/analytics)
  ↓ service layer (pure functions, no HTTP concerns)
SQLAlchemy ORM
  ↓ parameterized SQL
SQLite (WAL mode, NORMAL sync)
```

## Key design decisions

1. **Service layer** separates business logic from HTTP — routers are thin, services are unit-testable.
2. **Soft deletes** (`is_active = false`) preserve salary history integrity.
3. **Salary history** table auto-records every salary change made through the API.
4. **Bulk seed** uses raw `sqlite3.executemany` (bypasses ORM overhead) → 10K rows in ~0.13s.
5. **Indexes** on `country`, `job_title`, `department` make analytics queries fast at scale.
6. **Pagination** default 20 rows/page to avoid large payloads with 10K rows.

## Analytics endpoints

- `GET /api/analytics/summary` — global KPIs
- `GET /api/analytics/by-country` — min/max/avg/median per country
- `GET /api/analytics/by-job-title?country=X` — avg salary per title (optionally filtered)
- `GET /api/analytics/top-earners?limit=10` — top N by salary
- `GET /api/analytics/salary-distribution?buckets=10` — histogram data
