import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import type { RowDataPacket } from 'mysql2/promise'
import { getUserByBitsId, type DropUser } from './auth'
import { apiError } from './api'
import { consumeRateLimit, limitInvalidAuth, type ApiLimitKind } from './api-rate-limit'
import { useDb } from './db'
import { recentDays, summarizeTraffic, type TrafficSummary } from './traffic'

export const API_SCOPES = [
  'projects:read',
  'projects:write',
  'deployments:write',
  'projects:delete'
] as const

export type ApiScope = typeof API_SCOPES[number]
export type ApiKeyStatus = 'active' | 'expired' | 'revoked'
export type ApiKeyExpiryPreset = 30 | 90 | 180 | 365 | null

export interface ApiKeyRecord {
  id: string
  name: string
  prefix: string
  scopes: ApiScope[]
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  status: ApiKeyStatus
}

export interface ApiKeyContext {
  key: ApiKeyRecord
  user: DropUser
}

export interface ApiKeyListItem extends ApiKeyRecord {
  traffic: TrafficSummary
}

interface ApiKeyRow extends RowDataPacket {
  id: string
  owner_bits_id: string
  name: string
  prefix: string
  key_hash: string
  scopes: unknown
  created_at: Date
  last_used_at: Date | null
  expires_at: Date | null
  revoked_at: Date | null
}

const API_KEY_RE = /^drop_sk_[A-Za-z0-9_-]{43}$/
const KEY_PREFIX_LENGTH = 16
export const MAX_ACTIVE_KEYS = 100
const EXPIRY_PRESETS: ApiKeyExpiryPreset[] = [30, 90, 180, 365, null]

let pepperWarningShown = false

function apiKeyPepper() {
  const value = process.env.API_KEY_PEPPER || process.env.AUTH_SECRET
  if (!value) {
    throw apiError(500, 'api_key_unconfigured', 'API key auth is not configured', 'API_KEY_PEPPER or AUTH_SECRET must be set.')
  }
  if (!process.env.API_KEY_PEPPER && !pepperWarningShown) {
    pepperWarningShown = true
    console.warn('[api] API_KEY_PEPPER is not set; falling back to AUTH_SECRET.')
  }
  return value
}

export function hashApiKey(token: string) {
  return createHmac('sha256', apiKeyPepper()).update(token).digest('hex')
}

export function generateApiKey() {
  const secret = randomBytes(32).toString('base64url')
  const token = `drop_sk_${secret}`
  return {
    token,
    prefix: token.slice(0, KEY_PREFIX_LENGTH),
    hash: hashApiKey(token)
  }
}

export function normalizeScopes(input: unknown): ApiScope[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw apiError(422, 'validation_failed', 'Validation failed', 'Choose at least one scope.', {
      errors: [{ path: 'scopes', message: 'Choose at least one scope.' }]
    })
  }

  const scopes: ApiScope[] = []
  for (const entry of input) {
    if (typeof entry !== 'string' || !API_SCOPES.includes(entry as ApiScope)) {
      throw apiError(422, 'validation_failed', 'Validation failed', `Unknown scope: ${String(entry)}.`, {
        errors: [{ path: 'scopes', message: 'Unknown scope.' }]
      })
    }
    if (!scopes.includes(entry as ApiScope)) scopes.push(entry as ApiScope)
  }
  return scopes
}

export function normalizeExpiry(input: unknown): ApiKeyExpiryPreset {
  if (input === undefined) return 90
  if (input === null || input === 'never') return null
  const value = Number(input)
  if (!EXPIRY_PRESETS.includes(value as ApiKeyExpiryPreset)) {
    throw apiError(422, 'validation_failed', 'Validation failed', 'Expiry must be one of 30, 90, 180, 365 days, or never.', {
      errors: [{ path: 'expiresInDays', message: 'Choose 30, 90, 180, 365, or never.' }]
    })
  }
  return value as ApiKeyExpiryPreset
}

function parseScopes(value: unknown): ApiScope[] {
  let parsed: unknown = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      parsed = []
    }
  }
  if (!Array.isArray(parsed)) return []
  return parsed.filter((entry): entry is ApiScope =>
    typeof entry === 'string' && API_SCOPES.includes(entry as ApiScope)
  )
}

function iso(value: Date | null) {
  return value ? value.toISOString() : null
}

function keyStatus(row: Pick<ApiKeyRow, 'revoked_at' | 'expires_at'>): ApiKeyStatus {
  if (row.revoked_at) return 'revoked'
  if (row.expires_at && row.expires_at.getTime() <= Date.now()) return 'expired'
  return 'active'
}

function rowToKey(row: ApiKeyRow): ApiKeyRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    prefix: String(row.prefix),
    scopes: parseScopes(row.scopes),
    createdAt: row.created_at.toISOString(),
    lastUsedAt: iso(row.last_used_at),
    expiresAt: iso(row.expires_at),
    revokedAt: iso(row.revoked_at),
    status: keyStatus(row)
  }
}

export async function createApiKey(
  user: DropUser,
  input: { name: string; scopes: unknown; expiresInDays: unknown }
) {
  const name = input.name.trim()
  if (!name || name.length > 60) {
    throw apiError(422, 'validation_failed', 'Validation failed', 'Key name must be 1-60 characters.', {
      errors: [{ path: 'name', message: 'Key name must be 1-60 characters.' }]
    })
  }

  const scopes = normalizeScopes(input.scopes)
  const expiresInDays = normalizeExpiry(input.expiresInDays)

  const [countRows] = await useDb().query<RowDataPacket[]>(
    `SELECT COUNT(*) AS \`count\` FROM \`api_keys\`
     WHERE \`owner_bits_id\` = ? AND \`revoked_at\` IS NULL
       AND (\`expires_at\` IS NULL OR \`expires_at\` > NOW())`,
    [user.bitsId]
  )
  if (Number(countRows[0]?.count ?? 0) >= MAX_ACTIVE_KEYS) {
    throw apiError(409, 'key_limit_reached', 'Key limit reached', `An account can have at most ${MAX_ACTIVE_KEYS} active API keys.`)
  }

  const id = randomUUID()
  const expiresAt = expiresInDays === null
    ? null
    : new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

  for (let attempt = 0; attempt < 5; attempt++) {
    const generated = generateApiKey()
    try {
      await useDb().query(
        `INSERT INTO \`api_keys\`
           (\`id\`, \`owner_bits_id\`, \`name\`, \`prefix\`, \`key_hash\`, \`scopes\`, \`expires_at\`)
         VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), ?)`,
        [id, user.bitsId, name, generated.prefix, generated.hash, JSON.stringify(scopes), expiresAt]
      )

      return {
        key: {
          id,
          name,
          prefix: generated.prefix,
          scopes,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          expiresAt: iso(expiresAt),
          revokedAt: null,
          status: 'active' as const
        },
        token: generated.token
      }
    } catch (err) {
      if ((err as { code?: string })?.code !== 'ER_DUP_ENTRY') throw err
    }
  }

  throw apiError(500, 'key_generation_failed', 'Could not create key', 'Please try again.')
}

export async function listApiKeys(user: DropUser) {
  const [rows] = await useDb().query<ApiKeyRow[]>(
    `SELECT \`id\`, \`owner_bits_id\`, \`name\`, \`prefix\`, \`scopes\`,
            \`created_at\`, \`last_used_at\`, \`expires_at\`, \`revoked_at\`
     FROM \`api_keys\`
     WHERE \`owner_bits_id\` = ? AND \`revoked_at\` IS NULL
     ORDER BY \`created_at\` DESC`,
    [user.bitsId]
  )

  const trafficWindow = await recentDays()
  const [usageRows] = await useDb().query<RowDataPacket[]>(
    `SELECT u.\`api_key_id\`, DATE_FORMAT(u.\`day\`, '%Y-%m-%d') AS \`day\`, u.\`calls\`
     FROM \`api_key_usage\` u
     JOIN \`api_keys\` k ON k.\`id\` = u.\`api_key_id\`
     WHERE k.\`owner_bits_id\` = ? AND u.\`day\` BETWEEN ? AND ?`,
    [user.bitsId, trafficWindow.start, trafficWindow.today]
  )
  const usageByKey = new Map<string, Map<string, number>>()
  for (const row of usageRows) {
    const id = String(row.api_key_id)
    let counts = usageByKey.get(id)
    if (!counts) {
      counts = new Map()
      usageByKey.set(id, counts)
    }
    counts.set(String(row.day), Number(row.calls || 0))
  }

  return rows.map<ApiKeyListItem>(row => ({
    ...rowToKey(row),
    traffic: summarizeTraffic(trafficWindow, usageByKey.get(String(row.id)) || new Map())
  }))
}

export async function revokeApiKey(user: DropUser, id: string) {
  const [result] = await useDb().query<import('mysql2/promise').ResultSetHeader>(
    'UPDATE `api_keys` SET `revoked_at` = NOW() WHERE `id` = ? AND `owner_bits_id` = ? AND `revoked_at` IS NULL',
    [id, user.bitsId]
  )
  if (!result.affectedRows) {
    throw apiError(404, 'not_found', 'Not found', 'API key not found.')
  }
}

export async function authenticateApiKey(event: H3Event): Promise<ApiKeyContext> {
  const header = getRequestHeader(event, 'authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match || !API_KEY_RE.test(match[1])) {
    await limitInvalidAuth(event)
    throw apiError(401, 'unauthenticated', 'Unauthorized', 'Provide a valid API key in the Authorization header.')
  }

  const token = match[1]
  const [rows] = await useDb().query<ApiKeyRow[]>(
    `SELECT \`id\`, \`owner_bits_id\`, \`name\`, \`prefix\`, \`key_hash\`, \`scopes\`,
            \`created_at\`, \`last_used_at\`, \`expires_at\`, \`revoked_at\`
     FROM \`api_keys\` WHERE \`prefix\` = ? LIMIT 1`,
    [token.slice(0, KEY_PREFIX_LENGTH)]
  )
  const row = rows[0]
  if (!row) {
    await limitInvalidAuth(event)
    throw apiError(401, 'unauthenticated', 'Unauthorized', 'API key is invalid.')
  }

  const expected = Buffer.from(row.key_hash, 'hex')
  const actual = Buffer.from(hashApiKey(token), 'hex')
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    await limitInvalidAuth(event)
    throw apiError(401, 'unauthenticated', 'Unauthorized', 'API key is invalid.')
  }
  if (row.revoked_at) {
    throw apiError(401, 'unauthenticated', 'Unauthorized', 'API key has been revoked.')
  }
  if (row.expires_at && row.expires_at.getTime() <= Date.now()) {
    throw apiError(401, 'unauthenticated', 'Unauthorized', 'API key has expired.')
  }

  const user = await getUserByBitsId(row.owner_bits_id)
  if (!user) {
    throw apiError(401, 'unauthenticated', 'Unauthorized', 'The account for this API key no longer exists.')
  }

  await useDb().query(
    `UPDATE \`api_keys\` SET \`last_used_at\` = NOW()
     WHERE \`id\` = ? AND (\`last_used_at\` IS NULL OR \`last_used_at\` < NOW() - INTERVAL 60 SECOND)`,
    [row.id]
  ).catch(err => console.warn('[api] failed to update key last_used_at:', err instanceof Error ? err.message : err))

  await useDb().query(
    `INSERT INTO \`api_key_usage\` (\`api_key_id\`, \`day\`, \`calls\`)
     VALUES (?, CURDATE(), 1)
     ON DUPLICATE KEY UPDATE \`calls\` = \`calls\` + 1`,
    [row.id]
  ).catch(err => console.warn('[api] failed to record key usage:', err instanceof Error ? err.message : err))

  return { key: rowToKey(row), user }
}

export async function requireApi(
  event: H3Event,
  scopes: ApiScope[] = [],
  limitKind: ApiLimitKind = 'read'
): Promise<ApiKeyContext> {
  const context = await authenticateApiKey(event)
  const missing = scopes.filter(scope => !context.key.scopes.includes(scope))
  if (missing.length) {
    throw apiError(403, 'insufficient_scope', 'Insufficient scope', `This key needs: ${missing.join(', ')}.`, {
      extras: { requiredScopes: missing }
    })
  }
  await consumeRateLimit(event, limitKind, context.key.id)
  return context
}
