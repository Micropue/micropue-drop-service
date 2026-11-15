import { defineApiHandler, readApiBody } from '../../../../utils/api'
import { requireApi } from '../../../../utils/api-keys'
import { runIdempotent } from '../../../../utils/api-idempotency'
import { deployApiProject } from '../../../../utils/api-projects'

export default defineApiHandler(async event => {
  const context = await requireApi(event, ['deployments:write'], 'deploy')
  const projectId = getRouterParam(event, 'projectId') || ''
  const body = await readApiBody(event)
  return runIdempotent(event, context, body, () =>
    deployApiProject(event, context.user, projectId, body, context.key.id)
  )
})
