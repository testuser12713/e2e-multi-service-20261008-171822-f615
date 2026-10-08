"""Background worker process.

``main`` opens the shared SQLite database and loops forever: it claims the oldest
pending job atomically, runs the requested analysis, writes the result back and
marks the job ``done``. A job whose analysis raises is marked ``failed`` with the
error message and the loop continues with the next job. The process stops cleanly
on SIGINT/SIGTERM.
"""

from __future__ import annotations

import contextlib
import signal
import sqlite3
import time

from . import analysis
from .db import connect, init_db
from .schemas import AnalysisType, JobOut, JobStatus

POLL_INTERVAL_SECONDS = 1.0

_running = True


def claim_next_job(conn: sqlite3.Connection) -> JobOut | None:
    """Atomically claim the oldest pending job, or return None.

    The claim happens inside one write transaction: the oldest pending row is
    selected, then flipped to ``running`` with ``UPDATE ... WHERE id = ? AND
    status = 'pending'``. The rowcount check decides the winner, so two workers
    racing for the same row cannot both claim it.
    """
    conn.execute("BEGIN IMMEDIATE")
    try:
        row = conn.execute(
            "SELECT * FROM jobs WHERE status = ? ORDER BY id ASC LIMIT 1",
            (JobStatus.PENDING.value,),
        ).fetchone()
        if row is None:
            conn.commit()
            return None
        updated = conn.execute(
            "UPDATE jobs SET status = ? WHERE id = ? AND status = ?",
            (JobStatus.RUNNING.value, row["id"], JobStatus.PENDING.value),
        )
        if updated.rowcount != 1:
            conn.rollback()
            return None
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    return JobOut(
        id=row["id"],
        text=row["text"],
        analysis=row["analysis"],
        status=JobStatus.RUNNING,
        result=row["result"],
        error=row["error"],
        created_at=row["created_at"],
    )


def process_job(conn: sqlite3.Connection, job: JobOut) -> None:
    """Run the analysis for a claimed job and persist status and result."""
    try:
        result = analysis.run_analysis(AnalysisType(job.analysis), job.text)
    except Exception as exc:
        message = str(exc).strip() or exc.__class__.__name__
        conn.execute(
            "UPDATE jobs SET status = ?, error = ? WHERE id = ?",
            (JobStatus.FAILED.value, message, job.id),
        )
    else:
        conn.execute(
            "UPDATE jobs SET status = ?, result = ?, error = NULL WHERE id = ?",
            (JobStatus.DONE.value, result, job.id),
        )
    conn.commit()


def _request_stop(signum: int, frame: object) -> None:
    global _running
    _running = False


def _install_signal_handlers() -> None:
    for name in ("SIGINT", "SIGTERM"):
        sig = getattr(signal, name, None)
        if sig is None:
            continue
        # Not the main thread (e.g. under a test runner) raises ValueError; polling
        # still works, so the worker can be stopped another way.
        with contextlib.suppress(ValueError, OSError):
            signal.signal(sig, _request_stop)


def main() -> None:
    """Run the worker loop until the process is stopped."""
    global _running
    _running = True
    _install_signal_handlers()
    conn = connect()
    try:
        init_db()
        while _running:
            job = claim_next_job(conn)
            if job is None:
                time.sleep(POLL_INTERVAL_SECONDS)
                continue
            process_job(conn, job)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
