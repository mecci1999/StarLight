import { emit as emitTauri } from '@tauri-apps/api/event'
import { getCookie, removeCookie, setCookie } from '@/utils/Cookie'
import type { UserInfoType } from '@/types/userInfo'
import type { QuerySpec } from '@/domains/metrics/queryModel'

export type MetricsDatasetScope = 'tenant' | 'system'

// The server is the source of truth: access JWTs expire after six hours and
// refresh JWTs expire after three days. Keeping the access cookie longer made
// an expired session look valid after an application restart.
const ACCESS_TOKEN_EXPIRE_DAYS = 0.25
const REFRESH_TOKEN_EXPIRE_DAYS = 3

export type AuthTokens = {
  accessToken?: string | null
  refreshToken?: string | null
}

export const USER_INFO_CHANGED_EVENT = 'starlight:user-info-changed'

export function getStoredAuthTokens(): AuthTokens {
  return {
    accessToken: localStorage.getItem('ACCESS_TOKEN') || getCookie('ACCESS_TOKEN'),
    refreshToken: localStorage.getItem('REFRESH_TOKEN') || getCookie('REFRESH_TOKEN')
  }
}

export function persistAuthTokens(tokens: AuthTokens) {
  const { accessToken, refreshToken } = tokens

  if (accessToken) {
    localStorage.setItem('ACCESS_TOKEN', accessToken)
    setCookie('ACCESS_TOKEN', accessToken, ACCESS_TOKEN_EXPIRE_DAYS)
  }

  if (refreshToken) {
    localStorage.setItem('REFRESH_TOKEN', refreshToken)
    setCookie('REFRESH_TOKEN', refreshToken, REFRESH_TOKEN_EXPIRE_DAYS)
  }
}

export function getStoredUserInfo(): Partial<UserInfoType> | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function persistStoredUserInfo(user: Partial<UserInfoType>) {
  localStorage.setItem('user', JSON.stringify(user))
  if (import.meta.env.DEV) {
    console.info('[AvatarSync][authSession:persistStoredUserInfo]', {
      userId: user.userId,
      avatar: user.avatar,
      hasWindow: typeof window !== 'undefined'
    })
  }
  window.dispatchEvent(new CustomEvent(USER_INFO_CHANGED_EVENT, { detail: user }))
}

export function clearStoredUserInfo() {
  localStorage.removeItem('user')
}

export function clearStoredAuthTokens() {
  removeCookie('ACCESS_TOKEN')
  removeCookie('REFRESH_TOKEN')
  localStorage.removeItem('ACCESS_TOKEN')
  localStorage.removeItem('REFRESH_TOKEN')
}

export function clearStoredAuthSession() {
  clearStoredAuthTokens()
  clearStoredUserInfo()
}

export function resolveAuthLandingRoute(isDesktop: boolean, user?: Partial<UserInfoType> | null) {
  const isAdmin = Boolean(user?.isAdmin)
  const isOnboardingCompleted = Boolean(user?.isOnboardingCompleted)

  if (isDesktop) {
    return isAdmin ? 'home' : isOnboardingCompleted ? 'home' : 'onboarding'
  }

  return isAdmin ? 'mobile-overview-v2' : isOnboardingCompleted ? 'mobile-overview-v2' : 'mobile-onboarding-notice'
}

export function getPreferredMetricsDatasetScope(user?: Partial<UserInfoType> | null): MetricsDatasetScope {
  const targetUser = user ?? getStoredUserInfo()
  return targetUser?.isAdmin ? 'system' : 'tenant'
}

export function getMetricsDatasetScopeLabel(user?: Partial<UserInfoType> | null) {
  return getPreferredMetricsDatasetScope(user) === 'system' ? 'Darwin 系统' : '用户接入'
}

export function canAccessMetricsDatasetScope(scope: MetricsDatasetScope, user?: Partial<UserInfoType> | null) {
  if (scope === 'tenant') return true
  return Boolean((user ?? getStoredUserInfo())?.isAdmin)
}

export function canUseMetricsSourceKind(
  sourceKind: NonNullable<QuerySpec['sourceKind']>,
  user?: Partial<UserInfoType> | null
) {
  if (sourceKind === 'auto' || sourceKind === 'sdk') return true
  return Boolean((user ?? getStoredUserInfo())?.isAdmin)
}

export async function syncAuthTokensToTauri(tokens?: AuthTokens) {
  const nextTokens = tokens || getStoredAuthTokens()
  if (nextTokens.accessToken || nextTokens.refreshToken) {
    await emitTauri('auth-token', nextTokens)
  }
}
