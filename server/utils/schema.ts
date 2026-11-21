import { createHash } from 'node:crypto'
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise'

// 所有 schema 变更必须是可重复执行的：只新增表/列/索引，不删除、不重建已有数据。
export const SCHEMA_VERSION = '2026-11-21-fork-sharing-v2'
const SCHEMA_LOCK = 'drop:developer-platform-v1'

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
  \`privacy_accepted_at\` DATETIME NULL COMMENT '隐私政策同意时间',
  PRIMARY KEY (\`bits_id\`),
  KEY \`idx_accounts_username\` (\`username\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='DROP 本地账户表'
`

const PROJECTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS \`projects\` (
  \`sid\` CHAR(36) NOT NULL COMMENT '项目UUID',
  \`owner_bits_id\` VARCHAR(64) NOT NULL COMMENT '所有者 BITS userinfo.sub',
  \`slug\` VARCHAR(40) NOT NULL COMMENT '项目地址名（用户内唯一）',
  \`name\` VARCHAR(80) NOT NULL COMMENT '项目名称',
  \`visibility\` ENUM('public','password') NOT NULL DEFAULT 'public' COMMENT '公开/密码',
  \`enabled\` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '站点开关：关闭后不对外服务',
  \`revision\` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '项目版本号，每次成功变更递增',
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

const PROJECT_VISITS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS \`project_visits\` (
  \`project_sid\` CHAR(36) NOT NULL COMMENT '项目UUID',
  \`day\` DATE NOT NULL COMMENT '访问日期（本地时区）',
  \`visitor\` CHAR(32) NOT NULL COMMENT 'IP + User-Agent 的哈希，用于按天去重',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`project_sid\`, \`day\`, \`visitor\`),
  KEY \`idx_project_visits_day\` (\`day\`),
  CONSTRAINT \`fk_project_visits_project\` FOREIGN KEY (\`project_sid\`) REFERENCES \`projects\` (\`sid\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='DROP 项目访问统计表（仅保留本周）'
`

const API_KEYS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS \`api_keys\` (
  \`id\` CHAR(36) NOT NULL,
  \`owner_bits_id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(60) NOT NULL,
  \`prefix\` VARCHAR(24) NOT NULL,
  \`key_hash\` CHAR(64) NOT NULL,
  \`scopes\` JSON NOT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`last_used_at\` DATETIME NULL,
  \`expires_at\` DATETIME NULL COMMENT 'NULL 表示永不过期',
  \`revoked_at\` DATETIME NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_api_keys_prefix\` (\`prefix\`),
  KEY \`idx_api_keys_owner\` (\`owner_bits_id\`, \`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='DROP 开发者 API Key'
`

const PROJECT_DEPLOYMENTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS \`project_deployments\` (
  \`id\` CHAR(36) NOT NULL,
  \`project_sid\` CHAR(36) NOT NULL,
  \`revision\` INT UNSIGNED NOT NULL,
  \`source\` ENUM('web','api') NOT NULL,
  \`api_key_id\` CHAR(36) NULL,
  \`message\` VARCHAR(200) NULL,
  \`file_count\` INT UNSIGNED NOT NULL,
  \`total_bytes\` INT UNSIGNED NOT NULL,
  \`status\` ENUM('queued','building','live','failed') NOT NULL DEFAULT 'live',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_project_deployments_revision\` (\`project_sid\`, \`revision\`),
  KEY \`idx_project_deployments_project\` (\`project_sid\`, \`created_at\`),
  KEY \`idx_project_deployments_key\` (\`api_key_id\`),
  CONSTRAINT \`fk_project_deployments_project\`
    FOREIGN KEY (\`project_sid\`) REFERENCES \`projects\` (\`sid\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='DROP 项目部署记录'
`

const SCHEMA_MIGRATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
  \`name\` VARCHAR(255) NOT NULL,
  \`checksum\` CHAR(64) NOT NULL,
  \`applied_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='DROP 数据库迁移记录'
`

const DDL = [
  ACCOUNTS_TABLE_SQL,
  PROJECTS_TABLE_SQL,
  PROJECT_FILES_TABLE_SQL,
  PROJECT_VISITS_TABLE_SQL,
  API_KEYS_TABLE_SQL,
  PROJECT_DEPLOYMENTS_TABLE_SQL
]

const SCHEMA_CHECKSUM = createHash('sha256').update(DDL.join('\n')).digest('hex')

async function hasColumn(conn: PoolConnection, table: string, column: string) {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  )
  return rows.length > 0
}

async function addColumnIfMissing(
  conn: PoolConnection,
  table: string,
  column: string,
  definition: string
) {
  if (!(await hasColumn(conn, table, column))) {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`)
  }
}

async function addIndexIfMissing(
  conn: PoolConnection,
  table: string,
  index: string,
  definition: string
) {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, index]
  )
  if (!rows.length) {
    await conn.query(`ALTER TABLE \`${table}\` ADD ${definition}`)
  }
}

async function ensureCompatibilityColumns(conn: PoolConnection) {
  await addColumnIfMissing(
    conn,
    'accounts',
    'privacy_accepted_at',
    "`privacy_accepted_at` DATETIME NULL COMMENT '隐私政策同意时间' AFTER `last_login_at`"
  )

  await addColumnIfMissing(
    conn,
    'projects',
    'folders',
    "`folders` JSON NOT NULL DEFAULT (JSON_ARRAY()) AFTER `password_hash`"
  )
  await addColumnIfMissing(
    conn,
    'projects',
    'enabled',
    '`enabled` TINYINT(1) NOT NULL DEFAULT 1 AFTER `visibility`'
  )
  await addColumnIfMissing(
    conn,
    'projects',
    'revision',
    '`revision` INT UNSIGNED NOT NULL DEFAULT 1 AFTER `enabled`'
  )
  await addColumnIfMissing(
    conn,
    'projects',
    'fork_enabled',
    '`fork_enabled` TINYINT(1) NOT NULL DEFAULT 0 AFTER `folders`'
  )
  await addColumnIfMissing(
    conn,
    'projects',
    'fork_code',
    '`fork_code` VARCHAR(16) NULL AFTER `fork_enabled`'
  )
  await addIndexIfMissing(
    conn,
    'projects',
    'uk_projects_fork_code',
    'UNIQUE KEY `uk_projects_fork_code` (`fork_code`)'
  )

  // 兼容旧版本：把历史 private 项目转为 password，再由所有者补密码。
  // 这一步只在旧枚举仍存在时执行，不会重建表。
  const [visibilityColumns] = await conn.query<RowDataPacket[]>(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'visibility'`
  )
  const visibilityType = String(visibilityColumns[0]?.COLUMN_TYPE || '')
  if (visibilityType.includes("'private'")) {
    await conn.query("UPDATE `projects` SET `visibility` = 'password', `password_hash` = NULL WHERE `visibility` = 'private'")
    await conn.query("ALTER TABLE `projects` MODIFY COLUMN `visibility` ENUM('public','password') NOT NULL DEFAULT 'public' COMMENT '公开/密码保护'")
  }
}

/**
 * 幂等建表/补列。生产启动和 `npm run db:migrate` 都调用这一套逻辑。
 * 使用 MySQL 咨询锁，避免多个实例同时迁移。
 */
export async function ensureSchema(pool: Pool) {
  const conn = await pool.getConnection()
  let locked = false

  try {
    const [lockRows] = await conn.query<RowDataPacket[]>('SELECT GET_LOCK(?, 30) AS `locked`', [SCHEMA_LOCK])
    locked = Number(lockRows[0]?.locked) === 1
    if (!locked) {
      throw new Error('Could not acquire the database migration lock.')
    }

    await conn.query(SCHEMA_MIGRATIONS_TABLE_SQL)
    for (const ddl of DDL) await conn.query(ddl)
    await ensureCompatibilityColumns(conn)

    await conn.query(
      `INSERT INTO \`schema_migrations\` (\`name\`, \`checksum\`)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE \`checksum\` = VALUES(\`checksum\`)`,
      [SCHEMA_VERSION, SCHEMA_CHECKSUM]
    )

    return { version: SCHEMA_VERSION, checksum: SCHEMA_CHECKSUM }
  } finally {
    if (locked) {
      await conn.query('SELECT RELEASE_LOCK(?)', [SCHEMA_LOCK]).catch(() => {})
    }
    conn.release()
  }
}
