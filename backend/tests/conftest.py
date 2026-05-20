import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

TEST_DB_URL = "sqlite:///./test_salary.db"

test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_employee():
    return {
        "full_name": "Alice Johnson",
        "job_title": "Software Engineer",
        "department": "Engineering",
        "country": "India",
        "salary": 85000.00,
        "currency": "USD",
        "employment_type": "Full-time",
        "hire_date": "2022-03-15",
        "email": "alice@example.com",
    }
