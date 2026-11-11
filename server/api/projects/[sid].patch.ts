import { setProjectEnabled } from '../../utils/projects'

export default defineEventHandler(async event => {
  const sid = getRouterParam(event, 'sid') || ''
  if (!sid) throw createError({ statusCode: 400, statusMessage: 'Missing project id.' })

  const body = await readBody(event)
  return { project: await setProjectEnabled(event, sid, body?.enabled) }
})
