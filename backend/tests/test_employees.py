"""
Tests for Employee CRUD endpoints.
Red → Green → Refactor via TDD.
"""
import pytest
from fastapi.testclient import TestClient


class TestCreateEmployee:
    def test_creates_employee_with_valid_data(self, client, sample_employee):
        resp = client.post("/api/employees", json=sample_employee)
        assert resp.status_code == 201
        body = resp.json()
        assert body["full_name"] == "Alice Johnson"
        assert body["salary"] == 85000.00
        assert body["is_active"] is True
        assert "id" in body

    def test_rejects_missing_required_fields(self, client):
        resp = client.post("/api/employees", json={"full_name": "Bob"})
        assert resp.status_code == 422

    def test_rejects_negative_salary(self, client, sample_employee):
        sample_employee["salary"] = -5000
        resp = client.post("/api/employees", json=sample_employee)
        assert resp.status_code == 422

    def test_rejects_invalid_employment_type(self, client, sample_employee):
        sample_employee["employment_type"] = "Freelance"
        resp = client.post("/api/employees", json=sample_employee)
        assert resp.status_code == 422


class TestGetEmployee:
    def test_retrieves_existing_employee(self, client, sample_employee):
        created = client.post("/api/employees", json=sample_employee).json()
        resp = client.get(f"/api/employees/{created['id']}")
        assert resp.status_code == 200
        assert resp.json()["full_name"] == "Alice Johnson"

    def test_returns_404_for_missing_employee(self, client):
        resp = client.get("/api/employees/99999")
        assert resp.status_code == 404


class TestListEmployees:
    def test_returns_paginated_list(self, client, sample_employee):
        client.post("/api/employees", json=sample_employee)
        resp = client.get("/api/employees?page=1&page_size=10")
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] >= 1
        assert isinstance(body["items"], list)

    def test_filters_by_country(self, client, sample_employee):
        client.post("/api/employees", json=sample_employee)
        other = {**sample_employee, "full_name": "Bob Smith", "country": "US"}
        client.post("/api/employees", json=other)

        resp = client.get("/api/employees?country=India")
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert all(e["country"] == "India" for e in items)

    def test_filters_by_job_title(self, client, sample_employee):
        client.post("/api/employees", json=sample_employee)
        manager = {**sample_employee, "full_name": "Carol Lee", "job_title": "Manager"}
        client.post("/api/employees", json=manager)

        resp = client.get("/api/employees?job_title=Software+Engineer")
        items = resp.json()["items"]
        assert all(e["job_title"] == "Software Engineer" for e in items)

    def test_searches_by_name(self, client, sample_employee):
        client.post("/api/employees", json=sample_employee)
        resp = client.get("/api/employees?search=Alice")
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    def test_filters_by_salary_range(self, client, sample_employee):
        client.post("/api/employees", json=sample_employee)
        low = {**sample_employee, "full_name": "Dan Fox", "salary": 30000}
        client.post("/api/employees", json=low)

        resp = client.get("/api/employees?min_salary=80000&max_salary=90000")
        items = resp.json()["items"]
        assert all(80000 <= e["salary"] <= 90000 for e in items)

    def test_pagination_returns_correct_page(self, client, sample_employee):
        for i in range(5):
            client.post("/api/employees", json={**sample_employee, "full_name": f"Person {i}"})
        resp = client.get("/api/employees?page=1&page_size=2")
        body = resp.json()
        assert body["total"] == 5
        assert len(body["items"]) == 2


class TestUpdateEmployee:
    def test_updates_salary_and_creates_history(self, client, sample_employee):
        emp = client.post("/api/employees", json=sample_employee).json()
        resp = client.put(f"/api/employees/{emp['id']}", json={"salary": 95000})
        assert resp.status_code == 200
        body = resp.json()
        assert body["salary"] == 95000
        assert len(body["salary_history"]) == 1
        assert body["salary_history"][0]["old_salary"] == 85000

    def test_updates_job_title(self, client, sample_employee):
        emp = client.post("/api/employees", json=sample_employee).json()
        resp = client.put(f"/api/employees/{emp['id']}", json={"job_title": "Senior Engineer"})
        assert resp.status_code == 200
        assert resp.json()["job_title"] == "Senior Engineer"

    def test_returns_404_for_missing_employee(self, client):
        resp = client.put("/api/employees/99999", json={"salary": 50000})
        assert resp.status_code == 404


class TestDeleteEmployee:
    def test_soft_deletes_employee(self, client, sample_employee):
        emp = client.post("/api/employees", json=sample_employee).json()
        resp = client.delete(f"/api/employees/{emp['id']}")
        assert resp.status_code == 204

        # Verify soft delete: not in active list
        list_resp = client.get("/api/employees")
        ids = [e["id"] for e in list_resp.json()["items"]]
        assert emp["id"] not in ids

    def test_returns_404_for_missing_employee(self, client):
        resp = client.delete("/api/employees/99999")
        assert resp.status_code == 404
