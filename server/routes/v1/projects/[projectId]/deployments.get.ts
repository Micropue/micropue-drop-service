import { defineApiHandler, parsePageQuery } from '../../../../utils/api'
import { requireApi } from '../../../../utils/api-keys'
import { listApiDeployments } from '../../../../utils/api-projects'

export default defineApiHandler(async event => {
  const { user } = await requireApi(event, ['projects:read'], 'read')
  const projectId = getRouterParam(event, 'projectId') || ''
  const { page, perPage } = parsePageQuery(event)
  return listApiDeployments(user, projectId, page, perPage)
})
