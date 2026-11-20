import { normalizeBaseUrl, sitemapIndexXml } from '../utils/seo'

export default defineEventHandler(event => {
  const config = useRuntimeConfig(event)
  const siteUrl = normalizeBaseUrl(String(config.public.siteUrl))
  const contentUrl = normalizeBaseUrl(String(config.public.contentUrl || siteUrl))

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600')

  return sitemapIndexXml([
    { url: `${siteUrl}/sitemap-main.xml` },
    { url: `${contentUrl}/sitemap-content.xml` }
  ])
})
