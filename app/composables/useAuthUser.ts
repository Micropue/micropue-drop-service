export interface AuthUser {
  bitsId: string
  email: string
  username: string
  nickname: string
  avatarUrl: string
  profile: string
  createdAt: string
  lastLoginAt: string | null
}

// 全局登录态：布局初始化（SSR 友好），登录/登出后由页面刷新
export function useAuthUser() {
  const user = useState<AuthUser | null>('auth-user', () => null)

  async function refresh() {
    try {
      const res = await $fetch<{ user: AuthUser | null }>('/api/auth/me')
      user.value = res.user
    } catch {
      user.value = null
    }
  }

  return { user, refresh }
}
