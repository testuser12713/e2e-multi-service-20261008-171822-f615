/**
 * Shared API client for the job processing backend.
 *
 * Every view of the frontend talks to the backend through these three
 * functions — the request/response contract lives here exactly once.
 */

export const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
).replace(/\/+$/, '')

export type AnalysisType = 'word_count' | 'top_words' | 'reading_time'

export type JobStatus = 'pending' | 'running' | 'done' | 'failed'

export interface Job {
  id: number
  text: string
  analysis: AnalysisType
  status: JobStatus
  result: string | null
  error: string | null
  created_at: string
}

/** Error body the backend returns for every non-2xx response. */
interface ErrorBody {
  error?: string
  message?: string
}

/** Thrown by every client call that does not get a 2xx response. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    // Network/connection failure — the backend is not reachable at all.
    throw new ApiError(0, 'network_error', 'API not reachable')
  }

  if (!response.ok) {
    let body: ErrorBody = {}
    try {
      body = (await response.json()) as ErrorBody
    } catch {
      body = {}
    }
    throw new ApiError(
      response.status,
      body.error ?? 'http_error',
      body.message ?? `Request failed with status ${response.status}`,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

/** Create a new analysis job. Resolves with the stored job (201). */
export function createJob(text: string, analysis: AnalysisType): Promise<Job> {
  return request<Job>('/api/jobs', {
    method: 'POST',
    body: JSON.stringify({ text, analysis }),
  })
}

/** List all jobs, newest first (200). */
export function fetchJobs(): Promise<Job[]> {
  return request<Job[]>('/api/jobs')
}

/** Fetch a single job by id; rejects with a 404 ApiError when unknown. */
export function fetchJob(id: number): Promise<Job> {
  return request<Job>(`/api/jobs/${id}`)
}
