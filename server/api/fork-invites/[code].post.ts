import { acceptFork } from '../../utils/project-forks'

export default defineEventHandler(async event => {
  const code = getRouterParam(event, 'code') || ''
  const body = await readBody(event)

  return await acceptFork(event, code, body?.slug)
})
