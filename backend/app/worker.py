"""Background worker process.

The claiming and processing logic is implemented by the worker ticket. The
process itself is already runnable: ``main`` opens the shared database and loops
forever, sleeping while there is nothing to claim, so the documented worker
command starts and keeps running.
"""

from __future__ import annotations

import sqlite3
import time

from .db import connect, init_db
from .schemas import JobOut

POLL_INTERVAL_SECONDS = 1.0


def claim_next_job(conn: sqlite3.Connection) -> JobOut | None:
    """Atomically claim the oldest pending job, or return None."""
    return None


def process_job(conn: sqlite3.Connection, job: JobOut) -> None:
    """Run the analysis for a claimed job and persist status and result."""
    return None


def main() -> None:
    """Run the worker loop until the process is stopped."""
    conn = connect()
    try:
        init_db()
        while True:
            job = claim_next_job(conn)
            if job is None:
                time.sleep(POLL_INTERVAL_SECONDS)
                continue
            process_job(conn, job)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
