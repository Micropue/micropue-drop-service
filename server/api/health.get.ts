// 自检接口：确认 Nuxt 能连上 docker compose 里的 MySQL 与 Redis
export default defineEventHandler(async event => {
  const [mysql, redis] = await Promise.allSettled([
    useDb().query('SELECT 1'),
    useRedis().ping()
  ])

  const ok = mysql.status === 'fulfilled' && redis.status === 'fulfilled'
  if (!ok) setResponseStatus(event, 503)

  return {
    status: ok ? 'ok' : 'error',
    mysql: mysql.status === 'fulfilled' ? 'ok' : String(mysql.reason),
    redis: redis.status === 'fulfilled' ? 'ok' : String(redis.reason)
  }
})
