import { defineApiHandler, setRevisionHeaders } from '../../../utils/api'
import { requireApi } from '../../../utils/api-keys'
import { getApiProject } from '../../../utils/api-projects'

export default defineApiHandler(async event => {
  const { user } = await requireApi(event, ['projects:read'], 'read')
  const projectId = getRouterParam(event, 'projectId') || ''
  const project = await getApiProject(user, projectId)
  setRevisionHeaders(event, project.revision)
  return project
})
