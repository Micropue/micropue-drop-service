import type { RowDataPacket } from 'mysql2/promise'
import { defineApiHandler } from '../../utils/api'
import { requireApi } from '../../utils/api-keys'
import { useDb } from '../../utils/db'

export default defineApiHandler(async event => {
  const { user } = await requireApi(event, ['projects:read'], 'read')

  const [projectRows] = await useDb().query<RowDataPacket[]>(
    `SELECT COUNT(DISTINCT p.\`sid\`) AS \`count\`,
            COALESCE(SUM(CASE WHEN f.\`content\` IS NULL THEN 0 ELSE OCTET_LENGTH(f.\`content\`) END), 0) AS \`bytes\`
     FROM \`projects\` p
     LEFT JOIN \`project_files\` f ON f.\`project_sid\` = p.\`sid\`
     WHERE p.\`owner_bits_id\` = ?`,
    [user.bitsId]
  )
  const [deploymentRows] = await useDb().query<RowDataPacket[]>(
    `SELECT COUNT(*) AS \`count\`
     FROM \`project_deployments\` d
     JOIN \`projects\` p ON p.\`sid\` = d.\`project_sid\`
     WHERE p.\`owner_bits_id\` = ? AND d.\`created_at\` >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
    [user.bitsId]
  )
  const [lastRows] = await useDb().query<RowDataPacket[]>(
    `SELECT MAX(d.\`created_at\`) AS \`last\`
     FROM \`project_deployments\` d
     JOIN \`projects\` p ON p.\`sid\` = d.\`project_sid\`
     WHERE p.\`owner_bits_id\` = ?`,
    [user.bitsId]
  )

  const last = lastRows[0]?.last
  return {
    projects: { used: Number(projectRows[0]?.count ?? 0), limit: 100 },
    storageBytes: Number(projectRows[0]?.bytes ?? 0),
    deploymentsThisMonth: Number(deploymentRows[0]?.count ?? 0),
    lastDeploymentAt: last ? new Date(last as Date | string).toISOString() : null
  }
})
