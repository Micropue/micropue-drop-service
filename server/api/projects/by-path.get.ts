import type { RowDataPacket } from 'mysql2/promise'
import { useDb } from '../../utils/db'
import { getProject, requireUser } from '../../utils/projects'

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const username = typeof query.username === 'string' ? query.username.trim() : ''
  const slug = typeof query.slug === 'string' ? query.slug.trim().toLowerCase() : ''

  if (!username || !slug) {
    throw createError({ statusCode: 400, statusMessage: 'Project username and slug are required.' })
  }

  const user = await requireUser(event)
  if (!user.username || username.toLowerCase() !== user.username.toLowerCase()) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found.' })
  }

  const [rows] = await useDb().query<RowDataPacket[]>(
    'SELECT `sid` FROM `projects` WHERE `owner_bits_id` = ? AND `slug` = ? LIMIT 1',
    [user.bitsId, slug]
  )
  const sid = rows[0]?.sid ? String(rows[0].sid) : ''
  if (!sid) throw createError({ statusCode: 404, statusMessage: 'Project not found.' })

  return { project: await getProject(event, sid) }
})
