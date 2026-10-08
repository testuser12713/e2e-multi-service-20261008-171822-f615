"""Tests for the backend skeleton: the app boots, is wired and exposes the
shared contracts. Nothing here asserts the temporary answer of a stub."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.app import analysis, config, db, worker
from backend.app.main import app
from backend.app.schemas import AnalysisType, JobOut, JobStatus


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DB_PATH", tmp_path / "jobs.db")
    with TestClient(app) as test_client:
        yield test_client


def test_health_returns_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_app_imports():
    assert app.title == "Job Processing API"


def test_shared_signatures_exist():
    assert callable(analysis.run_analysis)
    assert callable(worker.claim_next_job)
    assert callable(worker.process_job)
    assert callable(worker.main)
    assert callable(db.connect)
    assert callable(db.init_db)
    assert callable(db.get_db)
    assert config.DB_PATH is not None
    assert isinstance(config.API_PORT, int)
    assert isinstance(config.FRONTEND_ORIGIN, str)


def test_shared_enums_and_schema():
    assert AnalysisType.WORD_COUNT.value == "word_count"
    assert AnalysisType.TOP_WORDS.value == "top_words"
    assert AnalysisType.READING_TIME.value == "reading_time"
    assert JobStatus.PENDING.value == "pending"
    assert set(JobOut.model_fields) == {
        "id",
        "text",
        "analysis",
        "status",
        "result",
        "error",
        "created_at",
    }


def test_jobs_routes_registered():
    paths = app.openapi()["paths"]
    assert "get" in paths["/api/jobs"]
    assert "post" in paths["/api/jobs"]
    assert "get" in paths["/api/jobs/{job_id}"]


def test_jobs_collection_is_reachable(client):
    assert client.get("/api/jobs").status_code != 404


def test_invalid_job_body_uses_shared_error_body(client):
    response = client.post("/api/jobs", json={"text": "hello", "analysis": "unknown"})
    assert response.status_code == 400
    body = response.json()
    assert set(body) == {"error", "message"}
    assert body["error"] == "invalid_request"
