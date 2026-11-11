import { createProject, parseProjectInput } from '../../utils/projects'

export default defineEventHandler(async event => {
  const body = await readBody(event)
  const input = parseProjectInput(body)
  return { project: await createProject(event, input) }
})
