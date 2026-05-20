from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "sqlite:///./salary.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    execution_options={"sqlite_raw_colnames": True},
)

# Optimise SQLite for bulk writes
with engine.connect() as conn:
    conn.execute(__import__("sqlalchemy").text("PRAGMA journal_mode=WAL"))
    conn.execute(__import__("sqlalchemy").text("PRAGMA synchronous=NORMAL"))

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
