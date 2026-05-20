from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, EmailStr, field_validator


class EmployeeBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=200)
    job_title: str = Field(..., min_length=2, max_length=100)
    department: str = Field(..., min_length=2, max_length=100)
    country: str = Field(..., min_length=2, max_length=100)
    salary: float = Field(..., gt=0)
    currency: str = Field(default="USD", max_length=10)
    employment_type: str = Field(default="Full-time")
    hire_date: date
    email: Optional[str] = None

    @field_validator("employment_type")
    @classmethod
    def validate_employment_type(cls, v: str) -> str:
        allowed = {"Full-time", "Part-time", "Contract", "Internship"}
        if v not in allowed:
            raise ValueError(f"employment_type must be one of {allowed}")
        return v

    @field_validator("salary")
    @classmethod
    def validate_salary(cls, v: float) -> float:
        if v > 10_000_000:
            raise ValueError("Salary seems unreasonably high")
        return round(v, 2)


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=200)
    job_title: Optional[str] = Field(None, min_length=2, max_length=100)
    department: Optional[str] = Field(None, min_length=2, max_length=100)
    country: Optional[str] = Field(None, min_length=2, max_length=100)
    salary: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = None
    employment_type: Optional[str] = None
    hire_date: Optional[date] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class SalaryHistoryOut(BaseModel):
    id: int
    old_salary: float
    new_salary: float
    changed_at: datetime
    reason: Optional[str]

    model_config = {"from_attributes": True}


class EmployeeOut(EmployeeBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    salary_history: list[SalaryHistoryOut] = []

    model_config = {"from_attributes": True}


class PaginatedEmployees(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[EmployeeOut]


# Analytics schemas
class CountrySalaryStats(BaseModel):
    country: str
    min_salary: float
    max_salary: float
    avg_salary: float
    median_salary: float
    headcount: int


class JobTitleSalaryStats(BaseModel):
    job_title: str
    country: Optional[str]
    avg_salary: float
    min_salary: float
    max_salary: float
    headcount: int


class SalaryBucket(BaseModel):
    range_label: str
    count: int
    min_val: float
    max_val: float


class AnalyticsSummary(BaseModel):
    total_employees: int
    active_employees: int
    global_min_salary: float
    global_max_salary: float
    global_avg_salary: float
    total_payroll: float
    countries_count: int
    job_titles_count: int


class TopEarner(BaseModel):
    id: int
    full_name: str
    job_title: str
    department: str
    country: str
    salary: float
