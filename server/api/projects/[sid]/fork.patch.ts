import { setForkEnabled } from '../../../utils/project-forks'

export default defineEventHandler(async event => {
  const sid = getRouterParam(event, 'sid') || ''
  if (!sid) throw createError({ statusCode: 400, statusMessage: 'Missing project id.' })

  const body = await readBody(event)
  return { fork: await setForkEnabled(event, sid, body?.enabled) }
})
