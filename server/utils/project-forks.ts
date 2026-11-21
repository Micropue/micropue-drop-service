import { randomInt, randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'
import type { RowDataPacket } from 'mysql2/promise'
import { getSessionUser, type DropUser } from './auth'
import { useDb } from './db'
import {
  fileBytes,
  insertDeployment,
  insertFiles,
  projectPath,
  requireUser,
  SLUG_RE,
  type ProjectLanguage,
  type ProjectVisibility
} from './projects'

const SHARE_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const SHARE_CODE_LENGTH = 12
const MAX_PROJECTS = 100
const FORK_SUFFIX = '-fork'
const MAX_SLUG_LENGTH = 40

interface ForkSettingsRow extends RowDataPacket {
  slug: string
  fork_enabled: number
  fork_code: string | null
  username: string
  nickname: string
  avatar_url: string
}

interface ForkInviteRow extends RowDataPacket {
  sid: string
  name: string
  slug: string
  visibility: ProjectVisibility
  folders: unknown
  updated_at: Date
  owner_bits_id: string
  username: string
  nickname: string
  avatar_url: string
}

interface ForkSourceRow extends ForkInviteRow {
  password_hash: string | null
}

interface ForkFileRow extends RowDataPacket {
  name: string
  language: ProjectLanguage
  content: string
}

interface AcceptedForkRow extends RowDataPacket {
  created_at: Date
  forked_sid: string | null
  forked_slug: string | null
}

export interface ForkOwner {
  username: string
  nickname: string
  avatarUrl: string
}

export interface ForkSettings {
  enabled: boolean
  shareCode: string | null
  owner: ForkOwner
  slug: string
  inviteUrl: string | null
}

export interface ForkInvitation {
  name: string
  slug: string
  visibility: ProjectVisibility
  owner: ForkOwner
  sourcePath: string
  fileCount: number
  folderCount: number
  viewer: {
    signedIn: boolean
    isOwner: boolean
    username: string | null
    nickname: string | null
    avatarUrl: string | null
    accepted: {
      acceptedAt: string
      project: {
        sid: string
        slug: string
        path: string
      } | null
    } | null
  }
}

export interface AcceptedFork {
  project: {
    sid: string
    name: string
    slug: string
    visibility: ProjectVisibility
    enabled: boolean
    path: string
    editorPath: string
  }
  source: {
    name: string
    slug: string
    path: string
    owner: ForkOwner
  }
}

function unavailable(): never {
  throw createError({ statusCode: 404, statusMessage: 'Invitation unavailable.' })
}

function normalizeCode(value: unknown) {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return /^[A-Z0-9]{8,16}$/.test(code) ? code : ''
}

function parseFolders(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string')
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed)
        ? parsed.filter((entry): entry is string => typeof entry === 'string')
        : []
    } catch {
      return []
    }
  }
  return []
}

function siteBase(event: H3Event) {
  return String(useRuntimeConfig(event).public.siteUrl || 'https://drop.micropue.com.cn').replace(/\/+$/, '')
}

function forkPath(username: string, slug: string) {
  return `/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`
}

function inviteUrl(event: H3Event, username: string, slug: string, code: string) {
  const query = new URLSearchParams({ code })
  return `${siteBase(event)}/fork${forkPath(username, slug)}?${query.toString()}`
}

function ownerFromRow(row: { username: string; nickname: string; avatar_url: string }): ForkOwner {
  return {
    username: String(row.username),
    nickname: String(row.nickname || ''),
    avatarUrl: String(row.avatar_url || '')
  }
}

function settingsFromRow(event: H3Event, row: ForkSettingsRow): ForkSettings {
  const code = row.fork_code ? String(row.fork_code) : null
  const enabled = Boolean(row.fork_enabled)
  return {
    enabled,
    shareCode: code,
    owner: ownerFromRow(row),
    slug: String(row.slug),
    inviteUrl: enabled && code ? inviteUrl(event, String(row.username), String(row.slug), code) : null
  }
}

export function generateShareCode() {
  let code = ''
  for (let index = 0; index < SHARE_CODE_LENGTH; index++) {
    code += SHARE_CODE_ALPHABET[randomInt(SHARE_CODE_ALPHABET.length)]
  }
  return code
}

export function chooseRequestedForkSlug(requestedSlug: string | undefined, sourceSlug: string, existingSlugs: Iterable<string>) {
  const normalized = (requestedSlug?.trim() || `${sourceSlug}${FORK_SUFFIX}`).toLowerCase()
  if (!SLUG_RE.test(normalized)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Fork name must be 1-40 characters: lowercase letters, numbers and hyphens.'
    })
  }

  const taken = new Set([...existingSlugs].map(slug => slug.toLowerCase()))
  if (!taken.has(normalized)) return normalized

  throw createError({
    statusCode: 409,
    statusMessage: `Fork name "${normalized}" is already taken. Choose another name.`
  })
}

export async function getForkSettingsForOwner(event: H3Event, sid: string) {
  const user = await requireUser(event)
  const [rows] = await useDb().query<ForkSettingsRow[]>(
    `SELECT p.\`slug\`, p.\`fork_enabled\`, p.\`fork_code\`,
            a.\`username\`, a.\`nickname\`, a.\`avatar_url\`
     FROM \`projects\` p
     JOIN \`accounts\` a ON a.\`bits_id\` = p.\`owner_bits_id\`
     WHERE p.\`sid\` = ? AND p.\`owner_bits_id\` = ?
     LIMIT 1`,
    [sid, user.bitsId]
  )
  const row = rows[0]
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Project not found.' })

  return settingsFromRow(event, row)
}

export async function setForkEnabled(event: H3Event, sid: string, enabled: unknown) {
  if (typeof enabled !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Choose on or off.' })
  }

  const user = await requireUser(event)
  const conn = await useDb().getConnection()

  try {
    await conn.beginTransaction()
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT `fork_code` FROM `projects` WHERE `sid` = ? AND `owner_bits_id` = ? LIMIT 1 FOR UPDATE',
      [sid, user.bitsId]
    )
    const row = rows[0]
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Project not found.' })

    let code = row.fork_code ? String(row.fork_code) : null
    if (enabled && !code) {
      let saved = false
      for (let attempt = 0; attempt < 8; attempt++) {
        code = generateShareCode()
        try {
          await conn.query(
            'UPDATE `projects` SET `fork_enabled` = 1, `fork_code` = ? WHERE `sid` = ? AND `owner_bits_id` = ?',
            [code, sid, user.bitsId]
          )
          saved = true
          break
        } catch (err) {
          if ((err as { code?: string }).code !== 'ER_DUP_ENTRY') throw err
        }
      }
      if (!saved) {
        throw createError({ statusCode: 503, statusMessage: 'Could not create a fork code. Please try again.' })
      }
    } else {
      await conn.query(
        'UPDATE `projects` SET `fork_enabled` = ? WHERE `sid` = ? AND `owner_bits_id` = ?',
        [enabled ? 1 : 0, sid, user.bitsId]
      )
    }

    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }

  return getForkSettingsForOwner(event, sid)
}

export async function getForkInvite(event: H3Event, username: string, slug: string, code: unknown) {
  const normalizedCode = normalizeCode(code)
  if (!username || username.length > 254 || !slug || slug.length > MAX_SLUG_LENGTH || !normalizedCode) {
    return unavailable()
  }

  const [rows] = await useDb().query<ForkInviteRow[]>(
    `SELECT p.\`sid\`, p.\`name\`, p.\`slug\`, p.\`visibility\`, p.\`folders\`, p.\`updated_at\`,
            p.\`owner_bits_id\`, a.\`username\`, a.\`nickname\`, a.\`avatar_url\`
     FROM \`projects\` p
     JOIN \`accounts\` a ON a.\`bits_id\` = p.\`owner_bits_id\`
     WHERE a.\`username\` = ? AND p.\`slug\` = ? AND p.\`fork_enabled\` = 1 AND p.\`fork_code\` = ?
     LIMIT 1`,
    [username, slug, normalizedCode]
  )
  const row = rows[0]
  if (!row) return unavailable()

  const viewer = await getSessionUser(event)
  const [fileCountRows] = await useDb().query<RowDataPacket[]>(
    'SELECT COUNT(*) AS `count` FROM `project_files` WHERE `project_sid` = ?',
    [row.sid]
  )

  let accepted: ForkInvitation['viewer']['accepted'] = null
  if (viewer) {
    const [acceptedRows] = await useDb().query<AcceptedForkRow[]>(
      `SELECT pf.\`created_at\`, p.\`sid\` AS \`forked_sid\`, p.\`slug\` AS \`forked_slug\`
       FROM \`project_forks\` pf
       LEFT JOIN \`projects\` p ON p.\`sid\` = pf.\`forked_project_sid\`
       WHERE pf.\`source_project_sid\` = ? AND pf.\`accepted_by_bits_id\` = ?
       LIMIT 1`,
      [row.sid, viewer.bitsId]
    )
    const acceptedRow = acceptedRows[0]
    if (acceptedRow) {
      accepted = {
        acceptedAt: acceptedRow.created_at.toISOString(),
        project: acceptedRow.forked_sid && acceptedRow.forked_slug
          ? {
              sid: String(acceptedRow.forked_sid),
              slug: String(acceptedRow.forked_slug),
              path: forkPath(viewer.username, String(acceptedRow.forked_slug))
            }
          : null
      }
    }
  }

  const folders = parseFolders(row.folders)
  const invitation: ForkInvitation = {
    name: String(row.name),
    slug: String(row.slug),
    visibility: row.visibility,
    owner: ownerFromRow(row),
    sourcePath: forkPath(String(row.username), String(row.slug)),
    fileCount: Number(fileCountRows[0]?.count || 0),
    folderCount: folders.length,
    viewer: {
      signedIn: Boolean(viewer),
      isOwner: viewer?.bitsId === String(row.owner_bits_id),
      username: viewer?.username || null,
      nickname: viewer?.nickname || null,
      avatarUrl: viewer?.avatarUrl || null,
      accepted
    }
  }

  return invitation
}

function duplicateKey(err: unknown) {
  const value = err as { code?: string; sqlMessage?: string; message?: string }
  const message = `${value.sqlMessage || ''} ${value.message || ''}`
  if (value.code !== 'ER_DUP_ENTRY') return ''
  if (message.includes('uk_project_forks_recipient')) return 'recipient'
  if (message.includes('uk_projects_owner_slug')) return 'slug'
  return 'other'
}

export async function acceptFork(event: H3Event, username: string, slug: string, code: unknown, requestedSlug?: unknown) {
  const user = await requireUser(event)
  if (!user.username) {
    throw createError({ statusCode: 409, statusMessage: 'Set a username on BITS before creating a project.' })
  }

  const normalizedCode = normalizeCode(code)
  if (!username || username.length > 254 || !slug || slug.length > MAX_SLUG_LENGTH || !normalizedCode) {
    return unavailable()
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const conn = await useDb().getConnection()
    try {
      await conn.beginTransaction()
      const [sourceRows] = await conn.query<ForkSourceRow[]>(
        `SELECT p.\`sid\`, p.\`name\`, p.\`slug\`, p.\`visibility\`, p.\`folders\`,
                p.\`password_hash\`, p.\`updated_at\`, p.\`owner_bits_id\`,
                a.\`username\`, a.\`nickname\`, a.\`avatar_url\`
         FROM \`projects\` p
         JOIN \`accounts\` a ON a.\`bits_id\` = p.\`owner_bits_id\`
         WHERE a.\`username\` = ? AND p.\`slug\` = ? AND p.\`fork_enabled\` = 1 AND p.\`fork_code\` = ?
         LIMIT 1
         FOR UPDATE`,
        [username, slug, normalizedCode]
      )
      const source = sourceRows[0]
      if (!source) unavailable()
      if (String(source.owner_bits_id) === user.bitsId) {
        throw createError({ statusCode: 403, statusMessage: 'You cannot fork your own project.' })
      }

      const [acceptedRows] = await conn.query<RowDataPacket[]>(
        'SELECT `id` FROM `project_forks` WHERE `source_project_sid` = ? AND `accepted_by_bits_id` = ? LIMIT 1',
        [source.sid, user.bitsId]
      )
      if (acceptedRows.length) {
        throw createError({ statusCode: 409, statusMessage: 'You already accepted this fork invitation.' })
      }

      const [countRows] = await conn.query<RowDataPacket[]>(
        'SELECT COUNT(*) AS `count` FROM `projects` WHERE `owner_bits_id` = ?',
        [user.bitsId]
      )
      if (Number(countRows[0]?.count || 0) >= MAX_PROJECTS) {
        throw createError({ statusCode: 409, statusMessage: 'Project limit reached (100).' })
      }

      const [slugRows] = await conn.query<RowDataPacket[]>(
        'SELECT `slug` FROM `projects` WHERE `owner_bits_id` = ? FOR UPDATE',
        [user.bitsId]
      )
      const targetSlug = chooseRequestedForkSlug(
        typeof requestedSlug === 'string' && requestedSlug.trim() ? requestedSlug : undefined,
        String(source.slug),
        slugRows.map(row => String(row.slug))
      )
      const [fileRows] = await conn.query<ForkFileRow[]>(
        `SELECT \`name\`, \`language\`, \`content\`
         FROM \`project_files\`
         WHERE \`project_sid\` = ?
         ORDER BY \`sort_order\`, \`name\``,
        [source.sid]
      )
      const files = fileRows.map(file => ({
        name: String(file.name),
        language: file.language,
        content: String(file.content)
      }))
      const folders = parseFolders(source.folders)
      const sid = randomUUID()

      await conn.query(
        `INSERT INTO \`projects\`
           (\`sid\`, \`owner_bits_id\`, \`slug\`, \`name\`, \`visibility\`, \`enabled\`, \`revision\`, \`password_hash\`, \`folders\`)
         VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)`,
        [
          sid,
          user.bitsId,
          targetSlug,
          source.name,
          source.visibility,
          source.password_hash,
          JSON.stringify(folders)
        ]
      )
      await insertFiles(conn, sid, files)
      await insertDeployment(conn, {
        projectSid: sid,
        revision: 1,
        source: 'web',
        message: `Forked from @${String(source.username)}/${String(source.slug)}`,
        fileCount: files.length,
        totalBytes: fileBytes(files)
      })
      await conn.query(
        `INSERT INTO \`project_forks\`
           (\`id\`, \`source_project_sid\`, \`forked_project_sid\`, \`source_share_code\`, \`accepted_by_bits_id\`)
         VALUES (?, ?, ?, ?, ?)`,
        [randomUUID(), source.sid, sid, normalizedCode, user.bitsId]
      )

      await conn.commit()
      return {
        project: {
          sid,
          name: String(source.name),
          slug: targetSlug,
          visibility: source.visibility,
          enabled: true,
          path: projectPath(user, targetSlug),
          editorPath: `/new?edit=${encodeURIComponent(sid)}`
        },
        source: {
          name: String(source.name),
          slug: String(source.slug),
          path: forkPath(String(source.username), String(source.slug)),
          owner: ownerFromRow(source)
        }
      } satisfies AcceptedFork
    } catch (err) {
      await conn.rollback()
      const duplicate = duplicateKey(err)
      if (duplicate === 'recipient') {
        throw createError({ statusCode: 409, statusMessage: 'You already accepted this fork invitation.' })
      }
      if (duplicate === 'slug') {
        throw createError({ statusCode: 409, statusMessage: 'That fork name is already taken. Choose another name.' })
      }
      if ((err as { code?: string }).code === 'ER_LOCK_DEADLOCK' && attempt < 2) {
        continue
      }
      throw err
    } finally {
      conn.release()
    }
  }

  throw createError({ statusCode: 503, statusMessage: 'Could not fork this project. Please try again.' })
}
