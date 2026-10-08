"""Tests for the job API: creation, listing and retrieval.

Each test runs against its own temporary SQLite file so no test depends on the
data another one wrote.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.app import config
from backend.app.main import app


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DB_PATH", tmp_path / "jobs.db")
    with TestClient(app) as test_client:
        yield test_client


def _create(client: TestClient, text: str = "hello world", analysis: str = "word_count"):
    return client.post("/api/jobs", json={"text": text, "analysis": analysis})


def test_create_job_returns_201_pending(client):
    response = _create(client, text="hello world", analysis="word_count")

    assert response.status_code == 201
    body = response.json()
    assert isinstance(body["id"], int)
    assert body["text"] == "hello world"
    assert body["analysis"] == "word_count"
    assert body["status"] == "pending"
    assert body["result"] is None
    assert body["error"] is None
    assert body["created_at"]


def test_create_job_is_listed_first_and_retrievable(client):
    created = _create(client, text="the quick brown fox", analysis="word_count").json()

    listing = client.get("/api/jobs")
    assert listing.status_code == 200
    jobs = listing.json()
    assert jobs[0]["id"] == created["id"]

    single = client.get(f"/api/jobs/{created['id']}")
    assert single.status_code == 200
    assert single.json() == created


def test_list_jobs_returns_newest_first(client):
    first = _create(client, text="first job").json()
    second = _create(client, text="second job").json()

    jobs = client.get("/api/jobs").json()
    assert [job["id"] for job in jobs] == [second["id"], first["id"]]


def test_create_job_rejects_empty_text(client):
    response = _create(client, text="")

    assert response.status_code == 400
    body = response.json()
    assert set(body) == {"error", "message"}
    assert body["error"] == "invalid_request"


def test_create_job_rejects_whitespace_only_text(client):
    response = _create(client, text="   \n\t  ")

    assert response.status_code == 400
    body = response.json()
    assert set(body) == {"error", "message"}
    assert body["error"] == "invalid_request"


def test_create_job_rejects_unknown_analysis(client):
    response = _create(client, text="hello", analysis="summarize")

    assert response.status_code == 400
    body = response.json()
    assert set(body) == {"error", "message"}
    assert body["error"] == "invalid_request"


def test_create_job_accepts_every_known_analysis(client):
    for analysis in ("word_count", "top_words", "reading_time"):
        response = _create(client, text="hello world", analysis=analysis)
        assert response.status_code == 201
        assert response.json()["analysis"] == analysis


def test_get_unknown_job_returns_404(client):
    response = client.get("/api/jobs/999999")

    assert response.status_code == 404
    body = response.json()
    assert set(body) == {"error", "message"}
    assert body["error"] == "not_found"
