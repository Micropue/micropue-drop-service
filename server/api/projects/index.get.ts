import { listProjects } from '../../utils/projects'

export default defineEventHandler(async event => {
  const query = getQuery(event)
  return listProjects(event, {
    page: Number(query.page) || 1,
    q: typeof query.q === 'string' ? query.q : '',
    sort: typeof query.sort === 'string' ? query.sort : 'updated'
  })
})
