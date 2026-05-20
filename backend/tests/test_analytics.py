"""
Tests for analytics / salary insights endpoints.
"""
import pytest
from fastapi.testclient import TestClient


def seed_employees(client, employees):
    for emp in employees:
        client.post("/api/employees", json=emp)


BASE = {
    "job_title": "Engineer",
    "department": "Engineering",
    "currency": "USD",
    "employment_type": "Full-time",
    "hire_date": "2022-01-01",
}


class TestAnalyticsSummary:
    def test_returns_correct_totals(self, client):
        seed_employees(client, [
            {**BASE, "full_name": "A A", "country": "India", "salary": 50000},
            {**BASE, "full_name": "B B", "country": "US", "salary": 100000},
            {**BASE, "full_name": "C C", "country": "India", "salary": 75000},
        ])
        resp = client.get("/api/analytics/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_employees"] == 3
        assert data["global_min_salary"] == 50000
        assert data["global_max_salary"] == 100000
        assert abs(data["global_avg_salary"] - 75000) < 1
        assert data["countries_count"] == 2

    def test_returns_zeros_for_empty_db(self, client):
        resp = client.get("/api/analytics/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_employees"] == 0


class TestCountryStats:
    def test_returns_stats_for_each_country(self, client):
        seed_employees(client, [
            {**BASE, "full_name": "A A", "country": "India", "salary": 40000},
            {**BASE, "full_name": "B B", "country": "India", "salary": 80000},
            {**BASE, "full_name": "C C", "country": "US",    "salary": 120000},
        ])
        resp = client.get("/api/analytics/by-country")
        assert resp.status_code == 200
        stats = {s["country"]: s for s in resp.json()}
        assert "India" in stats
        assert stats["India"]["min_salary"] == 40000
        assert stats["India"]["max_salary"] == 80000
        assert abs(stats["India"]["avg_salary"] - 60000) < 1
        assert stats["India"]["headcount"] == 2

    def test_specific_country_endpoint(self, client):
        seed_employees(client, [
            {**BASE, "full_name": "A A", "country": "Germany", "salary": 90000},
        ])
        resp = client.get("/api/analytics/by-country/Germany")
        assert resp.status_code == 200
        assert resp.json()["country"] == "Germany"

    def test_returns_404_for_unknown_country(self, client):
        resp = client.get("/api/analytics/by-country/Atlantis")
        assert resp.status_code == 404


class TestJobTitleStats:
    def test_returns_avg_salary_per_job_title(self, client):
        seed_employees(client, [
            {**BASE, "full_name": "A A", "country": "India", "job_title": "Engineer", "salary": 60000},
            {**BASE, "full_name": "B B", "country": "India", "job_title": "Engineer", "salary": 80000},
            {**BASE, "full_name": "C C", "country": "India", "job_title": "Manager",  "salary": 120000},
        ])
        resp = client.get("/api/analytics/by-job-title?country=India")
        assert resp.status_code == 200
        rows = {r["job_title"]: r for r in resp.json()}
        assert abs(rows["Engineer"]["avg_salary"] - 70000) < 1
        assert rows["Manager"]["avg_salary"] == 120000

    def test_filters_by_country(self, client):
        seed_employees(client, [
            {**BASE, "full_name": "A A", "country": "India", "job_title": "Engineer", "salary": 60000},
            {**BASE, "full_name": "B B", "country": "US",    "job_title": "Engineer", "salary": 110000},
        ])
        resp = client.get("/api/analytics/by-job-title?country=India")
        rows = resp.json()
        assert all(r["country"] == "India" for r in rows)


class TestTopEarners:
    def test_returns_top_n_by_salary(self, client):
        seed_employees(client, [
            {**BASE, "full_name": f"Person {i}", "country": "India", "salary": i * 10000}
            for i in range(1, 6)
        ])
        resp = client.get("/api/analytics/top-earners?limit=3")
        assert resp.status_code == 200
        earners = resp.json()
        assert len(earners) == 3
        assert earners[0]["salary"] > earners[1]["salary"]


class TestSalaryDistribution:
    def test_returns_buckets(self, client):
        seed_employees(client, [
            {**BASE, "full_name": f"P{i}", "country": "India", "salary": 30000 + i * 5000}
            for i in range(10)
        ])
        resp = client.get("/api/analytics/salary-distribution?buckets=5")
        assert resp.status_code == 200
        buckets = resp.json()
        assert len(buckets) == 5
        assert sum(b["count"] for b in buckets) == 10
