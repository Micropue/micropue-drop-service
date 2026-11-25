import { defineApiHandler } from '../../utils/api'
import { requireApi } from '../../utils/api-keys'
import { MAX_PROJECTS } from '../../utils/projects'

export default defineApiHandler(async event => {
  const { key, user } = await requireApi(event, [], 'read')
  return {
    account: {
      id: user.bitsId,
      username: user.username,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      profileUrl: /^https?:\/\//.test(user.profile)
        ? user.profile
        : `https://bits.micropue.com.cn/${encodeURIComponent(user.username)}`
    },
    key: {
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      scopes: key.scopes,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt
    },
    limits: {
      projects: MAX_PROJECTS,
      filesPerProject: 20,
      fileBytes: 524288,
      projectBytes: 1048576,
      foldersPerProject: 50
    }
  }
})
