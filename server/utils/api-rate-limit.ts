import type { H3Event } from 'h3'
import { apiError } from './api'
import { useRedis } from './redis'

export type ApiLimitKind = 'read' | 'write' | 'deploy' | 'auth' | 'key-create'

const LIMITS: Record<ApiLimitKind, { limit: number; windowSeconds: number }> = {
  read: { limit: 300, windowSeconds: 60 },
  write: { limit: 60, windowSeconds: 60 },
  deploy: { limit: 20, windowSeconds: 60 },
  auth: { limit: 30, windowSeconds: 60 },
  'key-create': { limit: 10, windowSeconds: 3600 }
}

export async function consumeRateLimit(
  event: H3Event,
  kind: ApiLimitKind,
  identity: string
) {
  const { limit, windowSeconds } = LIMITS[kind]
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds)
  const key = `ratelimit:${kind}:${identity}:${bucket}`

  try {
    const redis = useRedis()
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, windowSeconds + 1)
    const ttl = Math.max(1, await redis.ttl(key))

    setResponseHeader(event, 'ratelimit-limit', String(limit))
    setResponseHeader(event, 'ratelimit-remaining', String(Math.max(0, limit - count)))
    setResponseHeader(event, 'ratelimit-reset', String(ttl))

    if (count > limit) {
      setResponseHeader(event, 'retry-after', String(ttl))
      throw apiError(429, 'rate_limited', 'Rate limit exceeded', `Try again in ${ttl} seconds.`, {
        extras: { retryAfter: ttl }
      })
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'ApiError') throw err
    // Redis 故障时不要阻断部署；限流降级为放行并告警。
    console.warn('[api] rate limit unavailable:', err instanceof Error ? err.message : err)
  }
}

export async function limitInvalidAuth(event: H3Event) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  try {
    await consumeRateLimit(event, 'auth', ip)
  } catch (err) {
    if (err instanceof Error && err.name === 'ApiError') throw err
  }
}
