import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'

const PROBLEM_BASE = 'https://drop.micropue.com.cn/developers/errors/'
const MAX_BODY_BYTES = 2 * 1024 * 1024

export interface ApiValidationIssue {
  path?: string
  message: string
}

export class ApiError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly title: string
  readonly detail: string
  readonly errors?: ApiValidationIssue[]
  readonly extras?: Record<string, unknown>

  constructor(
    statusCode: number,
    code: string,
    title: string,
    detail: string,
    options: { errors?: ApiValidationIssue[]; extras?: Record<string, unknown> } = {}
  ) {
    super(detail)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.title = title
    this.detail = detail
    this.errors = options.errors
    this.extras = options.extras
  }
}

export function apiError(
  statusCode: number,
  code: string,
  title: string,
  detail: string,
  options: { errors?: ApiValidationIssue[]; extras?: Record<string, unknown> } = {}
) {
  return new ApiError(statusCode, code, title, detail, options)
}

export function apiRequestId(event: H3Event) {
  const existing = getRequestHeader(event, 'x-request-id')
  if (existing) return existing
  if (!event.context.apiRequestId) {
    event.context.apiRequestId = `req_${randomUUID().replace(/-/g, '')}`
  }
  return String(event.context.apiRequestId)
}

function problemFromError(event: H3Event, err: unknown) {
  if (err instanceof ApiError) {
    return {
      status: err.statusCode,
      body: {
        type: `${PROBLEM_BASE}${err.code.replace(/_/g, '-')}`,
        title: err.title,
        status: err.statusCode,
        code: err.code,
        detail: err.detail,
        requestId: apiRequestId(event),
        ...(err.errors?.length ? { errors: err.errors } : {}),
        ...(err.extras || {})
      }
    }
  }

  const statusCode = Number((err as { statusCode?: unknown })?.statusCode)
  if (statusCode >= 400 && statusCode < 500) {
    const code = statusCode === 400
      ? 'invalid_request'
      : statusCode === 404
        ? 'not_found'
        : statusCode === 409
          ? 'conflict'
          : statusCode === 413
            ? 'payload_too_large'
            : 'validation_failed'
    const message = String((err as { statusMessage?: unknown })?.statusMessage || 'Request failed.')
    return {
      status: statusCode,
      body: {
        type: `${PROBLEM_BASE}${code.replace(/_/g, '-')}`,
        title: code === 'not_found' ? 'Not found' : 'Request failed',
        status: statusCode,
        code,
        detail: message,
        requestId: apiRequestId(event)
      }
    }
  }

  console.error('[api] unhandled error', err)
  return {
    status: 500,
    body: {
      type: `${PROBLEM_BASE}internal-error`,
      title: 'Internal error',
      status: 500,
      code: 'internal_error',
      detail: 'An unexpected error occurred.',
      requestId: apiRequestId(event)
    }
  }
}

export function sendApiProblem(event: H3Event, err: unknown) {
  const { status, body } = problemFromError(event, err)
  setResponseStatus(event, status)
  setResponseHeader(event, 'content-type', 'application/problem+json; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'no-store')
  setResponseHeader(event, 'x-request-id', apiRequestId(event))
  return body
}

export function defineApiHandler(handler: (event: H3Event) => Promise<unknown> | unknown) {
  return defineEventHandler(async event => {
    const requestId = apiRequestId(event)
    setResponseHeader(event, 'x-request-id', requestId)
    try {
      return await handler(event)
    } catch (err) {
      return sendApiProblem(event, err)
    }
  })
}

export async function readApiBody(event: H3Event): Promise<Record<string, unknown>> {
  const contentLength = Number(getRequestHeader(event, 'content-length') || 0)
  if (contentLength > MAX_BODY_BYTES) {
    throw apiError(413, 'payload_too_large', 'Payload too large', 'Request body must be 2 MB or smaller.')
  }

  let body: unknown
  try {
    body = await readBody(event)
  } catch {
    throw apiError(400, 'invalid_json', 'Invalid JSON', 'Request body must be valid JSON.')
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw apiError(422, 'validation_failed', 'Validation failed', 'Request body must be a JSON object.')
  }

  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) {
    throw apiError(413, 'payload_too_large', 'Payload too large', 'Request body must be 2 MB or smaller.')
  }

  return body as Record<string, unknown>
}

export function assertNoUnknownFields(body: Record<string, unknown>, allowed: readonly string[]) {
  const allowedSet = new Set(allowed)
  const unknown = Object.keys(body).filter(key => !allowedSet.has(key))
  if (unknown.length) {
    throw apiError(422, 'validation_failed', 'Validation failed', `Unknown field: ${unknown[0]}.`, {
      errors: unknown.map(path => ({ path, message: 'Unknown field.' }))
    })
  }
}

export type IfMatchRevision = number | 'any' | null

export function getIfMatchRevision(event: H3Event): IfMatchRevision {
  const raw = getRequestHeader(event, 'if-match')
  if (!raw) return null
  if (raw.trim() === '*') return 'any'

  const match = raw.trim().match(/^"?rev-(\d+)"?$/)
  const revision = match ? Number(match[1]) : NaN
  if (!Number.isInteger(revision) || revision < 1) {
    throw apiError(400, 'invalid_if_match', 'Invalid If-Match', 'If-Match must be an ETag such as "rev-3" or *.')
  }
  return revision
}

export function assertRevision(expected: IfMatchRevision, current: number) {
  if (expected === null || expected === 'any') return
  if (expected !== current) {
    throw apiError(412, 'revision_conflict', 'Revision conflict', 'The project changed since it was read.', {
      extras: { currentRevision: current }
    })
  }
}

export function setRevisionHeaders(event: H3Event, revision: number) {
  setResponseHeader(event, 'etag', `"rev-${revision}"`)
  setResponseHeader(event, 'cache-control', 'no-store')
}

export function parsePageQuery(event: H3Event, defaultPerPage = 20) {
  const query = getQuery(event)
  const page = Math.max(1, Math.floor(Number(query.page) || 1))
  const perPage = Math.min(100, Math.max(1, Math.floor(Number(query.perPage) || defaultPerPage)))
  return { page, perPage }
}
