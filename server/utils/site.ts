import { scryptSync, timingSafeEqual } from 'node:crypto'
import { jwtVerify, SignJWT } from 'jose'
import type { H3Event } from 'h3'
import type { RowDataPacket } from 'mysql2/promise'
import { useDb } from './db'
import { useRedis } from './redis'
import type { ProjectVisibility } from './projects'

interface SiteProjectRow extends RowDataPacket {
  sid: string
  owner_bits_id: string
  username: string
  name: string
  slug: string
  visibility: ProjectVisibility
  enabled: number
  password_hash: string | null
}

interface SiteFileRow extends RowDataPacket {
  content: string
  language: 'html' | 'css' | 'js'
}

const MIME: Record<SiteFileRow['language'], string> = {
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript'
}

const UNLOCK_MAX_AGE = 60 * 60 * 12
const UNLOCK_ATTEMPTS = 10

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string)

function pageHtml(title: string, body: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 2rem; background: #fafafa; color: #18181b; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; }
.card { width: 100%; max-width: 380px; }
.brand { margin: 0 0 .75rem; font-size: .72rem; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: #71717a; }
h1 { margin: 0 0 .5rem; font-size: 1.35rem; letter-spacing: -.01em; }
p { margin: 0 0 1rem; color: #52525b; font-size: .9rem; line-height: 1.6; }
label { display: block; margin-bottom: .35rem; font-size: .78rem; color: #71717a; }
input { width: 100%; padding: .6rem .7rem; border: 1px solid #d4d4d8; border-radius: 6px; background: #fff; color: inherit; font: inherit; }
button { width: 100%; margin-top: .75rem; padding: .6rem .9rem; border: 0; border-radius: 6px; background: #18181b; color: #fff; font: inherit; cursor: pointer; }
button:hover { background: #27272a; }
.error { color: #dc2626; }
a { color: inherit; }
.back { display: inline-block; margin-top: 1rem; font-size: .82rem; color: #71717a; text-decoration: none; }
.back:hover { color: inherit; }
@media (prefers-color-scheme: dark) {
  body { background: #09090b; color: #fafafa; }
  p, .back, label { color: #a1a1aa; }
  input { background: #18181b; border-color: #3f3f46; }
  button { background: #fafafa; color: #09090b; }
  button:hover { background: #e4e4e7; }
  .error { color: #f87171; }
}
</style>
</head>
<body><main class="card">${body}</main></body>
</html>`
}

function notFound(event: H3Event, message = 'This page does not exist.') {
  setResponseStatus(event, 404)
  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  setHeader(event, 'cache-control', 'no-store')
  setHeader(event, 'x-robots-tag', 'noindex')
  return pageHtml('Not found — DROP', `<p class="brand">MICROPUE DROP</p><h1>Not found</h1><p>${message}</p><a class="back" href="/">Go to DROP</a>`)
}

export { notFound as contentNotFound }

function bareHost(value: string) {
  return value.trim().toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .split('/')[0]
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')
}

// 内容域：接受 NUXT_CONTENT_HOST、NUXT_PUBLIC_CONTENT_URL 和默认域名中的任意一个；绝不能是主站域名
function contentHosts(event: H3Event) {
  const config = useRuntimeConfig(event)
  const site = bareHost(String(config.public.siteUrl || ''))
  const hosts = new Set<string>()
  for (const raw of [config.contentHost, config.public.contentUrl, 'dropcontent.micropue.com.cn']) {
    const host = bareHost(String(raw || ''))
    if (host && host !== site) hosts.add(host)
  }
  return [...hosts]
}

// 内容只允许通过 dropcontent 域名访问；drop 主站上的 /{username}/{slug} 直接 404
export function isContentRequest(event: H3Event) {
  const expected = contentHosts(event)
  const forwarded = String(event.node.req.headers['x-forwarded-host'] || '').split(',')[0]
  const hosts = new Set([
    bareHost(getRequestHost(event) || ''),
    bareHost(forwarded)
  ])
  return expected.some(host => hosts.has(host))
}

// 内容域根地址：只提示这是内容服务，不渲染主站
export function contentHome(event: H3Event) {
  const site = String(useRuntimeConfig(event).public.siteUrl || 'https://drop.micropue.com.cn').replace(/\/+$/, '')
  const label = site.replace(/^https?:\/\//, '')

  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  setHeader(event, 'cache-control', 'no-store')
  setHeader(event, 'x-robots-tag', 'noindex')

  return pageHtml('Drop content service', `<p>This is Drop's content service. Visit <a href="${escapeHtml(site)}">${escapeHtml(label)}</a> to open the main site.</p>`)
}

function normalizePath(raw: string) {
  const cleaned = raw.replace(/^\/+/, '')
  const path = cleaned.endsWith('/') ? `${cleaned}index.html` : cleaned
  if (!path || path.length > 120) return ''
  if (path.includes('\\') || path.includes('\u0000')) return ''
  if (path.split('/').some(part => !part || part === '.' || part === '..')) return ''
  return path
}

async function findProject(username: string, slug: string) {
  const [rows] = await useDb().query<SiteProjectRow[]>(
    `SELECT p.\`sid\`, p.\`owner_bits_id\`, p.\`name\`, p.\`slug\`, p.\`visibility\`, p.\`enabled\`, p.\`password_hash\`, a.\`username\`
     FROM \`projects\` p JOIN \`accounts\` a ON a.\`bits_id\` = p.\`owner_bits_id\`
     WHERE a.\`username\` = ? AND p.\`slug\` = ? LIMIT 1`,
    [username, slug]
  )
  return rows[0] ?? null
}

function unlockCookie(sid: string) {
  return `drop_unlock_${sid.replace(/-/g, '')}`
}

function secret() {
  const value = process.env.AUTH_SECRET
  if (!value) throw createError({ statusCode: 500, statusMessage: 'AUTH_SECRET is not configured' })
  return new TextEncoder().encode(value)
}

async function hasUnlock(event: H3Event, sid: string) {
  const token = getCookie(event, unlockCookie(sid))
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload.kind === 'unlock' && payload.sid === sid
  } catch {
    return false
  }
}

function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'hex')
  const actual = scryptSync(password, salt, 64)
  return expected.length === actual.length && timingSafeEqual(actual, expected)
}

function passwordPage(project: SiteProjectRow, next: string, failed: boolean) {
  return pageHtml(`${project.name} — Password`, `
<p class="brand">MICROPUE DROP</p>
<h1>${escapeHtml(project.name)}</h1>
<p>This project is password protected.</p>
${failed ? '<p class="error">Wrong password. Try again.</p>' : ''}
<form method="post" action="/api/unlock/${escapeHtml(project.sid)}">
  <input type="hidden" name="next" value="${escapeHtml(next)}">
  <label for="password">Password</label>
  <input id="password" name="password" type="password" required autofocus autocomplete="current-password" maxlength="128">
  <button type="submit">Open project</button>
</form>
<a class="back" href="/">Go to DROP</a>`)
}

export async function serveProject(event: H3Event, username: string, slug: string, rawPath: string) {
  const url = getRequestURL(event)

  const project = await findProject(username, slug)
  if (!project) return notFound(event)

  if (!project.enabled) return notFound(event, 'This site is currently unavailable.')

  if (project.visibility === 'password') {
    if (!project.password_hash) return notFound(event, 'This project is not available.')

    if (!(await hasUnlock(event, project.sid))) {
      setResponseStatus(event, 401)
      setHeader(event, 'content-type', 'text/html; charset=utf-8')
      setHeader(event, 'cache-control', 'no-store')
      setHeader(event, 'x-robots-tag', 'noindex')
      return passwordPage(project, url.pathname + url.search, url.searchParams.get('error') === '1')
    }
  }

  // 相对路径（assets/...）只有在结尾带斜杠时才指向项目目录
  if (!rawPath) {
    if (!url.pathname.endsWith('/')) return sendRedirect(event, `${url.pathname}/${url.search}`, 308)
    rawPath = 'index.html'
  }

  const filePath = normalizePath(rawPath)
  if (!filePath) return notFound(event)

  const [rows] = await useDb().query<SiteFileRow[]>(
    'SELECT `content`, `language` FROM `project_files` WHERE `project_sid` = ? AND `name` = ? LIMIT 1',
    [project.sid, filePath]
  )
  const file = rows[0]
  if (!file) return notFound(event)

  setHeader(event, 'content-type', `${MIME[file.language]}; charset=utf-8`)
  setHeader(event, 'cache-control', project.visibility === 'public' ? 'public, max-age=60' : 'private, no-store')
  setHeader(event, 'x-content-type-options', 'nosniff')
  if (project.visibility !== 'public') setHeader(event, 'x-robots-tag', 'noindex')

  return file.content
}

function safeNext(value: unknown, fallback: string) {
  return typeof value === 'string' && /^\/(?!\/)[^\s\\]*$/.test(value) ? value : fallback
}

function withError(path: string, value: string) {
  const [base, hash] = path.split('#')
  const separator = base.includes('?') ? '&' : '?'
  return `${base}${separator}error=${value}${hash ? `#${hash}` : ''}`
}

async function allowAttempt(sid: string, ip: string) {
  try {
    const key = `unlock:${sid}:${ip}`
    const count = await useRedis().incr(key)
    if (count === 1) await useRedis().expire(key, 600)
    return count <= UNLOCK_ATTEMPTS
  } catch {
    // Redis 不可用时放行，避免锁死项目访问
    return true
  }
}

export async function unlockProject(event: H3Event, sid: string) {
  const body = await readBody<Record<string, unknown>>(event)
  const password = typeof body?.password === 'string' ? body.password : ''

  const [rows] = await useDb().query<SiteProjectRow[]>(
    `SELECT p.\`sid\`, p.\`owner_bits_id\`, p.\`name\`, p.\`slug\`, p.\`visibility\`, p.\`enabled\`, p.\`password_hash\`, a.\`username\`
     FROM \`projects\` p JOIN \`accounts\` a ON a.\`bits_id\` = p.\`owner_bits_id\`
     WHERE p.\`sid\` = ? LIMIT 1`,
    [sid]
  )
  const project = rows[0]
  if (!project) return notFound(event)

  const fallback = `/${encodeURIComponent(project.username)}/${encodeURIComponent(project.slug)}/`
  const next = safeNext(body?.next, fallback)

  if (project.visibility !== 'password' || !project.password_hash) {
    return sendRedirect(event, next, 303)
  }
  if (!password || !project.enabled) return sendRedirect(event, withError(next, '1'), 303)

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (!(await allowAttempt(project.sid, ip))) return sendRedirect(event, withError(next, '1'), 303)
  if (!verifyPassword(password, project.password_hash)) return sendRedirect(event, withError(next, '1'), 303)

  const token = await new SignJWT({ sid: project.sid, kind: 'unlock' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret())

  setCookie(event, unlockCookie(project.sid), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: UNLOCK_MAX_AGE
  })

  return sendRedirect(event, next, 303)
}
