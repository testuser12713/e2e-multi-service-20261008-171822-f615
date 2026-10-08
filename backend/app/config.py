"""Runtime configuration, read from the environment with working defaults.

Every value has a non-secret default, so importing this module never fails on a
machine that has no environment configured. The defaults follow the sprint-wide
shared contract; the office runner overrides them through RUN.json.
"""

from __future__ import annotations

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

DB_PATH: Path = Path(os.environ.get("JOB_DB_PATH") or (REPO_ROOT / "data" / "jobs.db"))
API_HOST: str = os.environ.get("API_HOST", "127.0.0.1")
API_PORT: int = int(os.environ.get("API_PORT", "8000"))
FRONTEND_ORIGIN: str = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
