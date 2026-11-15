import { defineApiHandler, readApiBody } from '../../../utils/api'
import { requireApi } from '../../../utils/api-keys'
import { runIdempotent } from '../../../utils/api-idempotency'
import { createApiProject } from '../../../utils/api-projects'

export default defineApiHandler(async event => {
  const context = await requireApi(event, ['projects:write', 'deployments:write'], 'write')
  const body = await readApiBody(event)
  return runIdempotent(event, context, body, () =>
    createApiProject(event, context.user, body, context.key.id)
  )
})
