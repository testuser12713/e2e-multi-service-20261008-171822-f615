"""Job routes: create a text job and read jobs back.

Every rejection answers with the shared error body ``{"error": ..., "message": ...}``
using the sprint codes ``invalid_request`` and ``not_found``.
"""

from __future__ import annotations

import sqlite3
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status

from ..db import get_db
from ..schemas import JobCreate, JobOut, JobStatus

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

_SELECT_JOB = "SELECT id, text, analysis, status, result, error, created_at FROM jobs"


def _bad_request(message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={"error": "invalid_request", "message": message},
    )


def _not_found(job_id: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"error": "not_found", "message": f"Job {job_id} was not found."},
    )


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(job: JobCreate, conn: sqlite3.Connection = Depends(get_db)) -> JobOut:
    if not job.text.strip():
        raise _bad_request("The text must not be blank.")

    created_at = datetime.now(UTC).isoformat()
    cursor = conn.execute(
        "INSERT INTO jobs (text, analysis, status, result, error, created_at) "
        "VALUES (?, ?, ?, NULL, NULL, ?)",
        (job.text, job.analysis.value, JobStatus.PENDING.value, created_at),
    )
    conn.commit()

    row = conn.execute(f"{_SELECT_JOB} WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return JobOut.model_validate(dict(row))


@router.get("", response_model=list[JobOut])
def list_jobs(conn: sqlite3.Connection = Depends(get_db)) -> list[JobOut]:
    rows = conn.execute(f"{_SELECT_JOB} ORDER BY id DESC").fetchall()
    return [JobOut.model_validate(dict(row)) for row in rows]


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: int, conn: sqlite3.Connection = Depends(get_db)) -> JobOut:
    row = conn.execute(f"{_SELECT_JOB} WHERE id = ?", (job_id,)).fetchone()
    if row is None:
        raise _not_found(job_id)
    return JobOut.model_validate(dict(row))
