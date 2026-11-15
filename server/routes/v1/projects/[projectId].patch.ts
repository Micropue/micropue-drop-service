import { defineApiHandler, readApiBody } from '../../../utils/api'
import { requireApi } from '../../../utils/api-keys'
import { runIdempotent } from '../../../utils/api-idempotency'
import { patchApiProject } from '../../../utils/api-projects'

export default defineApiHandler(async event => {
  const context = await requireApi(event, ['projects:write'], 'write')
  const projectId = getRouterParam(event, 'projectId') || ''
  const body = await readApiBody(event)
  return runIdempotent(event, context, body, () =>
    patchApiProject(event, context.user, projectId, body)
  )
})
