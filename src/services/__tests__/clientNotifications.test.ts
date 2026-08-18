import { beforeEach, describe, expect, it, vi } from 'vitest'

const invokeMock = vi.fn()
const sendNotificationMock = vi.fn()
const isPermissionGrantedMock = vi.fn()
const requestPermissionMock = vi.fn()
let platformType = 'macos'
let tauri = true

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
  isTauri: () => tauri
}))

vi.mock('@tauri-apps/plugin-notification', () => ({
  isPermissionGranted: isPermissionGrantedMock,
  requestPermission: requestPermissionMock,
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
    isPermissionGrantedMock.mockReset()
    requestPermissionMock.mockReset()
    isPermissionGrantedMock.mockResolvedValue(true)
    requestPermissionMock.mockResolvedValue('granted')
    platformType = 'macos'
    tauri = true
    storage.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) || null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear()
    })
  })

  it('pushes configurable client notifications and updates app badge count', async () => {
    const {
      clientNotifications,
      clientNotificationDeliveryState,
      clientNotificationUnreadCount,
      pushClientNotification
    } = await import('@/services/clientNotifications')

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
    expect(clientNotificationDeliveryState.value.latestByDedupeKey['alert-notification-1']).toMatchObject({
      status: 'sent',
      permissionStatus: 'granted'
    })
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

  it('deduplicates realtime and polling notifications by shared alert key', async () => {
    const { clientNotifications, pushClientNotification } = await import('@/services/clientNotifications')

    await pushClientNotification({
      id: 'alert-shared-id',
      dedupeKey: 'alert-shared-id',
      source: 'alerts',
      title: '实时告警',
      body: 'CPU 超过阈值',
      native: true
    })
    await pushClientNotification({
      id: 'alert-shared-id',
      dedupeKey: 'alert-shared-id',
      source: 'alerts',
      title: '轮询告警',
      body: 'CPU 超过阈值',
      native: true
    })

    expect(clientNotifications.value).toHaveLength(1)
    expect(sendNotificationMock).toHaveBeenCalledTimes(1)
  })

  it('retains the in-app notification without requesting permission during alert delivery', async () => {
    isPermissionGrantedMock.mockResolvedValue(false)
    requestPermissionMock.mockResolvedValue('denied')
    const { clientNotificationDeliveryState, pushClientNotification } = await import('@/services/clientNotifications')

    await pushClientNotification({ id: 'permission-denied', title: '权限', body: '用户拒绝', native: true })

    expect(clientNotificationDeliveryState.value.latestByDedupeKey['permission-denied']).toMatchObject({
      status: 'permission-default',
      notificationId: 'permission-denied'
    })
    expect(requestPermissionMock).not.toHaveBeenCalled()
    expect(sendNotificationMock).not.toHaveBeenCalled()
  })

  it('reads the current native iOS denial rather than persisting a stale browser state', async () => {
    platformType = 'ios'
    invokeMock.mockResolvedValueOnce({ status: 'denied', isGranted: false })
    const { getClientNotificationPermission } = await import('@/services/clientNotifications')

    await expect(getClientNotificationPermission()).resolves.toEqual({ status: 'denied' })
    expect(invokeMock).toHaveBeenCalledWith('plugin:ios-foreground-notification|getNotificationAuthorizationStatus')
    expect(isPermissionGrantedMock).not.toHaveBeenCalled()
  })

  it('reports browser fallback safely without calling the notification plugin', async () => {
    tauri = false
    const { getClientNotificationPermission, requestClientNotificationPermission } = await import(
      '@/services/clientNotifications'
    )

    await expect(getClientNotificationPermission()).resolves.toEqual({ status: 'not-requested' })
    await expect(requestClientNotificationPermission()).resolves.toEqual({ status: 'not-requested' })
    expect(isPermissionGrantedMock).not.toHaveBeenCalled()
    expect(requestPermissionMock).not.toHaveBeenCalled()
  })

  it('does not invoke the iOS Settings bridge in a browser', async () => {
    tauri = false
    const { canOpenClientNotificationSettings, openClientNotificationSettings, requestClientNotificationPermission } =
      await import('@/services/clientNotifications')

    invokeMock.mockClear()
    expect(canOpenClientNotificationSettings()).toBe(false)
    await expect(openClientNotificationSettings()).resolves.toBe(false)
    await expect(requestClientNotificationPermission()).resolves.toEqual({ status: 'not-requested' })
    expect(invokeMock).not.toHaveBeenCalled()
  })

  it('opens the Settings bridge only for iOS Tauri', async () => {
    platformType = 'ios'
    const { canOpenClientNotificationSettings, openClientNotificationSettings } = await import(
      '@/services/clientNotifications'
    )

    expect(canOpenClientNotificationSettings()).toBe(true)
    await expect(openClientNotificationSettings()).resolves.toBe(true)
    expect(invokeMock).toHaveBeenCalledWith('plugin:ios-foreground-notification|openNotificationSettings')
  })

  it('requests desktop native permission only through the explicit permission helper', async () => {
    isPermissionGrantedMock.mockResolvedValue(false)
    requestPermissionMock.mockResolvedValue('default')
    const { requestClientNotificationPermission } = await import('@/services/clientNotifications')

    await expect(requestClientNotificationPermission()).resolves.toEqual({ status: 'default' })
    expect(requestPermissionMock).toHaveBeenCalledTimes(1)
  })

  it('requests authorization and sends local notifications through the native iOS bridge', async () => {
    platformType = 'ios'
    invokeMock
      .mockResolvedValueOnce({ status: 'authorized', isGranted: true })
      .mockResolvedValueOnce({ status: 'authorized', isGranted: true })
      .mockResolvedValueOnce({ id: 'native-ios-notification' })
    const { requestClientNotificationPermission, pushClientNotification } = await import(
      '@/services/clientNotifications'
    )

    await expect(requestClientNotificationPermission()).resolves.toEqual({ status: 'granted' })
    await pushClientNotification({ id: 'ios-native', title: '原生告警', body: '由 iOS 展示', native: true })

    expect(invokeMock).toHaveBeenNthCalledWith(1, 'plugin:ios-foreground-notification|requestNotificationAuthorization')
    expect(invokeMock).toHaveBeenNthCalledWith(
      2,
      'plugin:ios-foreground-notification|getNotificationAuthorizationStatus'
    )
    expect(invokeMock).toHaveBeenNthCalledWith(3, 'plugin:ios-foreground-notification|showLocalNotification', {
      title: '原生告警',
      body: '由 iOS 展示'
    })
    expect(sendNotificationMock).not.toHaveBeenCalled()
  })

  it('uses the system notification surface for mobile alerts even when callers omit the native flag', async () => {
    platformType = 'ios'
    invokeMock
      .mockResolvedValueOnce({ status: 'authorized', isGranted: true })
      .mockResolvedValueOnce({ id: 'mobile-alert' })
    const { clientNotifications, pushClientNotification } = await import('@/services/clientNotifications')

    await pushClientNotification({
      id: 'mobile-alert',
      source: 'alerts',
      title: '严重告警',
      body: 'CPU 超过阈值'
    })

    expect(clientNotifications.value[0]).toMatchObject({ native: true, placement: 'system' })
    expect(invokeMock).toHaveBeenNthCalledWith(2, 'plugin:ios-foreground-notification|showLocalNotification', {
      title: '严重告警',
      body: 'CPU 超过阈值'
    })
  })

  it('records native send rejection while retaining the in-app notification', async () => {
    sendNotificationMock.mockRejectedValue(new Error('native send failed'))
    const { clientNotifications, getClientNotificationDeliveryOutcome, pushClientNotification } = await import(
      '@/services/clientNotifications'
    )

    await pushClientNotification({ id: 'send-rejected', title: '发送', body: '插件失败', native: true })

    expect(clientNotifications.value).toHaveLength(1)
    expect(getClientNotificationDeliveryOutcome('send-rejected')).toMatchObject({ status: 'send-failed' })
  })
})
