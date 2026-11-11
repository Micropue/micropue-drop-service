import { getSessionUser } from '../../utils/auth'

export default defineEventHandler(async event => {
  return { user: await getSessionUser(event) }
})
