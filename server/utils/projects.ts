import { randomBytes, randomUUID, scryptSync } from 'node:crypto'
import type { H3Event } from 'h3'
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { getSessionUser, type DropUser } from './auth'
import { useDb } from './db'
import { recentDays, summarizeTraffic } from './traffic'
import {
  validateFilePath,
  validateFolderPath,
  type ProjectLanguage
} from '../../shared/project-paths'

export const MAX_FILES = 20
export const MAX_FOLDERS = 50
export const MAX_FILE_BYTES = 512 * 1024
export const MAX_TOTAL_BYTES = 1024 * 1024
export const MAX_PROJECTS = 1000
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/

export type ProjectVisibility = 'public' | 'password'
export type { ProjectLanguage } from '../../shared/project-paths'

export interface ProjectFileInput {
  name: string
  language: ProjectLanguage
  content: string
}

export interface ProjectInput {
  name: string
  slug: string
  visibility: ProjectVisibility
  password?: string
  folders: string[]
  files: ProjectFileInput[]
}

interface ProjectRow extends RowDataPacket {
  sid: string
  password_hash: string | null
  revision: number
}

export interface ProjectMutationOptions {
  source?: 'web' | 'api'
  apiKeyId?: string | null
  message?: string | null
  enabled?: boolean
}

export interface DeploymentRecord {
  id: string
  revision: number
  status: 'live'
  fileCount: number
  totalBytes: number
  message: string | null
  source: 'web' | 'api'
  createdAt: string
}

function fail(message: string, field?: string): never {
  throw createError({
    statusCode: 400,
    statusMessage: message,
    data: {
      errors: [{ ...(field ? { path: field } : {}), message }]
    }
  })
}

// 文件父目录自动补成显式文件夹，保证空文件夹和嵌套目录都能保存/恢复
function mergeFolders(folders: string[], files: ProjectFileInput[]) {
  const set = new Set<string>()
  const add = (path: string) => {
    if (!path) return
    const parts = path.split('/')
    let current = ''
    for (const part of parts) {
      current = current ? `${current}/${part}` : part
      set.add(current)
    }
  }
  folders.forEach(add)
  files.forEach(file => {
    const parts = file.name.split('/')
    parts.pop()
    add(parts.join('/'))
  })
  return [...set].sort((a, b) => a.localeCompare(b))
}

export async function requireUser(event: H3Event): Promise<DropUser> {
  const user = await getSessionUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Please log in with BITS first.' })
  return user
}

export function parseProjectInput(body: unknown): ProjectInput {
  if (!body || typeof body !== 'object') fail('Invalid project data.')

  const raw = body as Record<string, unknown>
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) fail('Project name is required.')
  if ([...name].length > 80) fail('Project name must be 80 characters or fewer.')

  const slug = typeof raw.slug === 'string' ? raw.slug.trim().toLowerCase() : ''
  if (!SLUG_RE.test(slug)) {
    fail('Project URL must be 1-40 characters: lowercase letters, numbers and hyphens.')
  }

  const visibility = raw.visibility
  if (visibility !== 'public' && visibility !== 'password') {
    fail('Choose a valid visibility.')
  }

  const password = typeof raw.password === 'string' ? raw.password : ''
  if (password && (password.length < 6 || password.length > 128)) {
    fail('Password must be between 6 and 128 characters.')
  }

  const folders: string[] = []
  if (raw.folders !== undefined) {
    if (!Array.isArray(raw.folders)) fail('Invalid folders.')
    if (raw.folders.length > MAX_FOLDERS) fail(`A project can have at most ${MAX_FOLDERS} folders.`)

    const seenFolders = new Set<string>()
    for (const [index, entry] of raw.folders.entries()) {
      if (typeof entry !== 'string') fail('Invalid folder path.', `folders[${index}]`)
      const folder = entry.trim()
      const validation = validateFolderPath(folder)
      if (!validation.ok) fail(validation.message, `folders[${index}]`)

      const key = folder.toLowerCase()
      if (!seenFolders.has(key)) {
        seenFolders.add(key)
        folders.push(folder)
      }
    }
  }

  if (!Array.isArray(raw.files) || raw.files.length === 0) fail('Add at least one file.')
  if (raw.files.length > MAX_FILES) fail(`A project can have at most ${MAX_FILES} files.`)

  const files: ProjectFileInput[] = []
  const seen = new Set<string>()
  let totalBytes = 0

  for (const [index, entry] of raw.files.entries()) {
    if (!entry || typeof entry !== 'object') fail('Invalid file data.')

    const file = entry as Record<string, unknown>
    const fileName = typeof file.name === 'string' ? file.name.trim() : ''
    const language = typeof file.language === 'string' ? file.language : ''
    const content = typeof file.content === 'string' ? file.content : ''

    const validation = validateFilePath(fileName)
    if (!validation.ok) fail(validation.message, `files[${index}].path`)
    if (language !== 'html' && language !== 'css' && language !== 'js') {
      fail('Unsupported file type.', `files[${index}].language`)
    }
    if (validation.language !== language) {
      fail(`${fileName} does not match its file type.`, `files[${index}].path`)
    }

    const key = fileName.toLowerCase()
    if (seen.has(key)) fail(`Duplicate file name: ${fileName}`, `files[${index}].path`)
    seen.add(key)

    const bytes = Buffer.byteLength(content, 'utf8')
    if (bytes > MAX_FILE_BYTES) fail(`${fileName} is larger than 512 KB.`, `files[${index}].content`)
    totalBytes += bytes

    files.push({ name: fileName, language, content })
  }

  if (totalBytes > MAX_TOTAL_BYTES) fail('Project files are larger than 1 MB in total.')

  return { name, slug, visibility, password: password || undefined, folders: mergeFolders(folders, files), files }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function projectPath(user: DropUser, slug: string) {
  return `/${encodeURIComponent(user.username)}/${encodeURIComponent(slug)}`
}

function projectError(err: unknown) {
  if (err && typeof err === 'object' && (err as { code?: string }).code === 'ER_DUP_ENTRY') {
    return createError({ statusCode: 409, statusMessage: 'That project URL is already taken.' })
  }
  return err instanceof Error ? err : new Error(String(err))
}

export async function insertFiles(conn: PoolConnection, projectSid: string, files: ProjectFileInput[]) {
  for (const [index, file] of files.entries()) {
    await conn.query(
      'INSERT INTO `project_files` (`sid`, `project_sid`, `name`, `language`, `content`, `sort_order`) VALUES (?, ?, ?, ?, ?, ?)',
      [randomUUID(), projectSid, file.name, file.language, file.content, index]
    )
  }
}

export function fileBytes(files: ProjectFileInput[]) {
  return files.reduce((sum, file) => sum + Buffer.byteLength(file.content, 'utf8'), 0)
}

export async function insertDeployment(
  conn: PoolConnection,
  input: {
    projectSid: string
    revision: number
    source: 'web' | 'api'
    apiKeyId?: string | null
    message?: string | null
    fileCount: number
    totalBytes: number
  }
): Promise<DeploymentRecord> {
  const id = randomUUID()
  const message = input.message?.trim() ? input.message.trim().slice(0, 200) : null
  await conn.query(
    `INSERT INTO \`project_deployments\`
       (\`id\`, \`project_sid\`, \`revision\`, \`source\`, \`api_key_id\`, \`message\`, \`file_count\`, \`total_bytes\`, \`status\`)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'live')`,
    [id, input.projectSid, input.revision, input.source, input.apiKeyId || null, message, input.fileCount, input.totalBytes]
  )
  return {
    id,
    revision: input.revision,
    status: 'live',
    fileCount: input.fileCount,
    totalBytes: input.totalBytes,
    message,
    source: input.source,
    createdAt: new Date().toISOString()
  }
}

function requireUsername(user: DropUser) {
  if (!user.username) fail('Set a username on BITS before creating a project.')
  return user.username
}

export interface ProjectListQuery {
  page: number
  q: string
  sort: string
}

const PROJECT_ORDER: Record<string, string> = {
  updated: '`updated_at` DESC, `name` ASC',
  created: '`created_at` DESC, `name` ASC',
  name: '`name` ASC'
}

export async function listProjects(event: H3Event, query: ProjectListQuery) {
  const user = await requireUser(event)
  const perPage = 20

  const filters = ['`owner_bits_id` = ?']
  const params: unknown[] = [user.bitsId]

  const term = query.q.trim().slice(0, 80)
  if (term) {
    // 转义 LIKE 通配符，避免用户输入 % _ 时匹配到全部
    const like = `%${term.replace(/[\\%_]/g, '\\$&')}%`
    filters.push('(`name` LIKE ? OR `slug` LIKE ?)')
    params.push(like, like)
  }
  const where = filters.join(' AND ')

  const [countRows] = await useDb().query<RowDataPacket[]>(
    `SELECT COUNT(*) AS \`count\` FROM \`projects\` WHERE ${where}`,
    params
  )
  const total = Number(countRows[0]?.count ?? 0)
  const pages = Math.max(1, Math.ceil(total / perPage))
  const current = Math.min(Math.max(1, Math.floor(query.page) || 1), pages)
  const [usageRows] = await useDb().query<RowDataPacket[]>(
    'SELECT COUNT(*) AS `count` FROM `projects` WHERE `owner_bits_id` = ?',
    [user.bitsId]
  )
  const projectCount = Number(usageRows[0]?.count ?? 0)

  const [rows] = await useDb().query<RowDataPacket[]>(
    `SELECT \`sid\`, \`name\`, \`slug\`, \`visibility\`, \`enabled\`, \`updated_at\` FROM \`projects\` WHERE ${where} ORDER BY ${PROJECT_ORDER[query.sort] || PROJECT_ORDER.updated} LIMIT ? OFFSET ?`,
    [...params, perPage, (current - 1) * perPage]
  )

  const trafficWindow = await recentDays()

  const [visitRows] = await useDb().query<RowDataPacket[]>(
    `SELECT v.\`project_sid\`, DATE_FORMAT(v.\`day\`, '%Y-%m-%d') AS day, COUNT(*) AS count
     FROM \`project_visits\` v JOIN \`projects\` p ON p.\`sid\` = v.\`project_sid\`
     WHERE p.\`owner_bits_id\` = ? AND v.\`day\` BETWEEN ? AND ?
     GROUP BY v.\`project_sid\`, v.\`day\``,
    [user.bitsId, trafficWindow.start, trafficWindow.today]
  )
  const visitsByProject = new Map<string, Map<string, number>>()
  for (const row of visitRows) {
    const sid = String(row.project_sid)
    let counts = visitsByProject.get(sid)
    if (!counts) {
      counts = new Map()
      visitsByProject.set(sid, counts)
    }
    counts.set(String(row.day), Number(row.count || 0))
  }

  return {
    projects: rows.map(row => {
      const sid = String(row.sid)
      return {
        sid,
        name: String(row.name),
        slug: String(row.slug),
        visibility: row.visibility as ProjectVisibility,
        enabled: Boolean(row.enabled),
        updatedAt: (row.updated_at as Date).toISOString(),
        path: projectPath(user, String(row.slug)),
        visits: summarizeTraffic(trafficWindow, visitsByProject.get(sid) || new Map())
      }
    }),
    usage: { count: projectCount, limit: MAX_PROJECTS },
    page: current,
    perPage,
    total,
    pages
  }
}

export async function getProject(event: H3Event, sid: string) {
  const user = await requireUser(event)

  const [rows] = await useDb().query<RowDataPacket[]>(
    'SELECT `sid`, `name`, `slug`, `visibility`, `folders`, `password_hash`, `updated_at` FROM `projects` WHERE `sid` = ? AND `owner_bits_id` = ? LIMIT 1',
    [sid, user.bitsId]
  )
  const row = rows[0]
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Project not found.' })

  // mysql2 对 JSON 列既可能返回字符串，也可能返回已解析的值
  const folders = Array.isArray(row.folders)
    ? row.folders
    : (JSON.parse(String(row.folders || '[]')) as string[])

  const [fileRows] = await useDb().query<RowDataPacket[]>(
    'SELECT `name`, `language`, `content` FROM `project_files` WHERE `project_sid` = ? ORDER BY `sort_order`, `name`',
    [sid]
  )

  return {
    sid: String(row.sid),
    name: String(row.name),
    slug: String(row.slug),
    visibility: row.visibility as ProjectVisibility,
    hasPassword: Boolean(row.password_hash),
    folders,
    files: fileRows.map(file => ({
      name: String(file.name),
      language: file.language as ProjectLanguage,
      content: String(file.content)
    })),
    path: projectPath(user, String(row.slug))
  }
}

// 仪表盘开关只控制站点是否启用，与可见性无关
export async function setProjectEnabled(event: H3Event, sid: string, enabled: unknown) {
  if (typeof enabled !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Choose enabled or disabled.' })
  }

  const user = await requireUser(event)
  await useDb().query(
    'UPDATE `projects` SET `enabled` = ?, `revision` = `revision` + 1, `updated_at` = NOW() WHERE `sid` = ? AND `owner_bits_id` = ?',
    [enabled ? 1 : 0, sid, user.bitsId]
  )

  const [rows] = await useDb().query<RowDataPacket[]>(
    'SELECT `slug`, `revision` FROM `projects` WHERE `sid` = ? AND `owner_bits_id` = ? LIMIT 1',
    [sid, user.bitsId]
  )
  const row = rows[0]
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Project not found.' })

  return {
    sid,
    enabled,
    revision: Number(row.revision),
    path: projectPath(user, String(row.slug))
  }
}

export async function deleteProjectForUser(user: DropUser, sid: string) {
  const [result] = await useDb().query<ResultSetHeader>(
    'DELETE FROM `projects` WHERE `sid` = ? AND `owner_bits_id` = ?',
    [sid, user.bitsId]
  )
  if (!result.affectedRows) throw createError({ statusCode: 404, statusMessage: 'Project not found.' })
  return { sid }
}

export async function deleteProject(event: H3Event, sid: string) {
  const user = await requireUser(event)
  return deleteProjectForUser(user, sid)
}

export async function createProjectForUser(
  user: DropUser,
  input: ProjectInput,
  options: ProjectMutationOptions = {}
) {
  requireUsername(user)

  const [countRows] = await useDb().query<RowDataPacket[]>(
    'SELECT COUNT(*) AS `count` FROM `projects` WHERE `owner_bits_id` = ?',
    [user.bitsId]
  )
  if (Number(countRows[0]?.count ?? 0) >= MAX_PROJECTS) {
    throw createError({ statusCode: 409, statusMessage: `Project limit reached (${MAX_PROJECTS}).` })
  }

  const passwordHash = input.visibility === 'password'
    ? hashPassword(input.password || fail('Password is required for a password-protected project.'))
    : null

  const sid = randomUUID()
  const enabled = options.enabled ?? true
  const conn = await useDb().getConnection()
  let deployment: DeploymentRecord

  try {
    await conn.beginTransaction()
    await conn.query(
      'INSERT INTO `projects` (`sid`, `owner_bits_id`, `slug`, `name`, `visibility`, `enabled`, `revision`, `password_hash`, `folders`) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
      [sid, user.bitsId, input.slug, input.name, input.visibility, enabled ? 1 : 0, passwordHash, JSON.stringify(input.folders)]
    )
    await insertFiles(conn, sid, input.files)
    deployment = await insertDeployment(conn, {
      projectSid: sid,
      revision: 1,
      source: options.source || 'web',
      apiKeyId: options.apiKeyId,
      message: options.message,
      fileCount: input.files.length,
      totalBytes: fileBytes(input.files)
    })
    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw projectError(err)
  } finally {
    conn.release()
  }

  return {
    sid,
    name: input.name,
    slug: input.slug,
    visibility: input.visibility,
    enabled,
    revision: 1,
    folders: input.folders,
    deployment,
    path: projectPath(user, input.slug)
  }
}

export async function createProject(event: H3Event, input: ProjectInput) {
  const user = await requireUser(event)
  return createProjectForUser(user, input)
}

export async function updateProject(event: H3Event, sid: string, input: ProjectInput) {
  const user = await requireUser(event)
  requireUsername(user)

  const conn = await useDb().getConnection()
  let revision = 1
  let deployment: DeploymentRecord

  try {
    await conn.beginTransaction()

    const [rows] = await conn.query<ProjectRow[]>(
      'SELECT `sid`, `password_hash`, `revision` FROM `projects` WHERE `sid` = ? AND `owner_bits_id` = ? LIMIT 1 FOR UPDATE',
      [sid, user.bitsId]
    )
    const existing = rows[0]
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Project not found.' })

    let passwordHash: string | null = null
    if (input.visibility === 'password') {
      passwordHash = input.password ? hashPassword(input.password) : existing.password_hash
      if (!passwordHash) fail('Password is required for a password-protected project.')
    }

    await conn.query(
      'UPDATE `projects` SET `slug` = ?, `name` = ?, `visibility` = ?, `password_hash` = ?, `folders` = ?, `revision` = `revision` + 1, `updated_at` = NOW() WHERE `sid` = ? AND `owner_bits_id` = ?',
      [input.slug, input.name, input.visibility, passwordHash, JSON.stringify(input.folders), sid, user.bitsId]
    )
    await conn.query('DELETE FROM `project_files` WHERE `project_sid` = ?', [sid])
    await insertFiles(conn, sid, input.files)
    const [revisionRows] = await conn.query<RowDataPacket[]>(
      'SELECT `revision` FROM `projects` WHERE `sid` = ? LIMIT 1',
      [sid]
    )
    revision = Number(revisionRows[0]?.revision || existing.revision + 1)
    deployment = await insertDeployment(conn, {
      projectSid: sid,
      revision,
      source: 'web',
      fileCount: input.files.length,
      totalBytes: fileBytes(input.files)
    })

    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw projectError(err)
  } finally {
    conn.release()
  }

  return {
    sid,
    name: input.name,
    slug: input.slug,
    visibility: input.visibility,
    revision,
    folders: input.folders,
    deployment,
    path: projectPath(user, input.slug)
  }
}
