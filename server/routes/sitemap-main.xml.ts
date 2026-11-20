import { normalizeBaseUrl, sitemapXml, STATIC_SITEMAP_ENTRIES } from '../utils/seo'

export default defineEventHandler(event => {
  const siteUrl = normalizeBaseUrl(String(useRuntimeConfig(event).public.siteUrl))
  const entries = STATIC_SITEMAP_ENTRIES.map(entry => ({
    url: `${siteUrl}${entry.url}`,
    lastmod: entry.lastmod
  }))

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600')

  return sitemapXml(entries)
})
