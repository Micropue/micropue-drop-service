import { parseProjectInput, updateProject } from '../../utils/projects'

export default defineEventHandler(async event => {
  const sid = getRouterParam(event, 'sid') || ''
  if (!sid) throw createError({ statusCode: 400, statusMessage: 'Missing project id.' })

  const body = await readBody(event)
  const input = parseProjectInput(body)
  return { project: await updateProject(event, sid, input) }
})
