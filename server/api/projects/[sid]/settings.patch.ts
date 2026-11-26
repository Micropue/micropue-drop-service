import { parseProjectSettingsInput, updateProjectSettings } from '../../../utils/projects'

export default defineEventHandler(async event => {
  const sid = getRouterParam(event, 'sid') || ''
  if (!sid) throw createError({ statusCode: 400, statusMessage: 'Missing project id.' })

  const body = await readBody(event)
  const input = parseProjectSettingsInput(body)
  return { project: await updateProjectSettings(event, sid, input) }
})
