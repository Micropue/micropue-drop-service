import { getForkSettingsForOwner } from '../../../utils/project-forks'

export default defineEventHandler(async event => {
  const sid = getRouterParam(event, 'sid') || ''
  if (!sid) throw createError({ statusCode: 400, statusMessage: 'Missing project id.' })
  return { fork: await getForkSettingsForOwner(event, sid) }
})
