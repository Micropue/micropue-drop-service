import { randomBytes, randomUUID, scryptSync } from 'node:crypto'
import type { H3Event } from 'h3'
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { getSessionUser, type DropUser } from './auth'
import { useDb } from './db'

const MAX_FILES = 20
const MAX_FOLDERS = 50
const MAX_FILE_BYTES = 512 * 1024
const MAX_TOTAL_BYTES = 1024 * 1024
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/
const FILE_RE = /^[\p{L}\p{N}][\p{L}\p{N}._-]{0,79}\.(html|css|js)$/u
const PATH_SEGMENT_RE = /^[\p{L}\p{N}._-]+$/u

export type ProjectVisibility = 'public' | 'password'
export type ProjectLanguage = 'html' | 'css' | 'js'

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
}

function fail(message: string): never {
  throw createError({ statusCode: 400, statusMessage: message })
}

function validPath(path: string, maxLength: number) {
  if (!path || path.length > maxLength || path.startsWith('/') || path.endsWith('/') || path.includes('//')) return false
  return path.split('/').every(part => part !== '.' && part !== '..' && PATH_SEGMENT_RE.test(part))
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
    for (const entry of raw.folders) {
      if (typeof entry !== 'string') fail('Invalid folder path.')
      const folder = entry.trim()
      if (!validPath(folder, 100)) fail(`Invalid folder path: ${folder}`)

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

  for (const entry of raw.files) {
    if (!entry || typeof entry !== 'object') fail('Invalid file data.')

    const file = entry as Record<string, unknown>
    const fileName = typeof file.name === 'string' ? file.name.trim() : ''
    const language = typeof file.language === 'string' ? file.language : ''
    const content = typeof file.content === 'string' ? file.content : ''

    const parts = fileName.split('/')
    const baseName = parts[parts.length - 1] || ''

    if (!FILE_RE.test(baseName)) {
      fail('Files must be .html, .css or .js and cannot end with a folder.')
    }
    if (!validPath(fileName, 120)) fail(`Invalid file path: ${fileName}`)
    if (language !== 'html' && language !== 'css' && language !== 'js') {
      fail('Unsupported file type.')
    }
    if (baseName.split('.').pop() !== language) {
      fail(`${fileName} does not match its file type.`)
    }

    const key = fileName.toLowerCase()
    if (seen.has(key)) fail(`Duplicate file name: ${fileName}`)
    seen.add(key)

    const bytes = Buffer.byteLength(content, 'utf8')
    if (bytes > MAX_FILE_BYTES) fail(`${fileName} is larger than 512 KB.`)
    totalBytes += bytes

    files.push({ name: fileName, language, content })
  }

  if (totalBytes > MAX_TOTAL_BYTES) fail('Project files are larger than 1 MB in total.')

  return { name, slug, visibility, password: password || undefined, folders: mergeFolders(folders, files), files }
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

function projectPath(user: DropUser, slug: string) {
  return `/${encodeURIComponent(user.username)}/${encodeURIComponent(slug)}`
}

function projectError(err: unknown) {
  if (err && typeof err === 'object' && (err as { code?: string }).code === 'ER_DUP_ENTRY') {
    return createError({ statusCode: 409, statusMessage: 'That project URL is already taken.' })
  }
  return err instanceof Error ? err : new Error(String(err))
}

async function insertFiles(conn: PoolConnection, projectSid: string, files: ProjectFileInput[]) {
  for (const [index, file] of files.entries()) {
    await conn.query(
      'INSERT INTO `project_files` (`sid`, `project_sid`, `name`, `language`, `content`, `sort_order`) VALUES (?, ?, ?, ?, ?, ?)',
      [randomUUID(), projectSid, file.name, file.language, file.content, index]
    )
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

  const [rows] = await useDb().query<RowDataPacket[]>(
    `SELECT \`sid\`, \`name\`, \`slug\`, \`visibility\`, \`enabled\`, \`updated_at\` FROM \`projects\` WHERE ${where} ORDER BY ${PROJECT_ORDER[query.sort] || PROJECT_ORDER.updated} LIMIT ? OFFSET ?`,
    [...params, perPage, (current - 1) * perPage]
  )

  return {
    projects: rows.map(row => ({
      sid: String(row.sid),
      name: String(row.name),
      slug: String(row.slug),
      visibility: row.visibility as ProjectVisibility,
      enabled: Boolean(row.enabled),
      updatedAt: (row.updated_at as Date).toISOString(),
      path: projectPath(user, String(row.slug))
    })),
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
    'UPDATE `projects` SET `enabled` = ?, `updated_at` = NOW() WHERE `sid` = ? AND `owner_bits_id` = ?',
    [enabled ? 1 : 0, sid, user.bitsId]
  )

  const [rows] = await useDb().query<RowDataPacket[]>(
    'SELECT `slug` FROM `projects` WHERE `sid` = ? AND `owner_bits_id` = ? LIMIT 1',
    [sid, user.bitsId]
  )
  const row = rows[0]
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Project not found.' })

  return {
    sid,
    enabled,
    path: projectPath(user, String(row.slug))
  }
}

export async function deleteProject(event: H3Event, sid: string) {
  const user = await requireUser(event)
  const [result] = await useDb().query<ResultSetHeader>(
    'DELETE FROM `projects` WHERE `sid` = ? AND `owner_bits_id` = ?',
    [sid, user.bitsId]
  )
  if (!result.affectedRows) throw createError({ statusCode: 404, statusMessage: 'Project not found.' })
  return { sid }
}

export async function createProject(event: H3Event, input: ProjectInput) {
  const user = await requireUser(event)
  requireUsername(user)

  const [countRows] = await useDb().query<RowDataPacket[]>(
    'SELECT COUNT(*) AS `count` FROM `projects` WHERE `owner_bits_id` = ?',
    [user.bitsId]
  )
  if (Number(countRows[0]?.count ?? 0) >= 100) {
    throw createError({ statusCode: 409, statusMessage: 'Project limit reached (100).' })
  }

  const passwordHash = input.visibility === 'password'
    ? hashPassword(input.password || fail('Password is required for a password-protected project.'))
    : null

  const sid = randomUUID()
  const conn = await useDb().getConnection()

  try {
    await conn.beginTransaction()
    await conn.query(
      'INSERT INTO `projects` (`sid`, `owner_bits_id`, `slug`, `name`, `visibility`, `password_hash`, `folders`) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [sid, user.bitsId, input.slug, input.name, input.visibility, passwordHash, JSON.stringify(input.folders)]
    )
    await insertFiles(conn, sid, input.files)
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
    folders: input.folders,
    path: projectPath(user, input.slug)
  }
}

export async function updateProject(event: H3Event, sid: string, input: ProjectInput) {
  const user = await requireUser(event)
  requireUsername(user)

  const conn = await useDb().getConnection()

  try {
    await conn.beginTransaction()

    const [rows] = await conn.query<ProjectRow[]>(
      'SELECT `sid`, `password_hash` FROM `projects` WHERE `sid` = ? AND `owner_bits_id` = ? LIMIT 1',
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
      'UPDATE `projects` SET `slug` = ?, `name` = ?, `visibility` = ?, `password_hash` = ?, `folders` = ?, `updated_at` = NOW() WHERE `sid` = ? AND `owner_bits_id` = ?',
      [input.slug, input.name, input.visibility, passwordHash, JSON.stringify(input.folders), sid, user.bitsId]
    )
    await conn.query('DELETE FROM `project_files` WHERE `project_sid` = ?', [sid])
    await insertFiles(conn, sid, input.files)

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
    folders: input.folders,
    path: projectPath(user, input.slug)
  }
}
