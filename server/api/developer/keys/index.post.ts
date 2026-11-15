import { createApiKey } from '../../../utils/api-keys'
import { assertSameOrigin, consumeKeyCreateLimit, requireDeveloper } from '../../../utils/developer-portal'

export default defineEventHandler(async event => {
  assertSameOrigin(event)
  const user = await requireDeveloper(event)
  await consumeKeyCreateLimit(event, user)

  const body = await readBody<Record<string, unknown>>(event)
  const result = await createApiKey(user, {
    name: typeof body?.name === 'string' ? body.name : '',
    scopes: body?.scopes,
    expiresInDays: body?.expiresInDays
  })

  setResponseStatus(event, 201)
  setResponseHeader(event, 'cache-control', 'no-store')
  return result
})
