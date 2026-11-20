import { buildLlmsDocuments } from '../utils/llms'
import { SEO_CONTENT_UPDATED_ISO } from '../utils/seo'

export default defineEventHandler(event => {
  const config = useRuntimeConfig(event)
  const { short } = buildLlmsDocuments(String(config.public.siteUrl), String(config.public.contentUrl))

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600')
  setHeader(event, 'last-modified', new Date(SEO_CONTENT_UPDATED_ISO).toUTCString())

  return short
})
