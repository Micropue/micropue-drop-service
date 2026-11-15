import { apiError, defineApiHandler, parsePageQuery } from '../../../utils/api'
import { requireApi } from '../../../utils/api-keys'
import { listApiProjects } from '../../../utils/api-projects'

export default defineApiHandler(async event => {
  const { user } = await requireApi(event, ['projects:read'], 'read')
  const { page, perPage } = parsePageQuery(event)
  const query = getQuery(event)
  const q = typeof query.q === 'string' ? query.q : ''
  const sort = typeof query.sort === 'string' ? query.sort : 'updated_desc'
  if (!['updated_desc', 'created_desc', 'name_asc'].includes(sort)) {
    throw apiError(422, 'validation_failed', 'Validation failed', 'sort must be updated_desc, created_desc or name_asc.')
  }

  return listApiProjects(user, { page, perPage, q, sort })
})
