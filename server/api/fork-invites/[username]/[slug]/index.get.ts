import { getForkInvite } from '../../../../utils/project-forks'

export default defineEventHandler(async event => {
  const username = getRouterParam(event, 'username') || ''
  const slug = getRouterParam(event, 'slug') || ''
  const code = getQuery(event).code

  return { invitation: await getForkInvite(event, username, slug, code) }
})
