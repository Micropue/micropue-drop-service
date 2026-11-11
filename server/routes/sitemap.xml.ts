import type { RowDataPacket } from 'mysql2/promise'
import { useDb } from '../utils/db'

interface SitemapEntry {
  url: string
  lastmod: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}

const XML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }
const escapeXml = (value: string) => value.replace(/[&<>"']/g, char => XML_ESCAPES[char])

// sitemap.xml：首页 + 已启用且公开的项目
export default defineEventHandler(async event => {
  const base = String(useRuntimeConfig(event).public.siteUrl).replace(/\/+$/, '')
  const contentBase = String(useRuntimeConfig(event).public.contentUrl || base).replace(/\/+$/, '')
  const today = new Date().toISOString().slice(0, 10)

  const entries: SitemapEntry[] = [
    { url: `${base}/`, lastmod: today, changefreq: 'weekly', priority: 1 },
    { url: `${base}/privacy`, lastmod: today, changefreq: 'yearly', priority: 0.3 }
  ]

  try {
    const [rows] = await useDb().query<RowDataPacket[]>(
      `SELECT a.\`username\`, p.\`slug\`, p.\`updated_at\`
       FROM \`projects\` p JOIN \`accounts\` a ON a.\`bits_id\` = p.\`owner_bits_id\`
       WHERE p.\`visibility\` = 'public' AND p.\`enabled\` = 1
       ORDER BY p.\`updated_at\` DESC LIMIT 5000`
    )
    for (const row of rows) {
      entries.push({
        url: `${contentBase}/${encodeURIComponent(String(row.username))}/${encodeURIComponent(String(row.slug))}/`,
        lastmod: new Date(row.updated_at as Date).toISOString().slice(0, 10),
        changefreq: 'weekly',
        priority: 0.7
      })
    }
  } catch (err) {
    console.warn('[sitemap] project list failed', err)
  }

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`).join('\n')}
</urlset>
`
})
