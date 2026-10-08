"""Pydantic schemas shared by the API and the worker."""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class AnalysisType(StrEnum):
    WORD_COUNT = "word_count"
    TOP_WORDS = "top_words"
    READING_TIME = "reading_time"


class JobStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"


class JobCreate(BaseModel):
    text: str
    analysis: AnalysisType


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    analysis: str
    status: JobStatus
    result: str | None
    error: str | None
    created_at: str
