import { beforeEach, describe, expect, it, vi } from 'vitest'

const invokeMock = vi.fn()
const sendNotificationMock = vi.fn()
let platformType = 'macos'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock
}))

vi.mock('@tauri-apps/plugin-notification', () => ({
  isPermissionGranted: vi.fn(async () => true),
  requestPermission: vi.fn(async () => 'granted'),
  sendNotification: sendNotificationMock
}))

vi.mock('@tauri-apps/plugin-os', () => ({
  type: () => platformType
}))

describe('clientNotifications', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    vi.resetModules()
    invokeMock.mockReset()
    sendNotificationMock.mockReset()
    platformType = 'macos'
    storage.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) || null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear()
    })
  })

  it('pushes configurable client notifications and updates app badge count', async () => {
    const { clientNotifications, clientNotificationUnreadCount, pushClientNotification } = await import(
      '@/services/clientNotifications'
    )

    await pushClientNotification({
      id: 'alert-notification-1',
      source: 'alerts',
      level: 'critical',
      title: '严重告警',
      body: 'CPU 超过阈值',
      service: 'darwin',
      native: true
    })

    expect(clientNotifications.value).toHaveLength(1)
    expect(clientNotifications.value[0]).toMatchObject({
      id: 'alert-notification-1',
      source: 'alerts',
      level: 'critical',
      title: '严重告警'
    })
    expect(clientNotificationUnreadCount.value).toBe(1)
    expect(invokeMock).toHaveBeenLastCalledWith('set_badge_count', { count: 1 })
    expect(sendNotificationMock).toHaveBeenCalledWith({ title: '严重告警', body: 'CPU 超过阈值' })
  })

  it('hides transient popups without clearing unread badge state', async () => {
    const { clientNotifications, clientNotificationUnreadCount, hideClientNotification, pushClientNotification } =
      await import('@/services/clientNotifications')

    await pushClientNotification({ id: 'alert-notification-2', title: '警告告警', body: '内存超过阈值' })
    hideClientNotification('alert-notification-2')

    expect(clientNotifications.value).toHaveLength(0)
    expect(clientNotificationUnreadCount.value).toBe(1)
  })

  it('dismisses notifications and clears badge state for that message', async () => {
    const { clientNotifications, clientNotificationUnreadCount, dismissClientNotification, pushClientNotification } =
      await import('@/services/clientNotifications')

    await pushClientNotification({ id: 'alert-notification-3', title: '提示告警', body: 'QPS 超过阈值' })
    await dismissClientNotification('alert-notification-3')

    expect(clientNotifications.value).toHaveLength(0)
    expect(clientNotificationUnreadCount.value).toBe(0)
    expect(invokeMock).toHaveBeenLastCalledWith('set_badge_count', { count: null })
  })

  it('keeps the in-app unread badge on Windows without calling unsupported app badge APIs', async () => {
    platformType = 'windows'
    const { clientNotificationUnreadCount, pushClientNotification } = await import('@/services/clientNotifications')

    await pushClientNotification({ id: 'alert-notification-windows', title: 'Windows 预览', body: '角标降级' })

    expect(clientNotificationUnreadCount.value).toBe(1)
    expect(invokeMock).not.toHaveBeenCalled()
  })
})
