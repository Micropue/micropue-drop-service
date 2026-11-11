import { contentHome, contentNotFound, isContentRequest, serveProject } from '../utils/site'

// 内容域（dropcontent.*）只提供项目文件，主站的所有页面和 API 都不在这里出现
export default defineEventHandler(async event => {
  if (!isContentRequest(event)) return

  const pathname = getRequestURL(event).pathname
  // 密码解锁接口必须在内容域可用，解锁 Cookie 才会签在内容域
  if (pathname.startsWith('/api/unlock/')) return

  const segments = pathname.split('/').filter(Boolean).map(segment => {
    try {
      return decodeURIComponent(segment)
    } catch {
      return ''
    }
  })
  if (segments.length === 0) return contentHome(event)
  if (segments.length < 2 || segments.some(segment => !segment)) return contentNotFound(event)

  const [username, slug, ...rest] = segments
  return serveProject(event, username, slug, rest.join('/'))
})
