import mysql, { type RowDataPacket } from 'mysql2/promise'

// DROP 本地账户表：只保存 BITS 身份的映射，不存密码，也不允许在 DROP 修改资料
const ACCOUNTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS \`accounts\` (
  \`bits_id\` VARCHAR(64) NOT NULL COMMENT 'BITS userinfo.sub',
  \`email\` VARCHAR(254) NOT NULL DEFAULT '' COMMENT 'BITS 邮箱（read:email）',
  \`username\` VARCHAR(254) NOT NULL DEFAULT '' COMMENT 'BITS 用户名',
  \`nickname\` VARCHAR(64) NOT NULL DEFAULT '' COMMENT 'BITS 昵称',
  \`avatar_url\` VARCHAR(512) NOT NULL DEFAULT '' COMMENT 'BITS 头像',
  \`profile\` VARCHAR(512) NOT NULL DEFAULT '' COMMENT 'BITS 个人主页',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '首次登录时间',
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '资料同步时间',
  \`last_login_at\` DATETIME NULL COMMENT '最近登录时间',
  PRIMARY KEY (\`bits_id\`),
  KEY \`idx_accounts_username\` (\`username\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='DROP 本地账户表'
`

// 项目：只存元数据；文件内容全部在 project_files，不落磁盘
const PROJECTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS \`projects\` (
  \`sid\` CHAR(36) NOT NULL COMMENT '项目UUID',
  \`owner_bits_id\` VARCHAR(64) NOT NULL COMMENT '所有者 BITS userinfo.sub',
  \`slug\` VARCHAR(40) NOT NULL COMMENT '项目地址名（用户内唯一）',
  \`name\` VARCHAR(80) NOT NULL COMMENT '项目名称',
  \`visibility\` ENUM('public','private','password') NOT NULL DEFAULT 'private' COMMENT '公开/仅自己/密码',
  \`enabled\` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '站点开关：关闭后不对外服务',
  \`password_hash\` VARCHAR(255) NULL COMMENT '访问密码哈希（visibility=password 时存在）',
  \`folders\` JSON NOT NULL DEFAULT (JSON_ARRAY()) COMMENT '显式文件夹路径列表（文件父目录自动补齐）',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`sid\`),
  UNIQUE KEY \`uk_projects_owner_slug\` (\`owner_bits_id\`, \`slug\`),
  KEY \`idx_projects_owner\` (\`owner_bits_id\`, \`updated_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='DROP 项目表'
`

const PROJECT_FILES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS \`project_files\` (
  \`sid\` CHAR(36) NOT NULL COMMENT '文件UUID',
  \`project_sid\` CHAR(36) NOT NULL COMMENT '所属项目UUID',
  \`name\` VARCHAR(120) NOT NULL COMMENT '文件名（含 .html/.css/.js）',
  \`language\` ENUM('html','css','js') NOT NULL COMMENT '文件类型',
  \`content\` MEDIUMTEXT NOT NULL COMMENT '文件内容（存数据库，不写磁盘）',
  \`sort_order\` INT NOT NULL DEFAULT 0 COMMENT '文件列表排序',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`sid\`),
  UNIQUE KEY \`uk_project_files_name\` (\`project_sid\`, \`name\`),
  KEY \`idx_project_files_project\` (\`project_sid\`, \`sort_order\`),
  CONSTRAINT \`fk_project_files_project\` FOREIGN KEY (\`project_sid\`) REFERENCES \`projects\` (\`sid\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='DROP 项目文件表'
`

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

export async function ensureSchema() {
  await pool.query(ACCOUNTS_TABLE_SQL)
  await pool.query(PROJECTS_TABLE_SQL)
  await pool.query(PROJECT_FILES_TABLE_SQL)

  // 旧项目表补 folders / enabled 列
  const [folderColumns] = await pool.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME IN ('folders', 'enabled')`
  )
  const columns = new Set(folderColumns.map(row => String(row.COLUMN_NAME)))
  if (!columns.has('folders')) {
    await pool.query("ALTER TABLE `projects` ADD COLUMN `folders` JSON NOT NULL DEFAULT (JSON_ARRAY()) AFTER `password_hash`")
  }
  if (!columns.has('enabled')) {
    await pool.query("ALTER TABLE `projects` ADD COLUMN `enabled` TINYINT(1) NOT NULL DEFAULT 1 AFTER `visibility`")
  }
}
