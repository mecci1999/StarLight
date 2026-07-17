import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  canAccessMetricsDatasetScope,
  canUseMetricsSourceKind,
  clearStoredAuthSession,
  getStoredAuthTokens,
  getStoredUserInfo,
  persistAuthTokens,
  persistStoredUserInfo,
  resolveAuthLandingRoute,
  USER_INFO_CHANGED_EVENT
} from '../authSession'

vi.mock('@tauri-apps/api/event', () => ({
  emit: vi.fn()
}))

const storage = new Map<string, string>()
const localStorageMock = {
  getItem: vi.fn((key: string) => (storage.has(key) ? storage.get(key)! : null)),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, String(value))
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key)
  }),
  clear: vi.fn(() => {
    storage.clear()
  })
}

const documentMock = { cookie: '' }
const addEventListenerSpy = vi.fn()
const removeEventListenerSpy = vi.fn()
const dispatchEventSpy = vi.fn()

beforeEach(() => {
  vi.stubGlobal('localStorage', localStorageMock)
  vi.stubGlobal('document', documentMock)
  vi.stubGlobal('window', {
    addEventListener: addEventListenerSpy,
    removeEventListener: removeEventListenerSpy,
    dispatchEvent: dispatchEventSpy
  })
  storage.clear()
  documentMock.cookie = ''
  dispatchEventSpy.mockClear()
})

describe('authSession', () => {
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('persists and clears full auth session state', () => {
    persistAuthTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    persistStoredUserInfo({ userId: 'u-1', isAdmin: true, email: 'admin@example.com' })

    expect(getStoredAuthTokens()).toEqual({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    expect(getStoredUserInfo()).toMatchObject({ userId: 'u-1', isAdmin: true })

    clearStoredAuthSession()

    expect(getStoredAuthTokens()).toEqual({ accessToken: null, refreshToken: '' })
    expect(getStoredUserInfo()).toBeNull()
  })

  it('broadcasts user info changes when local session user is persisted', () => {
    persistStoredUserInfo({ userId: 'u-1', avatar: '/uploads/avatar.webp' })

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: USER_INFO_CHANGED_EVENT,
        detail: { userId: 'u-1', avatar: '/uploads/avatar.webp' }
      })
    )
  })

  it('routes admins and non-admins to the correct landing pages', () => {
    expect(resolveAuthLandingRoute(true, { isAdmin: true })).toBe('home')
    expect(resolveAuthLandingRoute(false, { isAdmin: true })).toBe('mobile-overview-v2')

    expect(resolveAuthLandingRoute(true, { isAdmin: false, isOnboardingCompleted: false })).toBe('onboarding')
    expect(resolveAuthLandingRoute(true, { isAdmin: false, isOnboardingCompleted: true })).toBe('home')
    expect(resolveAuthLandingRoute(false, { isAdmin: false, isOnboardingCompleted: false })).toBe(
      'mobile-onboarding-notice'
    )
  })

  it('does not trust local onboarding completion without user state', () => {
    localStorage.setItem('onboarding_completed', 'true')

    expect(resolveAuthLandingRoute(true, { isAdmin: false })).toBe('onboarding')
    expect(resolveAuthLandingRoute(false, { isAdmin: false })).toBe('mobile-onboarding-notice')
  })

  it('gates system scope and darwin source kind by admin role', () => {
    expect(canAccessMetricsDatasetScope('tenant', { isAdmin: false })).toBe(true)
    expect(canAccessMetricsDatasetScope('system', { isAdmin: false })).toBe(false)
    expect(canAccessMetricsDatasetScope('system', { isAdmin: true })).toBe(true)

    expect(canUseMetricsSourceKind('sdk', { isAdmin: false })).toBe(true)
    expect(canUseMetricsSourceKind('auto', { isAdmin: false })).toBe(true)
    expect(canUseMetricsSourceKind('darwin-event', { isAdmin: false })).toBe(false)
    expect(canUseMetricsSourceKind('darwin-event', { isAdmin: true })).toBe(true)
  })
})
