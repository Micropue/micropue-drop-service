import type { H3Event } from 'h3'
import {
  clearOAuthState,
  createSession,
  getBitsOAuthConfig,
  readOAuthState,
  upsertAccount,
  type BitsProfile
} from '../../../utils/auth'

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
  refresh_token?: string
}

const fail = (event: H3Event, reason: string) => sendRedirect(event, `/sign?error=${reason}`)

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const code = typeof query.code === 'string' ? query.code : ''
  const state = typeof query.state === 'string' ? query.state : ''
  const expectedState = readOAuthState(event)

  clearOAuthState(event)

  if (query.error) return fail(event, 'denied')
  if (!code || !state || !expectedState || state !== expectedState) return fail(event, 'state')

  const config = getBitsOAuthConfig()

  try {
    const token = await $fetch<TokenResponse>(`${config.origin}/oauth/token`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret
      }).toString()
    })

    if (!token.access_token) throw new Error('missing access_token')

    const profile = await $fetch<BitsProfile>(`${config.origin}/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${token.access_token}` }
    })

    if (!profile.sub) throw new Error('missing userinfo.sub')

    await upsertAccount(profile)
    await createSession(event, profile.sub)

    return sendRedirect(event, '/account')
  } catch (err) {
    console.warn('[bits-oauth] 登录失败：', err instanceof Error ? err.message : err)
    return fail(event, 'oauth')
  }
})
