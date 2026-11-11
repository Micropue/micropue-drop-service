import { randomBytes } from 'node:crypto'
import { getBitsOAuthConfig, setOAuthState } from '../../utils/auth'

// 登录入口：直接跳转 BITS OAuth 授权页
export default defineEventHandler(event => {
  const config = getBitsOAuthConfig()
  const state = randomBytes(16).toString('hex')

  setOAuthState(event, state)

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'read:user read:email',
    state
  })

  return sendRedirect(event, `${config.origin}/oauth/authorize?${params.toString()}`)
})
