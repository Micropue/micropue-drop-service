import { clearDropSession } from '../../utils/auth'

export default defineEventHandler(event => {
  clearDropSession(event)
  return { ok: true }
})
