import type { H3Event } from 'h3'
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { DropUser } from './auth'
import {
  apiError,
  assertNoUnknownFields,
  assertRevision,
  getIfMatchRevision,
  setRevisionHeaders,
  type IfMatchRevision
} from './api'
import {
  fileBytes,
  hashPassword,
  insertDeployment,
  insertFiles,
  MAX_FILES,
  parseProjectInput,
  projectPath,
  SLUG_RE,
  type ProjectFileInput,
  type ProjectLanguage,
  type ProjectMutationOptions
} from './projects'
import { useDb } from './db'
import { createProjectForUser } from './projects'
import { validateFilePath } from '../../shared/project-paths'

const CONTENT_BASE = (process.env.NUXT_PUBLIC_CONTENT_URL || 'https://dropcontent.micropue.com.cn').replace(/\/+$/, '')
const MAX_MESSAGE = 200

interface ApiProjectRow extends RowDataPacket {
  sid: string
  name: string
  slug: string
  visibility: 'public' | 'password'
  enabled: number
  revision: number
  password_hash: string | null
  folders: unknown
  created_at: Date | string
  updated_at: Date | string
}

interface ApiFileRow extends RowDataPacket {
  name: string
  language: ProjectLanguage
  content: string
}

interface DeploymentRow extends RowDataPacket {
  id: string
  revision: number
  source: 'web' | 'api'
  message: string | null
  file_count: number
  total_bytes: number
  status: 'live'
  created_at: Date | string
}

function iso(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null
}

function parseFolders(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === 'string')
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : []
    } catch {
      return []
    }
  }
  return []
}

export function projectUrl(user: DropUser, slug: string) {
  return `${CONTENT_BASE}${projectPath(user, slug)}/`
}

function filePath(value: unknown, index: number) {
  if (typeof value !== 'string' || !value.trim()) {
    throw apiError(422, 'validation_failed', 'Validation failed', `files[${index}].path is required.`, {
      errors: [{ path: `files[${index}].path`, message: 'Path is required.' }]
    })
  }
  return value.trim()
}

function mapApiFiles(value: unknown): ProjectFileInput[] {
  if (!Array.isArray(value)) {
    throw apiError(422, 'validation_failed', 'Validation failed', 'files must be an array.', {
      errors: [{ path: 'files', message: 'files must be an array.' }]
    })
  }
  if (value.length < 1 || value.length > MAX_FILES) {
    throw apiError(422, 'validation_failed', 'Validation failed', `files must contain 1-${MAX_FILES} items.`, {
      errors: [{ path: 'files', message: `Use 1-${MAX_FILES} files.` }]
    })
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw apiError(422, 'validation_failed', 'Validation failed', `files[${index}] must be an object.`)
    }
    const file = entry as Record<string, unknown>
    assertNoUnknownFields(file, ['path', 'content'])
    const path = filePath(file.path, index)
    const validation = validateFilePath(path)
    if (!validation.ok) {
      throw apiError(422, 'validation_failed', 'Validation failed', validation.message, {
        errors: [{ path: `files[${index}].path`, message: validation.message }]
      })
    }
    if (typeof file.content !== 'string') {
      throw apiError(422, 'validation_failed', 'Validation failed', `files[${index}].content must be a string.`, {
        errors: [{ path: `files[${index}].content`, message: 'Content must be a string.' }]
      })
    }
    return {
      name: path,
      language: validation.language!,
      content: file.content
    }
  })
}

function projectParserErrors(err: unknown) {
  const raw = (err as { data?: { errors?: unknown } })?.data?.errors
  if (!Array.isArray(raw)) return undefined
  const errors = raw.flatMap(issue => {
    if (!issue || typeof issue !== 'object') return []
    const value = issue as { path?: unknown; message?: unknown }
    if (typeof value.message !== 'string' || !value.message) return []
    return [{
      ...(typeof value.path === 'string' && value.path ? { path: value.path } : {}),
      message: value.message
    }]
  })
  return errors.length ? errors : undefined
}

function validateWithProjectParser(input: Record<string, unknown>) {
  try {
    return parseProjectInput(input)
  } catch (err) {
    if ((err as { statusCode?: number })?.statusCode === 400) {
      const detail = String((err as { statusMessage?: unknown })?.statusMessage || (err as Error).message || 'Invalid project data.')
      throw apiError(422, 'validation_failed', 'Validation failed', detail, {
        errors: projectParserErrors(err)
      })
    }
    throw err
  }
}

function parseMessage(value: unknown) {
  if (value === undefined) return null
  if (typeof value !== 'string' || value.length > MAX_MESSAGE) {
    throw apiError(422, 'validation_failed', 'Validation failed', `message must be ${MAX_MESSAGE} characters or fewer.`, {
      errors: [{ path: 'message', message: `Use at most ${MAX_MESSAGE} characters.` }]
    })
  }
  return value.trim() || null
}

export function parseApiCreateBody(body: Record<string, unknown>) {
  assertNoUnknownFields(body, ['name', 'slug', 'visibility', 'password', 'enabled', 'folders', 'files', 'message'])

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name || [...name].length > 80) {
    throw apiError(422, 'validation_failed', 'Validation failed', 'name must be 1-80 characters.', {
      errors: [{ path: 'name', message: 'Use 1-80 characters.' }]
    })
  }
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : ''
  if (!SLUG_RE.test(slug)) {
    throw apiError(422, 'validation_failed', 'Validation failed', 'slug must be 1-40 lowercase letters, numbers or hyphens.', {
      errors: [{ path: 'slug', message: 'Invalid slug.' }]
    })
  }
  if (body.visibility !== 'public' && body.visibility !== 'password') {
    throw apiError(422, 'validation_failed', 'Validation failed', 'visibility must be public or password.', {
      errors: [{ path: 'visibility', message: 'Choose public or password.' }]
    })
  }
  if (typeof body.password !== 'undefined' && typeof body.password !== 'string') {
    throw apiError(422, 'validation_failed', 'Validation failed', 'password must be a string.', {
      errors: [{ path: 'password', message: 'Password must be a string.' }]
    })
  }
  if (body.visibility === 'password' && !body.password) {
    throw apiError(422, 'password_required', 'Password required', 'A password is required for a password-protected project.', {
      errors: [{ path: 'password', message: 'Password is required.' }]
    })
  }
  if (body.enabled !== undefined && typeof body.enabled !== 'boolean') {
    throw apiError(422, 'validation_failed', 'Validation failed', 'enabled must be a boolean.', {
      errors: [{ path: 'enabled', message: 'enabled must be a boolean.' }]
    })
  }

  const input = validateWithProjectParser({
    name,
    slug,
    visibility: body.visibility,
    password: body.password,
    folders: body.folders,
    files: mapApiFiles(body.files)
  })

  return {
    input,
    enabled: body.enabled === undefined ? true : body.enabled,
    message: parseMessage(body.message)
  }
}

export function parseApiDeployBody(body: Record<string, unknown>) {
  assertNoUnknownFields(body, ['files', 'folders', 'message'])
  const input = validateWithProjectParser({
    name: 'Deploy',
    slug: 'deploy',
    visibility: 'public',
    folders: body.folders,
    files: mapApiFiles(body.files)
  })
  return {
    files: input.files,
    folders: input.folders,
    message: parseMessage(body.message)
  }
}

export function parseApiPatchBody(body: Record<string, unknown>) {
  assertNoUnknownFields(body, ['name', 'slug', 'visibility', 'password', 'enabled'])
  if (Object.keys(body).length === 0) {
    throw apiError(422, 'validation_failed', 'Validation failed', 'Provide at least one field to update.')
  }

  const patch: {
    name?: string
    slug?: string
    visibility?: 'public' | 'password'
    password?: string
    enabled?: boolean
  } = {}

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim() || [...body.name.trim()].length > 80) {
      throw apiError(422, 'validation_failed', 'Validation failed', 'name must be 1-80 characters.', {
        errors: [{ path: 'name', message: 'Use 1-80 characters.' }]
      })
    }
    patch.name = body.name.trim()
  }
  if (body.slug !== undefined) {
    if (typeof body.slug !== 'string' || !SLUG_RE.test(body.slug.trim().toLowerCase())) {
      throw apiError(422, 'validation_failed', 'Validation failed', 'slug must be 1-40 lowercase letters, numbers or hyphens.', {
        errors: [{ path: 'slug', message: 'Invalid slug.' }]
      })
    }
    patch.slug = body.slug.trim().toLowerCase()
  }
  if (body.visibility !== undefined) {
    if (body.visibility !== 'public' && body.visibility !== 'password') {
      throw apiError(422, 'validation_failed', 'Validation failed', 'visibility must be public or password.', {
        errors: [{ path: 'visibility', message: 'Choose public or password.' }]
      })
    }
    patch.visibility = body.visibility
  }
  if (body.password !== undefined) {
    if (typeof body.password !== 'string' || body.password.length < 6 || body.password.length > 128) {
      throw apiError(422, 'validation_failed', 'Validation failed', 'password must be 6-128 characters.', {
        errors: [{ path: 'password', message: 'Use 6-128 characters.' }]
      })
    }
    patch.password = body.password
  }
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== 'boolean') {
      throw apiError(422, 'validation_failed', 'Validation failed', 'enabled must be a boolean.', {
        errors: [{ path: 'enabled', message: 'enabled must be a boolean.' }]
      })
    }
    patch.enabled = body.enabled
  }

  return patch
}

export function toApiProject(
  user: DropUser,
  row: ApiProjectRow,
  files: ApiFileRow[],
  lastDeployedAt: string | null
) {
  const languageFiles = files.map(file => ({
    path: String(file.name),
    language: file.language as ProjectLanguage,
    bytes: Buffer.byteLength(String(file.content), 'utf8'),
    content: String(file.content)
  }))

  return {
    id: String(row.sid),
    name: String(row.name),
    slug: String(row.slug),
    path: `${projectPath(user, String(row.slug))}/`,
    url: projectUrl(user, String(row.slug)),
    visibility: row.visibility,
    hasPassword: Boolean(row.password_hash),
    enabled: Boolean(row.enabled),
    revision: Number(row.revision),
    folders: parseFolders(row.folders),
    files: languageFiles,
    createdAt: iso(row.created_at)!,
    updatedAt: iso(row.updated_at)!,
    lastDeployedAt
  }
}

export function toApiSummary(user: DropUser, row: Omit<ApiProjectRow, 'password_hash' | 'folders' | 'created_at'>) {
  return {
    id: String(row.sid),
    name: String(row.name),
    slug: String(row.slug),
    path: `${projectPath(user, String(row.slug))}/`,
    url: projectUrl(user, String(row.slug)),
    visibility: row.visibility,
    enabled: Boolean(row.enabled),
    revision: Number(row.revision),
    updatedAt: iso(row.updated_at)!
  }
}

export async function getApiProject(user: DropUser, sid: string) {
  const [rows] = await useDb().query<ApiProjectRow[]>(
    `SELECT \`sid\`, \`name\`, \`slug\`, \`visibility\`, \`enabled\`, \`revision\`,
            \`password_hash\`, \`folders\`, \`created_at\`, \`updated_at\`
     FROM \`projects\` WHERE \`sid\` = ? AND \`owner_bits_id\` = ? LIMIT 1`,
    [sid, user.bitsId]
  )
  const row = rows[0]
  if (!row) throw apiError(404, 'not_found', 'Not found', 'Project not found.')

  const [fileRows] = await useDb().query<ApiFileRow[]>(
    'SELECT `name`, `language`, `content` FROM `project_files` WHERE `project_sid` = ? ORDER BY `sort_order`, `name`',
    [sid]
  )
  const [deploymentRows] = await useDb().query<RowDataPacket[]>(
    'SELECT MAX(`created_at`) AS `last` FROM `project_deployments` WHERE `project_sid` = ?',
    [sid]
  )

  return toApiProject(user, row, fileRows, iso(deploymentRows[0]?.last as Date | string | null))
}

export async function listApiProjects(
  user: DropUser,
  query: { page: number; perPage: number; q: string; sort: string }
) {
  const filters = ['`owner_bits_id` = ?']
  const params: unknown[] = [user.bitsId]
  const term = query.q.trim().slice(0, 80)
  if (term) {
    const like = `%${term.replace(/[\\%_]/g, '\\$&')}%`
    filters.push('(`name` LIKE ? OR `slug` LIKE ?)')
    params.push(like, like)
  }
  const where = filters.join(' AND ')
  const order: Record<string, string> = {
    updated_desc: '`updated_at` DESC, `name` ASC',
    created_desc: '`created_at` DESC, `name` ASC',
    name_asc: '`name` ASC'
  }

  const [countRows] = await useDb().query<RowDataPacket[]>(
    `SELECT COUNT(*) AS \`count\` FROM \`projects\` WHERE ${where}`,
    params
  )
  const total = Number(countRows[0]?.count ?? 0)
  const pages = Math.max(1, Math.ceil(total / query.perPage))
  const page = Math.min(Math.max(1, query.page), pages)

  const [rows] = await useDb().query<ApiProjectRow[]>(
    `SELECT \`sid\`, \`name\`, \`slug\`, \`visibility\`, \`enabled\`, \`revision\`, \`updated_at\`
     FROM \`projects\` WHERE ${where}
     ORDER BY ${order[query.sort] || order.updated_desc}
     LIMIT ? OFFSET ?`,
    [...params, query.perPage, (page - 1) * query.perPage]
  )

  return {
    data: rows.map(row => toApiSummary(user, row)),
    pagination: { page, perPage: query.perPage, total, pages }
  }
}

function deploymentResponse(row: DeploymentRow) {
  return {
    id: String(row.id),
    revision: Number(row.revision),
    status: row.status,
    fileCount: Number(row.file_count),
    totalBytes: Number(row.total_bytes),
    message: row.message,
    source: row.source,
    createdAt: iso(row.created_at)!
  }
}

export async function createApiProject(
  event: H3Event,
  user: DropUser,
  body: Record<string, unknown>,
  apiKeyId: string
) {
  const parsed = parseApiCreateBody(body)
  const created = await createProjectForUser(user, parsed.input, {
    source: 'api',
    apiKeyId,
    message: parsed.message,
    enabled: parsed.enabled
  } satisfies ProjectMutationOptions)

  const project = await getApiProject(user, created.sid)
  setResponseStatus(event, 201)
  setResponseHeader(event, 'location', `/v1/projects/${created.sid}`)
  setRevisionHeaders(event, project.revision)

  return {
    project,
    deployment: {
      ...created.deployment,
      url: project.url
    }
  }
}

export async function patchApiProject(
  event: H3Event,
  user: DropUser,
  sid: string,
  body: Record<string, unknown>
) {
  const patch = parseApiPatchBody(body)
  const expected = getIfMatchRevision(event)
  const conn = await useDb().getConnection()

  try {
    await conn.beginTransaction()
    const [rows] = await conn.query<ApiProjectRow[]>(
      `SELECT \`sid\`, \`name\`, \`slug\`, \`visibility\`, \`enabled\`, \`revision\`,
              \`password_hash\`, \`folders\`, \`created_at\`, \`updated_at\`
       FROM \`projects\` WHERE \`sid\` = ? AND \`owner_bits_id\` = ? FOR UPDATE`,
      [sid, user.bitsId]
    )
    const row = rows[0]
    if (!row) throw apiError(404, 'not_found', 'Not found', 'Project not found.')
    assertRevision(expected, Number(row.revision))

    const visibility = patch.visibility || row.visibility
    if (patch.password && visibility !== 'password') {
      throw apiError(422, 'validation_failed', 'Validation failed', 'password can only be set when visibility is password.')
    }

    let passwordHash = row.password_hash
    if (visibility === 'public') {
      passwordHash = null
    } else if (patch.password !== undefined) {
      passwordHash = hashPassword(patch.password)
    } else if (!passwordHash) {
      throw apiError(422, 'password_required', 'Password required', 'A password is required for a password-protected project.')
    }

    await conn.query(
      `UPDATE \`projects\`
       SET \`name\` = ?, \`slug\` = ?, \`visibility\` = ?, \`enabled\` = ?, \`password_hash\` = ?,
           \`revision\` = \`revision\` + 1, \`updated_at\` = NOW()
       WHERE \`sid\` = ? AND \`owner_bits_id\` = ?`,
      [
        patch.name ?? row.name,
        patch.slug ?? row.slug,
        visibility,
        patch.enabled === undefined ? row.enabled : patch.enabled ? 1 : 0,
        passwordHash,
        sid,
        user.bitsId
      ]
    )
    await conn.commit()
  } catch (err) {
    await conn.rollback()
    if ((err as { code?: string })?.code === 'ER_DUP_ENTRY') {
      throw apiError(409, 'slug_taken', 'Slug already taken', 'Choose a different slug.')
    }
    throw err
  } finally {
    conn.release()
  }

  const project = await getApiProject(user, sid)
  setRevisionHeaders(event, project.revision)
  return project
}

export async function deployApiProject(
  event: H3Event,
  user: DropUser,
  sid: string,
  body: Record<string, unknown>,
  apiKeyId: string
) {
  const deploy = parseApiDeployBody(body)
  const expected = getIfMatchRevision(event)
  const conn = await useDb().getConnection()
  let revision = 0
  let deploymentId = ''
  let deploymentCreatedAt = ''

  try {
    await conn.beginTransaction()
    const [rows] = await conn.query<ApiProjectRow[]>(
      `SELECT \`sid\`, \`name\`, \`slug\`, \`visibility\`, \`enabled\`, \`revision\`,
              \`password_hash\`, \`folders\`, \`created_at\`, \`updated_at\`
       FROM \`projects\` WHERE \`sid\` = ? AND \`owner_bits_id\` = ? FOR UPDATE`,
      [sid, user.bitsId]
    )
    const row = rows[0]
    if (!row) throw apiError(404, 'not_found', 'Not found', 'Project not found.')
    assertRevision(expected, Number(row.revision))

    await conn.query('DELETE FROM `project_files` WHERE `project_sid` = ?', [sid])
    await insertFiles(conn, sid, deploy.files)
    await conn.query(
      'UPDATE `projects` SET `folders` = ?, `revision` = `revision` + 1, `updated_at` = NOW() WHERE `sid` = ? AND `owner_bits_id` = ?',
      [JSON.stringify(deploy.folders), sid, user.bitsId]
    )
    const [revisionRows] = await conn.query<RowDataPacket[]>(
      'SELECT `revision` FROM `projects` WHERE `sid` = ? LIMIT 1',
      [sid]
    )
    revision = Number(revisionRows[0]?.revision)
    const deployment = await insertDeployment(conn, {
      projectSid: sid,
      revision,
      source: 'api',
      apiKeyId,
      message: deploy.message,
      fileCount: deploy.files.length,
      totalBytes: fileBytes(deploy.files)
    })
    deploymentId = deployment.id
    deploymentCreatedAt = deployment.createdAt
    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }

  const project = await getApiProject(user, sid)
  setRevisionHeaders(event, project.revision)
  return {
    project,
    deployment: {
      id: deploymentId,
      revision,
      status: 'live' as const,
      url: project.url,
      fileCount: deploy.files.length,
      totalBytes: fileBytes(deploy.files),
      message: deploy.message,
      source: 'api' as const,
      createdAt: deploymentCreatedAt
    }
  }
}

export async function deleteApiProject(event: H3Event, user: DropUser, sid: string) {
  const expected = getIfMatchRevision(event)
  const conn = await useDb().getConnection()

  try {
    await conn.beginTransaction()
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT `revision` FROM `projects` WHERE `sid` = ? AND `owner_bits_id` = ? FOR UPDATE',
      [sid, user.bitsId]
    )
    const row = rows[0]
    if (!row) throw apiError(404, 'not_found', 'Not found', 'Project not found.')
    assertRevision(expected, Number(row.revision))
    await conn.query<ResultSetHeader>('DELETE FROM `projects` WHERE `sid` = ? AND `owner_bits_id` = ?', [sid, user.bitsId])
    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export async function listApiDeployments(
  user: DropUser,
  sid: string,
  page: number,
  perPage: number
) {
  const [projectRows] = await useDb().query<RowDataPacket[]>(
    'SELECT `sid`, `slug` FROM `projects` WHERE `sid` = ? AND `owner_bits_id` = ? LIMIT 1',
    [sid, user.bitsId]
  )
  const project = projectRows[0]
  if (!project) throw apiError(404, 'not_found', 'Not found', 'Project not found.')

  const [countRows] = await useDb().query<RowDataPacket[]>(
    'SELECT COUNT(*) AS `count` FROM `project_deployments` WHERE `project_sid` = ?',
    [sid]
  )
  const total = Number(countRows[0]?.count ?? 0)
  const pages = Math.max(1, Math.ceil(total / perPage))
  const current = Math.min(Math.max(1, page), pages)

  const [rows] = await useDb().query<DeploymentRow[]>(
    `SELECT \`id\`, \`revision\`, \`source\`, \`message\`, \`file_count\`, \`total_bytes\`, \`status\`, \`created_at\`
     FROM \`project_deployments\` WHERE \`project_sid\` = ?
     ORDER BY \`created_at\` DESC, \`revision\` DESC LIMIT ? OFFSET ?`,
    [sid, perPage, (current - 1) * perPage]
  )

  return {
    data: rows.map(row => ({
      ...deploymentResponse(row),
      url: `${CONTENT_BASE}${projectPath(user, String(project.slug))}/`
    })),
    pagination: { page: current, perPage, total, pages }
  }
}
