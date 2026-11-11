import { SignJWT, jwtVerify } from 'jose'
import type { H3Event } from 'h3'
import type { RowDataPacket } from 'mysql2/promise'
import { useDb } from './db'

const SESSION_COOKIE = 'drop_session'
const STATE_COOKIE = 'drop_oauth_state'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7

export interface DropUser {
  bitsId: string
  email: string
  username: string
  nickname: string
  avatarUrl: string
  profile: string
  createdAt: string
  lastLoginAt: string | null
  privacyAcceptedAt: string | null
}

export interface BitsProfile {
  sub: string
  username?: string
  nickname?: string
  avatar_url?: string
  profile?: unknown
  email?: string
}

interface AccountRow extends RowDataPacket {
  bits_id: string
  email: string
  username: string
  nickname: string
  avatar_url: string
  profile: string
  created_at: Date
  last_login_at: Date | null
  privacy_accepted_at: Date | null
}

export function getBitsOAuthConfig() {
  const origin = (process.env.BITS_OAUTH_ORIGIN || 'https://bits.micropue.com.cn').replace(/\/+$/, '')
  const clientId = process.env.BITS_OAUTH_CLIENT_ID || ''
  const clientSecret = process.env.BITS_OAUTH_CLIENT_SECRET || ''
  const redirectUri = process.env.BITS_OAUTH_REDIRECT_URI || ''

  if (!clientId || !clientSecret || !redirectUri) {
    throw createError({ statusCode: 500, statusMessage: 'BITS OAuth is not configured' })
  }

  return { origin, clientId, clientSecret, redirectUri }
}

function sessionSecret() {
  const value = process.env.AUTH_SECRET
  if (!value) throw createError({ statusCode: 500, statusMessage: 'AUTH_SECRET is not configured' })
  return new TextEncoder().encode(value)
}

const secureCookie = () => process.env.NODE_ENV === 'production'

export function setOAuthState(event: H3Event, state: string) {
  setCookie(event, STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookie(),
    path: '/',
    maxAge: 600
  })
}

export function readOAuthState(event: H3Event) {
  return getCookie(event, STATE_COOKIE)
}

export function clearOAuthState(event: H3Event) {
  deleteCookie(event, STATE_COOKIE, { path: '/' })
}

export async function createSession(event: H3Event, bitsId: string) {
  const token = await new SignJWT({ sub: bitsId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(sessionSecret())

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookie(),
    path: '/',
    maxAge: SESSION_MAX_AGE
  })
}

export function clearSession(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })

  // 兼容旧版本：会话 Cookie 曾经写在父域（如 .micropue.com.cn），只清 host-only 清不掉
  const domains = new Set<string>()
  const configured = (process.env.AUTH_COOKIE_DOMAIN || '').trim()
  if (configured) domains.add(configured)

  const host = (getRequestHost(event) || '').split(':')[0].toLowerCase()
  const labels = host.split('.')
  const isIp = /^\d+(?:\.\d+){3}$/.test(host)
  if (!isIp && labels.length >= 3) domains.add(`.${labels.slice(1).join('.')}`)

  for (const domain of domains) {
    deleteCookie(event, SESSION_COOKIE, { path: '/', domain })
  }
}

export async function getSessionUser(event: H3Event): Promise<DropUser | null> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null

  let bitsId = ''
  try {
    const { payload } = await jwtVerify(token, sessionSecret())
    bitsId = typeof payload.sub === 'string' ? payload.sub : ''
  } catch {
    return null
  }
  if (!bitsId) return null

  const [rows] = await useDb().query<AccountRow[]>(
    'SELECT `bits_id`, `email`, `username`, `nickname`, `avatar_url`, `profile`, `created_at`, `last_login_at`, `privacy_accepted_at` FROM `accounts` WHERE `bits_id` = ? LIMIT 1',
    [bitsId]
  )
  const row = rows[0]
  if (!row) return null

  return {
    bitsId: row.bits_id,
    email: row.email,
    username: row.username,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    profile: row.profile,
    createdAt: row.created_at.toISOString(),
    lastLoginAt: row.last_login_at ? row.last_login_at.toISOString() : null,
    privacyAcceptedAt: row.privacy_accepted_at ? row.privacy_accepted_at.toISOString() : null
  }
}

// 账户资料全部来自 BITS；DROP 只做本地映射，不提供用户名/密码修改
export async function upsertAccount(profile: BitsProfile) {
  await useDb().query(
    `INSERT INTO \`accounts\`
       (\`bits_id\`, \`email\`, \`username\`, \`nickname\`, \`avatar_url\`, \`profile\`, \`last_login_at\`)
     VALUES (?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       \`email\` = VALUES(\`email\`),
       \`username\` = VALUES(\`username\`),
       \`nickname\` = VALUES(\`nickname\`),
       \`avatar_url\` = VALUES(\`avatar_url\`),
       \`profile\` = VALUES(\`profile\`),
       \`last_login_at\` = NOW()`,
    [
      profile.sub,
      profile.email ?? '',
      profile.username ?? '',
      profile.nickname ?? '',
      profile.avatar_url ?? '',
      typeof profile.profile === 'string' ? profile.profile : ''
    ]
  )
}
