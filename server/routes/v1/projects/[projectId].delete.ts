import { defineApiHandler } from '../../../utils/api'
import { requireApi } from '../../../utils/api-keys'
import { runIdempotent } from '../../../utils/api-idempotency'
import { deleteApiProject } from '../../../utils/api-projects'

export default defineApiHandler(async event => {
  const context = await requireApi(event, ['projects:delete'], 'write')
  const projectId = getRouterParam(event, 'projectId') || ''
  return runIdempotent(event, context, {}, async () => {
    await deleteApiProject(event, context.user, projectId)
    return sendNoContent(event, 204)
  })
})
