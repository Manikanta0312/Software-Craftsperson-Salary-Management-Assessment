# Trade-off & Decision Log

## SQLite vs PostgreSQL
Chose SQLite because the spec says "SQLite" and the dataset (10K rows) fits comfortably.
SQLAlchemy means swapping to Postgres is a one-line change in DATABASE_URL.

## FastAPI vs Django REST Framework
FastAPI: less boilerplate, native async, auto OpenAPI docs. Django would be overkill for this scope.

## Soft delete vs hard delete
Soft delete preserves salary history referential integrity and gives HR a restore path.
A background job could hard-delete records older than the retention policy.

## Bulk seed strategy
Raw `sqlite3.executemany` over SQLAlchemy ORM objects because ORM object creation
(Python object instantiation + session tracking) is the bottleneck at 10K rows, not SQLite.
Result: 0.13s vs ~8s with ORM.

## TanStack Query over Redux/Zustand
Server state and client state have different lifetimes. TQ handles caching, background refetch,
and loading states automatically — no boilerplate reducers needed.

## Recharts vs Chart.js
Recharts is React-native (JSX-composable), Chart.js requires imperative ref management.
