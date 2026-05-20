from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import (
    AnalyticsSummary, CountrySalaryStats,
    JobTitleSalaryStats, SalaryBucket, TopEarner,
)
from app.services import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def summary(db: Session = Depends(get_db)):
    return analytics_service.get_summary(db)


@router.get("/by-country", response_model=list[CountrySalaryStats])
def stats_by_country(db: Session = Depends(get_db)):
    return analytics_service.get_stats_by_country(db)


@router.get("/by-country/{country}", response_model=CountrySalaryStats)
def stats_for_country(country: str, db: Session = Depends(get_db)):
    stats = analytics_service.get_stats_for_country(db, country)
    if not stats:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"No data for country: {country}")
    return stats


@router.get("/by-job-title", response_model=list[JobTitleSalaryStats])
def stats_by_job_title(
    country: str | None = None,
    db: Session = Depends(get_db),
):
    return analytics_service.get_stats_by_job_title(db, country)


@router.get("/top-earners", response_model=list[TopEarner])
def top_earners(limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    return analytics_service.get_top_earners(db, limit)


@router.get("/salary-distribution", response_model=list[SalaryBucket])
def salary_distribution(
    buckets: int = Query(10, ge=2, le=50),
    db: Session = Depends(get_db),
):
    return analytics_service.get_salary_distribution(db, buckets)
