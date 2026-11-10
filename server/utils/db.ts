import mysql from 'mysql2/promise'

// MySQL 连接池：用户信息来自 BITS，DROP 只存部署相关的项目数据
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'UTF8MB4_UNICODE_CI',
  timezone: '+08:00'
})

export function useDb() {
  return pool
}
