import type { RowDataPacket } from 'mysql2/promise'
import { useDb } from '../utils/db'
import { contentSitemapEntries, normalizeBaseUrl, sitemapXml, type ContentSitemapSource } from '../utils/seo'
import { isContentRequest } from '../utils/site'

interface ContentProjectRow extends RowDataPacket, ContentSitemapSource {}

export default defineEventHandler(async event => {
  const config = useRuntimeConfig(event)
  const contentUrl = normalizeBaseUrl(String(config.public.contentUrl || config.public.siteUrl))

  if (!isContentRequest(event)) {
    return sendRedirect(event, `${contentUrl}/sitemap-content.xml`, 308)
  }

  let rows: ContentProjectRow[] = []
  try {
    const [result] = await useDb().query<ContentProjectRow[]>(
      `SELECT a.\`username\`, p.\`name\`, p.\`slug\`,
              COALESCE(
                (SELECT MAX(d.\`created_at\`) FROM \`project_deployments\` d
                 WHERE d.\`project_sid\` = p.\`sid\` AND d.\`status\` = 'live'),
                p.\`updated_at\`
              ) AS \`lastmod\`
       FROM \`projects\` p
       JOIN \`accounts\` a ON a.\`bits_id\` = p.\`owner_bits_id\`
       WHERE p.\`visibility\` = 'public'
         AND p.\`enabled\` = 1
         AND EXISTS (
           SELECT 1 FROM \`project_files\` f
           WHERE f.\`project_sid\` = p.\`sid\` AND f.\`name\` = 'index.html'
         )
       ORDER BY \`lastmod\` DESC
       LIMIT 5000`
    )
    rows = result
  } catch (err) {
    console.error('[sitemap-content] project list failed', err)
    setResponseStatus(event, 503)
    setHeader(event, 'content-type', 'text/plain; charset=utf-8')
    setHeader(event, 'cache-control', 'no-store')
    setHeader(event, 'retry-after', '300')
    return 'Sitemap temporarily unavailable.\n'
  }

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=600')

  return sitemapXml(contentSitemapEntries(rows, contentUrl))
})
