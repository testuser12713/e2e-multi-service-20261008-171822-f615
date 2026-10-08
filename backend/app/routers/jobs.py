"""Job routes.

The route signatures and response models are final; the request handling is
implemented by the job endpoint ticket. Each stub answers 501, never 500, and
uses the shared error body so a mid-sprint build reports it cleanly.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from ..schemas import JobCreate, JobOut

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

_NOT_IMPLEMENTED_CODE = "not_implemented"


def _not_implemented(message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={"error": _NOT_IMPLEMENTED_CODE, "message": message},
    )


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(job: JobCreate) -> JobOut:
    raise _not_implemented("Job creation is not implemented yet.")


@router.get("", response_model=list[JobOut])
def list_jobs() -> list[JobOut]:
    raise _not_implemented("Listing jobs is not implemented yet.")


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: int) -> JobOut:
    raise _not_implemented("Fetching a job is not implemented yet.")
