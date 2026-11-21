import { getForkInvite } from '../../utils/project-forks'

export default defineEventHandler(async event => {
  const code = getRouterParam(event, 'code') || ''

  return { invitation: await getForkInvite(event, code) }
})
