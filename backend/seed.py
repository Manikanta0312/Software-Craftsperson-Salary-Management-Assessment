"""
Seed script: inserts 10,000 employees using bulk executemany.
Idempotent — truncates and re-seeds on every run.
Target: < 3 seconds for 10,000 rows.
"""
import random
import time
import sqlite3
import sys
import os
from pathlib import Path
from datetime import date, timedelta

DB_PATH = Path(__file__).parent / "salary.db"
NAMES_DIR = Path(__file__).parent.parent

COUNTRIES = [
    "India", "United States", "Germany", "United Kingdom",
    "Singapore", "Australia", "Canada", "France",
    "Japan", "Brazil", "Netherlands", "Sweden",
]

JOB_TITLES = [
    "Software Engineer", "Senior Software Engineer", "Staff Engineer",
    "Product Manager", "Senior Product Manager", "Principal PM",
    "Data Scientist", "Machine Learning Engineer", "Data Analyst",
    "DevOps Engineer", "SRE", "Platform Engineer",
    "UX Designer", "Product Designer", "UI Designer",
    "QA Engineer", "SDET", "Test Lead",
    "HR Analyst", "HR Business Partner", "Talent Acquisition",
    "Finance Analyst", "Senior Finance Analyst", "Controller",
    "Marketing Analyst", "Growth Manager", "Content Strategist",
    "Sales Engineer", "Account Executive", "Sales Manager",
    "Engineering Manager", "Director of Engineering", "VP Engineering",
    "CTO", "CPO", "COO",
]

DEPARTMENTS = [
    "Engineering", "Product", "Data & Analytics",
    "Design", "QA", "HR", "Finance",
    "Marketing", "Sales", "Operations", "Leadership",
]

EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"]
EMPLOYMENT_WEIGHTS = [0.80, 0.05, 0.12, 0.03]

SALARY_RANGES = {
    "Junior": (30_000, 70_000),
    "Mid":    (65_000, 110_000),
    "Senior": (100_000, 160_000),
    "Staff":  (140_000, 200_000),
    "Lead":   (150_000, 220_000),
}

START_DATE = date(2010, 1, 1)
END_DATE   = date(2024, 12, 31)


def random_hire_date() -> str:
    delta = (END_DATE - START_DATE).days
    return (START_DATE + timedelta(days=random.randint(0, delta))).isoformat()


def salary_for_title(title: str) -> float:
    t = title.lower()
    if any(k in t for k in ("cto", "cpo", "coo", "vp", "director")):
        lo, hi = SALARY_RANGES["Lead"]
    elif any(k in t for k in ("staff", "principal")):
        lo, hi = SALARY_RANGES["Staff"]
    elif "senior" in t or "manager" in t:
        lo, hi = SALARY_RANGES["Senior"]
    elif "lead" in t:
        lo, hi = SALARY_RANGES["Staff"]
    else:
        lo, hi = SALARY_RANGES["Mid"]
    return round(random.uniform(lo, hi), 2)


def main():
    # Create tables first (safe to call multiple times)
    sys.path.insert(0, str(Path(__file__).parent))
    from app.database import Base, engine
    Base.metadata.create_all(bind=engine)

    # Resolve name files — check both parent and current dir
    names_dir = NAMES_DIR if (NAMES_DIR / "first_names.txt").exists() else Path(__file__).parent
    first_names = (names_dir / "first_names.txt").read_text().splitlines()
    last_names  = (names_dir / "last_names.txt").read_text().splitlines()

    print(f"Seeding 10,000 employees from {len(first_names)} × {len(last_names)} names…")
    t0 = time.perf_counter()

    rows = [
        (
            f"{random.choice(first_names)} {random.choice(last_names)}",
            random.choice(JOB_TITLES),
            random.choice(DEPARTMENTS),
            random.choice(COUNTRIES),
            salary_for_title(random.choice(JOB_TITLES)),
            "USD",
            random.choices(EMPLOYMENT_TYPES, EMPLOYMENT_WEIGHTS)[0],
            random_hire_date(),
        )
        for _ in range(10_000)
    ]

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")

    conn.execute("DELETE FROM salary_history")
    conn.execute("DELETE FROM employees")

    conn.executemany(
        """
        INSERT INTO employees
          (full_name, job_title, department, country, salary, currency,
           employment_type, hire_date, is_active, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,1,datetime('now'),datetime('now'))
        """,
        rows,
    )
    conn.commit()
    conn.close()

    elapsed = time.perf_counter() - t0
    print(f"✓ Seeded 10,000 employees in {elapsed:.2f}s")


if __name__ == "__main__":
    main()