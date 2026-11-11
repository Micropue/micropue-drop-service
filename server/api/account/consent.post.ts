import { requireUser } from '../../utils/projects'
import { useDb } from '../../utils/db'

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  await useDb().query(
    'UPDATE `accounts` SET `privacy_accepted_at` = NOW() WHERE `bits_id` = ?',
    [user.bitsId]
  )
  return { acceptedAt: new Date().toISOString() }
})
