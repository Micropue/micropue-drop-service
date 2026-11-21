import { acceptFork } from '../../../../utils/project-forks'

export default defineEventHandler(async event => {
  const username = getRouterParam(event, 'username') || ''
  const slug = getRouterParam(event, 'slug') || ''
  const body = await readBody(event)

  return await acceptFork(event, username, slug, body?.code, body?.slug)
})
