import { parsePageQuery } from '../../../utils/api'
import { listApiKeys, MAX_ACTIVE_KEYS } from '../../../utils/api-keys'
import { requireDeveloper } from '../../../utils/developer-portal'

export default defineEventHandler(async event => {
  const user = await requireDeveloper(event)
  const pagination = parsePageQuery(event, 5)
  const result = await listApiKeys(user, {
    page: pagination.page,
    perPage: Math.min(5, pagination.perPage)
  })

  return {
    ...result,
    maxActiveKeys: MAX_ACTIVE_KEYS
  }
})
