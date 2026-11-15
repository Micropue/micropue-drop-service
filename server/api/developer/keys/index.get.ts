import { listApiKeys } from '../../../utils/api-keys'
import { requireDeveloper } from '../../../utils/developer-portal'

export default defineEventHandler(async event => {
  const user = await requireDeveloper(event)
  return { keys: await listApiKeys(user) }
})
