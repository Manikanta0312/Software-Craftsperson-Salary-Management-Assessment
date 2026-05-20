from sqlalchemy import select, func, text
from sqlalchemy.orm import Session
from app.models import Employee
from app.schemas import (
    CountrySalaryStats, JobTitleSalaryStats,
    SalaryBucket, AnalyticsSummary, TopEarner,
)


def get_summary(db: Session) -> AnalyticsSummary:
    row = db.execute(
        select(
            func.count(Employee.id),
            func.sum(func.iif(Employee.is_active == True, 1, 0)),
            func.min(Employee.salary),
            func.max(Employee.salary),
            func.avg(Employee.salary),
            func.sum(Employee.salary),
            func.count(func.distinct(Employee.country)),
            func.count(func.distinct(Employee.job_title)),
        ).where(Employee.is_active == True)
    ).one()

    return AnalyticsSummary(
        total_employees=row[0] or 0,
        active_employees=row[1] or 0,
        global_min_salary=round(row[2] or 0, 2),
        global_max_salary=round(row[3] or 0, 2),
        global_avg_salary=round(row[4] or 0, 2),
        total_payroll=round(row[5] or 0, 2),
        countries_count=row[6] or 0,
        job_titles_count=row[7] or 0,
    )


def get_stats_by_country(db: Session) -> list[CountrySalaryStats]:
    rows = db.execute(
        select(
            Employee.country,
            func.min(Employee.salary),
            func.max(Employee.salary),
            func.avg(Employee.salary),
            func.count(Employee.id),
        )
        .where(Employee.is_active == True)
        .group_by(Employee.country)
        .order_by(Employee.country)
    ).all()

    results = []
    for row in rows:
        # Compute median per country with a separate query (SQLite lacks PERCENTILE_CONT)
        salaries = db.scalars(
            select(Employee.salary)
            .where(Employee.is_active == True, Employee.country == row[0])
            .order_by(Employee.salary)
        ).all()
        n = len(salaries)
        median = (salaries[n // 2] + salaries[(n - 1) // 2]) / 2 if n else 0

        results.append(
            CountrySalaryStats(
                country=row[0],
                min_salary=round(row[1], 2),
                max_salary=round(row[2], 2),
                avg_salary=round(row[3], 2),
                median_salary=round(median, 2),
                headcount=row[4],
            )
        )
    return results


def get_stats_for_country(db: Session, country: str) -> CountrySalaryStats | None:
    all_stats = get_stats_by_country(db)
    return next((s for s in all_stats if s.country == country), None)


def get_stats_by_job_title(db: Session, country: str | None = None) -> list[JobTitleSalaryStats]:
    stmt = (
        select(
            Employee.job_title,
            Employee.country,
            func.avg(Employee.salary),
            func.min(Employee.salary),
            func.max(Employee.salary),
            func.count(Employee.id),
        )
        .where(Employee.is_active == True)
        .group_by(Employee.job_title, Employee.country)
        .order_by(Employee.job_title)
    )
    if country:
        stmt = stmt.where(Employee.country == country)

    rows = db.execute(stmt).all()
    return [
        JobTitleSalaryStats(
            job_title=row[0],
            country=row[1],
            avg_salary=round(row[2], 2),
            min_salary=round(row[3], 2),
            max_salary=round(row[4], 2),
            headcount=row[5],
        )
        for row in rows
    ]


def get_top_earners(db: Session, limit: int = 10) -> list[TopEarner]:
    rows = db.execute(
        select(
            Employee.id,
            Employee.full_name,
            Employee.job_title,
            Employee.department,
            Employee.country,
            Employee.salary,
        )
        .where(Employee.is_active == True)
        .order_by(Employee.salary.desc())
        .limit(limit)
    ).all()

    return [
        TopEarner(
            id=row[0], full_name=row[1], job_title=row[2],
            department=row[3], country=row[4], salary=row[5],
        )
        for row in rows
    ]


def get_salary_distribution(db: Session, buckets: int = 10) -> list[SalaryBucket]:
    salaries = db.scalars(
        select(Employee.salary).where(Employee.is_active == True).order_by(Employee.salary)
    ).all()
    if not salaries:
        return []

    min_s, max_s = salaries[0], salaries[-1]
    if min_s == max_s:
        return [SalaryBucket(range_label=f"${min_s:,.0f}", count=len(salaries), min_val=min_s, max_val=max_s)]

    step = (max_s - min_s) / buckets
    result = []
    for i in range(buckets):
        lo = min_s + i * step
        hi = min_s + (i + 1) * step
        count = sum(1 for s in salaries if lo <= s < hi) + (1 if i == buckets - 1 and salaries[-1] == max_s else 0)
        result.append(
            SalaryBucket(
                range_label=f"${lo:,.0f}–${hi:,.0f}",
                count=count,
                min_val=round(lo, 2),
                max_val=round(hi, 2),
            )
        )
    return result
