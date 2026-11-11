import { getProject } from '../../utils/projects'

export default defineEventHandler(async event => {
  const sid = getRouterParam(event, 'sid') || ''
  if (!sid) throw createError({ statusCode: 400, statusMessage: 'Missing project id.' })
  return { project: await getProject(event, sid) }
})
