"""SQLite persistence: one shared WAL database file for the API and the worker."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator

from . import config

_CREATE_JOBS_TABLE = """
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    analysis TEXT NOT NULL,
    status TEXT NOT NULL,
    result TEXT,
    error TEXT,
    created_at TEXT NOT NULL
)
"""


def connect() -> sqlite3.Connection:
    """Open a connection to the shared database in WAL mode."""
    db_path = config.DB_PATH
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    """Create the jobs table if it does not exist yet."""
    conn = connect()
    try:
        conn.execute(_CREATE_JOBS_TABLE)
        conn.commit()
    finally:
        conn.close()


def get_db() -> Iterator[sqlite3.Connection]:
    """FastAPI dependency yielding a database connection per request."""
    conn = connect()
    try:
        yield conn
    finally:
        conn.close()
