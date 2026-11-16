import type { H3Event } from 'h3'
import { consumeRateLimit } from './api-rate-limit'
import { requireUser } from './projects'

export async function requireDeveloper(event: H3Event) {
  const user = await requireUser(event)
  if (!user.privacyAcceptedAt) {
    throw createError({ statusCode: 403, statusMessage: 'Accept the privacy policy before creating API keys.' })
  }
  return user
}

export function normalizeHostname(value: string) {
  const raw = value.trim().toLowerCase()
  if (!raw) return ''

  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//.test(raw) ? raw : `http://${raw}`)
    return url.hostname.replace(/\.$/, '')
  } catch {
    return ''
  }
}

export function assertSameOrigin(event: H3Event) {
  const origin = getRequestHeader(event, 'origin')
  if (!origin) return

  let originHost = ''
  try {
    originHost = normalizeHostname(new URL(origin).hostname)
  } catch {
    throw createError({ statusCode: 403, statusMessage: 'Invalid request origin.' })
  }

  const forwardedHost = String(getRequestHeader(event, 'x-forwarded-host') || '').split(',')[0]
  const siteHost = String(useRuntimeConfig(event).public.siteUrl || '')
  const hosts = new Set([
    getRequestHeader(event, 'host') || getRequestHost(event),
    forwardedHost,
    siteHost
  ].map(normalizeHostname).filter(Boolean))

  if (!originHost || !hosts.has(originHost)) {
    throw createError({ statusCode: 403, statusMessage: 'Cross-origin request rejected.' })
  }
}

export async function consumeKeyCreateLimit(event: H3Event, user: { bitsId: string }) {
  try {
    await consumeRateLimit(event, 'key-create', user.bitsId)
  } catch (err) {
    if ((err as { statusCode?: number })?.statusCode === 429) {
      throw createError({ statusCode: 429, statusMessage: 'Too many API keys created. Try again later.' })
    }
    throw err
  }
}
