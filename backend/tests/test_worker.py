"""Tests for the background worker: atomic claiming and job processing.

Everything runs against a real temporary SQLite file (never a committed database)
so the tests exercise the same connection and schema path as the running product.
"""

from __future__ import annotations

import signal
import sqlite3

import pytest

from backend.app import config, db, worker
from backend.app.schemas import JobOut, JobStatus

SAMPLE_TEXT = "the quick brown fox jumps over the lazy dog"
CREATED_AT = "2026-01-01T00:00:00Z"


@pytest.fixture()
def conn(tmp_path, monkeypatch):
    """A connection to a fresh temporary database with the jobs table created."""
    monkeypatch.setattr(config, "DB_PATH", tmp_path / "jobs.db")
    db.init_db()
    connection = db.connect()
    yield connection
    connection.close()


def _insert_job(connection: sqlite3.Connection, analysis_name: str = "word_count") -> int:
    cursor = connection.execute(
        "INSERT INTO jobs (text, analysis, status, result, error, created_at) "
        "VALUES (?, ?, ?, NULL, NULL, ?)",
        (SAMPLE_TEXT, analysis_name, JobStatus.PENDING.value, CREATED_AT),
    )
    connection.commit()
    return int(cursor.lastrowid)


def _fetch(connection: sqlite3.Connection, job_id: int) -> sqlite3.Row:
    return connection.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()


def test_claim_returns_none_when_no_jobs(conn):
    assert worker.claim_next_job(conn) is None


def test_pending_job_moves_to_running_then_done(conn, monkeypatch):
    job_id = _insert_job(conn)
    monkeypatch.setattr(worker.analysis, "run_analysis", lambda analysis_type, text: "9 words")

    claimed = worker.claim_next_job(conn)
    assert claimed is not None
    assert isinstance(claimed, JobOut)
    assert claimed.id == job_id
    assert claimed.status == JobStatus.RUNNING
    assert _fetch(conn, job_id)["status"] == "running"

    worker.process_job(conn, claimed)

    row = _fetch(conn, job_id)
    assert row["status"] == "done"
    assert row["result"] == "9 words"
    assert row["error"] is None


def test_claim_picks_oldest_pending_job_first(conn, monkeypatch):
    first = _insert_job(conn)
    _insert_job(conn)
    monkeypatch.setattr(worker.analysis, "run_analysis", lambda analysis_type, text: "ok")

    claimed = worker.claim_next_job(conn)
    assert claimed is not None
    assert claimed.id == first


def test_failing_analysis_marks_job_failed_and_worker_continues(conn, monkeypatch):
    failing_id = _insert_job(conn)
    next_id = _insert_job(conn)

    def boom(analysis_type, text):
        raise RuntimeError("analysis exploded")

    monkeypatch.setattr(worker.analysis, "run_analysis", boom)

    claimed = worker.claim_next_job(conn)
    assert claimed is not None
    assert claimed.id == failing_id
    worker.process_job(conn, claimed)

    row = _fetch(conn, failing_id)
    assert row["status"] == "failed"
    assert row["result"] is None
    assert "analysis exploded" in row["error"]

    # The worker is still alive: the next pending job can be claimed.
    following = worker.claim_next_job(conn)
    assert following is not None
    assert following.id == next_id


def test_second_worker_does_not_claim_an_already_claimed_job(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DB_PATH", tmp_path / "jobs.db")
    db.init_db()
    first_worker = db.connect()
    second_worker = db.connect()
    try:
        job_id = _insert_job(first_worker)

        claimed = worker.claim_next_job(first_worker)
        assert claimed is not None
        assert claimed.id == job_id

        # A second worker instance sees the job as running and claims nothing.
        assert worker.claim_next_job(second_worker) is None
    finally:
        first_worker.close()
        second_worker.close()


def test_main_stops_cleanly_when_a_stop_signal_arrives(conn, monkeypatch):
    monkeypatch.setattr(worker.time, "sleep", lambda seconds: None)
    monkeypatch.setattr(worker, "connect", lambda: conn)

    def claim_then_stop(connection):
        worker._request_stop(signal.SIGINT, None)
        return None

    monkeypatch.setattr(worker, "claim_next_job", claim_then_stop)

    worker.main()  # Returns only if the loop honours the stop flag.
