import mysql from 'mysql2/promise'
import { ensureSchema } from '../server/utils/schema.ts'

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 2,
  charset: 'UTF8MB4_UNICODE_CI',
  timezone: '+08:00'
})

try {
  const result = await ensureSchema(pool)
  console.log(`[db:migrate] schema is ready: ${result.version}`)
} catch (err) {
  console.error('[db:migrate] failed:', err instanceof Error ? err.message : err)
  process.exitCode = 1
} finally {
  await pool.end()
}
