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

export function assertSameOrigin(event: H3Event) {
  const origin = getRequestHeader(event, 'origin')
  if (!origin) return

  const host = getRequestHeader(event, 'host') || getRequestHost(event)
  let originHost = ''
  try {
    originHost = new URL(origin).host
  } catch {
    throw createError({ statusCode: 403, statusMessage: 'Invalid request origin.' })
  }

  if (!host || originHost !== host) {
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
