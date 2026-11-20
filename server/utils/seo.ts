export const SEO_CONTENT_UPDATED_AT = '2026-11-21'
export const SEO_CONTENT_UPDATED_ISO = '2026-11-21T00:05:01+08:00'

export interface SitemapEntry {
  url: string
  lastmod: string
}

export interface SitemapReference {
  url: string
}

export interface ContentSitemapSource {
  username: string
  name: string
  slug: string
  lastmod: Date | string | null
}

export const STATIC_SITEMAP_ENTRIES: SitemapEntry[] = [
  { url: '/', lastmod: '2026-11-17T23:15:31+08:00' },
  { url: '/developers', lastmod: '2026-11-17T23:15:31+08:00' },
  { url: '/privacy', lastmod: '2026-11-13T21:57:28+08:00' },
  { url: '/llms.txt', lastmod: SEO_CONTENT_UPDATED_ISO },
  { url: '/llms-full.txt', lastmod: SEO_CONTENT_UPDATED_ISO }
]

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;'
}

const TEMPORARY_SLUG = /(?:^|[-_])(?:test|testing|tmp|temp|draft|untitled|sample)(?:[-_]|$)/i
const GENERATED_SLUG = /^site-[a-z0-9]{6}$/i
const AUTOMATED_NEWS_SLUG = /^(?:gh-new|news)-\d{4}(?:-(?:\d{2}|bbc|final))?$/i
const TEMPORARY_PROJECT_NAME = /(?:^|[\s_-])(?:test|testing|tmp|temp|draft|untitled|sample)(?:$|[\s_-])/i
const TEMPORARY_CHINESE_PROJECT_NAME = /(?:测试|临时|草稿|未命名|示例)(?:页面|站点|项目|网站)?$/i
const GENERIC_PROJECT_NAME = /^(?:test|testing|tmp|temp|draft|untitled|sample|update test|new project|document|测试|临时|草稿|未命名|示例)$/i
const MYSQL_DATETIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/

export function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '')
}

export function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, character => XML_ESCAPES[character])
}

export function sitemapXml(entries: SitemapEntry[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${escapeXml(entry.lastmod)}</lastmod>
  </url>`).join('\n')}
</urlset>
`
}

export function sitemapIndexXml(sitemaps: SitemapReference[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${escapeXml(sitemap.url)}</loc>
  </sitemap>`).join('\n')}
</sitemapindex>
`
}

export function isTemporarySitemapProject(slug: string, name: string) {
  return GENERATED_SLUG.test(slug)
    || AUTOMATED_NEWS_SLUG.test(slug)
    || TEMPORARY_SLUG.test(slug)
    || TEMPORARY_PROJECT_NAME.test(name.trim())
    || TEMPORARY_CHINESE_PROJECT_NAME.test(name.trim())
    || GENERIC_PROJECT_NAME.test(name.trim())
}

export function normalizeSitemapLastmod(value: Date | string | null | undefined) {
  if (!value) return null

  let raw = value instanceof Date ? value.toISOString() : String(value).trim()
  if (MYSQL_DATETIME.test(raw)) raw = `${raw.replace(' ', 'T')}+08:00`

  const timestamp = Date.parse(raw)
  if (Number.isNaN(timestamp)) return null
  return new Date(timestamp).toISOString()
}

export function uniqueSitemapEntries(entries: SitemapEntry[]) {
  const unique = new Map<string, SitemapEntry>()

  for (const entry of entries) {
    const current = unique.get(entry.url)
    if (!current || Date.parse(entry.lastmod) > Date.parse(current.lastmod)) {
      unique.set(entry.url, entry)
    }
  }

  return [...unique.values()]
}

export function contentSitemapEntries(projects: ContentSitemapSource[], contentUrlValue: string) {
  const contentUrl = normalizeBaseUrl(contentUrlValue)
  const entries: SitemapEntry[] = []

  for (const project of projects) {
    if (!project.username.trim() || !project.slug.trim()) continue
    if (isTemporarySitemapProject(project.slug, project.name)) continue

    const lastmod = normalizeSitemapLastmod(project.lastmod)
    if (!lastmod) continue

    entries.push({
      url: `${contentUrl}/${encodeURIComponent(project.username)}/${encodeURIComponent(project.slug)}/`,
      lastmod
    })
  }

  return uniqueSitemapEntries(entries)
    .sort((left, right) => Date.parse(right.lastmod) - Date.parse(left.lastmod))
}
