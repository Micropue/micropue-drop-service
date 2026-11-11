import { unlockProject } from '../../utils/site'

export default defineEventHandler(event => {
  const sid = getRouterParam(event, 'sid') || ''
  if (!sid) throw createError({ statusCode: 400, statusMessage: 'Missing project id.' })
  return unlockProject(event, sid)
})
