import { revokeApiKey } from '../../../utils/api-keys'
import { assertSameOrigin, requireDeveloper } from '../../../utils/developer-portal'

export default defineEventHandler(async event => {
  assertSameOrigin(event)
  const user = await requireDeveloper(event)
  const id = getRouterParam(event, 'id') || ''
  await revokeApiKey(user, id)
  return sendNoContent(event, 204)
})
