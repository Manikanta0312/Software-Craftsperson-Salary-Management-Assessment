from datetime import datetime
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, selectinload
from app.models import Employee, SalaryHistory
from app.schemas import EmployeeCreate, EmployeeUpdate


def get_employees(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    country: str | None = None,
    job_title: str | None = None,
    department: str | None = None,
    employment_type: str | None = None,
    is_active: bool | None = True,
    min_salary: float | None = None,
    max_salary: float | None = None,
):
    stmt = select(Employee).options(selectinload(Employee.salary_history))

    if is_active is not None:
        stmt = stmt.where(Employee.is_active == is_active)
    if country:
        stmt = stmt.where(Employee.country == country)
    if job_title:
        stmt = stmt.where(Employee.job_title == job_title)
    if department:
        stmt = stmt.where(Employee.department == department)
    if employment_type:
        stmt = stmt.where(Employee.employment_type == employment_type)
    if min_salary is not None:
        stmt = stmt.where(Employee.salary >= min_salary)
    if max_salary is not None:
        stmt = stmt.where(Employee.salary <= max_salary)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                Employee.full_name.ilike(pattern),
                Employee.job_title.ilike(pattern),
                Employee.email.ilike(pattern),
            )
        )

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    items = db.scalars(
        stmt.order_by(Employee.id).offset((page - 1) * page_size).limit(page_size)
    ).all()

    return total, list(items)


def get_employee(db: Session, employee_id: int) -> Employee | None:
    return db.scalars(
        select(Employee)
        .options(selectinload(Employee.salary_history))
        .where(Employee.id == employee_id)
    ).first()


def create_employee(db: Session, data: EmployeeCreate) -> Employee:
    emp = Employee(**data.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


def update_employee(db: Session, employee_id: int, data: EmployeeUpdate) -> Employee | None:
    emp = get_employee(db, employee_id)
    if not emp:
        return None

    changes = data.model_dump(exclude_unset=True)
    if "salary" in changes and changes["salary"] != emp.salary:
        history = SalaryHistory(
            employee_id=emp.id,
            old_salary=emp.salary,
            new_salary=changes["salary"],
            reason="Manual update via HR tool",
        )
        db.add(history)

    for field, value in changes.items():
        setattr(emp, field, value)

    emp.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(emp)
    return emp


def delete_employee(db: Session, employee_id: int) -> bool:
    emp = get_employee(db, employee_id)
    if not emp:
        return False
    emp.is_active = False
    emp.updated_at = datetime.utcnow()
    db.commit()
    return True
