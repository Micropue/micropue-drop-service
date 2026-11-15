import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import { apiError } from './api'
import type { ApiKeyContext } from './api-keys'
import { useRedis } from './redis'

interface CachedResponse {
  requestHash: string
  status: number
  body: unknown
}

export async function runIdempotent<T>(
  event: H3Event,
  context: ApiKeyContext,
  body: unknown,
  handler: () => Promise<T>
): Promise<T> {
  const idempotencyKey = getRequestHeader(event, 'idempotency-key')
  if (!idempotencyKey) return handler()

  const requestHash = createHash('sha256').update(JSON.stringify(body ?? null)).digest('hex')
  const path = getRequestURL(event).pathname
  const key = `idempotency:${context.user.bitsId}:${context.key.id}:${event.method}:${path}:${idempotencyKey}`
  const lockKey = `${key}:lock`
  const redis = useRedis()

  try {
    const existing = await redis.get(key)
    if (existing) {
      const cached = JSON.parse(existing) as CachedResponse
      if (cached.requestHash !== requestHash) {
        throw apiError(409, 'idempotency_conflict', 'Idempotency conflict', 'This Idempotency-Key was used with a different request body.')
      }
      setResponseStatus(event, cached.status)
      if (cached.status === 204) return undefined as T
      return cached.body as T
    }

    const locked = await redis.set(lockKey, '1', 'EX', 60, 'NX')
    if (!locked) {
      throw apiError(409, 'idempotency_in_progress', 'Request in progress', 'A request with this Idempotency-Key is already running.')
    }

    try {
      const result = await handler()
      const status = getResponseStatus(event) || 200
      await redis.set(
        key,
        JSON.stringify({ requestHash, status, body: result ?? null } satisfies CachedResponse),
        'EX',
        24 * 60 * 60
      )
      return result
    } finally {
      await redis.del(lockKey).catch(() => {})
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'ApiError') throw err
    console.warn('[api] idempotency unavailable:', err instanceof Error ? err.message : err)
    throw apiError(503, 'service_unavailable', 'Idempotency unavailable', 'Retry without Idempotency-Key or try again later.')
  }
}
