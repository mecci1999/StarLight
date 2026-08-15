import { invoke, isTauri } from '@tauri-apps/api/core'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification'
import { type as getPlatformType } from '@tauri-apps/plugin-os'
import { computed, ref } from 'vue'

export type ClientNotificationLevel = 'critical' | 'warning' | 'info' | 'success'
export type ClientNotificationSource = 'alerts' | 'system' | 'task' | 'custom'
export type ClientNotificationPlacement = 'bottom-right'

export type ClientNotificationAction = {
  label: string
  route?: string
  event?: string
}

export type ClientNotificationPayload = {
  id?: string
  dedupeKey?: string
  source?: ClientNotificationSource
  level?: ClientNotificationLevel
  title: string
  body: string
  service?: string
  createdAt?: number
  durationMs?: number
  placement?: ClientNotificationPlacement
  native?: boolean
  badge?: boolean
  actions?: ClientNotificationAction[]
  metadata?: Record<string, unknown>
}

export type ClientNotificationEntry = Required<
  Pick<
    ClientNotificationPayload,
    'id' | 'source' | 'level' | 'title' | 'body' | 'createdAt' | 'durationMs' | 'placement'
  >
> &
  Pick<ClientNotificationPayload, 'dedupeKey' | 'service' | 'native' | 'badge' | 'actions' | 'metadata'>

export type ClientNotificationNativeDeliveryStatus =
  | 'not-requested'
  | 'permission-granted'
  | 'permission-default'
  | 'permission-denied'
  | 'permission-check-failed'
  | 'permission-request-failed'
  | 'sent'
  | 'send-failed'

export type ClientNotificationNativePermissionStatus =
  | 'not-requested'
  | 'granted'
  | 'default'
  | 'denied'
  | 'check-failed'
  | 'request-failed'

export type ClientNotificationPermissionResult = {
  status: ClientNotificationNativePermissionStatus
}

export type ClientNotificationDeliveryOutcome = {
  notificationId: string
  dedupeKey: string
  status: ClientNotificationNativeDeliveryStatus
  permissionStatus: ClientNotificationNativePermissionStatus
  attemptedAt: number
}

export type ClientNotificationDeliveryState = {
  outcomes: readonly ClientNotificationDeliveryOutcome[]
  latestByDedupeKey: Readonly<Record<string, ClientNotificationDeliveryOutcome>>
}

const NOTIFICATION_LIMIT = 5
const DELIVERY_OUTCOME_LIMIT = 99
const DEFAULT_DURATION_MS = 7000
const UNREAD_STORAGE_KEY = 'starlight_client_notification_unread_ids_v1'
const isIosTauri = () => isTauri() && getPlatformType() === 'ios'

export const canOpenClientNotificationSettings = () => isIosTauri()

type IosNotificationAuthorizationStatus = {
  status: 'notDetermined' | 'denied' | 'authorized' | 'provisional' | 'ephemeral' | 'unknown'
  isGranted: boolean
}

type IosLocalNotificationResult = {
  id: string
}

const getIosNotificationPermission = async (): Promise<ClientNotificationPermissionResult> => {
  try {
    const authorization = await invoke<IosNotificationAuthorizationStatus>(
      'plugin:ios-foreground-notification|getNotificationAuthorizationStatus'
    )
    if (authorization.isGranted) return { status: 'granted' }
    return { status: authorization.status === 'denied' ? 'denied' : 'default' }
  } catch {
    return { status: 'check-failed' }
  }
}

const requestIosNotificationPermission = async (): Promise<ClientNotificationPermissionResult> => {
  try {
    const authorization = await invoke<IosNotificationAuthorizationStatus>(
      'plugin:ios-foreground-notification|requestNotificationAuthorization'
    )
    if (authorization.isGranted) return { status: 'granted' }
    return { status: authorization.status === 'denied' ? 'denied' : 'default' }
  } catch {
    return { status: 'request-failed' }
  }
}

const readStoredUnreadIds = () => {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(UNREAD_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

const persistUnreadIds = (ids: string[]) => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(UNREAD_STORAGE_KEY, JSON.stringify(ids.slice(0, 99)))
  } catch {
    if (import.meta.env.PROD) console.warn('Client notification unread state could not be persisted')
  }
}

const updateAppBadgeCount = async (count: number) => {
  try {
    const platform = getPlatformType()
    if (platform === 'windows' || platform === 'ios') return
    await invoke('set_badge_count', { count: count > 0 ? count : null })
  } catch (error) {
    if (import.meta.env.PROD) console.error('Failed to update app badge count:', error)
  }
}

const reportNativeDeliveryFailure = (
  notification: ClientNotificationEntry,
  status: ClientNotificationNativeDeliveryStatus
) => {
  if (import.meta.env.PROD) {
    console.warn('Client notification native delivery failed', { notificationId: notification.id, status })
  }
}

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  typeof value === 'object' && value !== null && 'then' in value && typeof value.then === 'function'

export const getClientNotificationPermission = async (): Promise<ClientNotificationPermissionResult> => {
  if (!isTauri()) return { status: 'not-requested' }
  if (isIosTauri()) return getIosNotificationPermission()

  try {
    return { status: (await isPermissionGranted()) ? 'granted' : 'default' }
  } catch {
    return { status: 'check-failed' }
  }
}

export const requestClientNotificationPermission = async (): Promise<ClientNotificationPermissionResult> => {
  if (!isTauri()) return { status: 'not-requested' }
  if (isIosTauri()) return requestIosNotificationPermission()

  try {
    if (await isPermissionGranted()) return { status: 'granted' }
  } catch {
    return { status: 'check-failed' }
  }

  try {
    const status = await requestPermission()
    return { status }
  } catch {
    return { status: 'request-failed' }
  }
}

export const openClientNotificationSettings = async (): Promise<boolean> => {
  if (!canOpenClientNotificationSettings()) return false

  try {
    await invoke('plugin:ios-foreground-notification|openNotificationSettings')
    return true
  } catch {
    return false
  }
}

const showNativeNotification = async (
  notification: ClientNotificationEntry
): Promise<ClientNotificationDeliveryOutcome> => {
  const outcome = (
    status: ClientNotificationNativeDeliveryStatus,
    permissionStatus: ClientNotificationNativePermissionStatus
  ): ClientNotificationDeliveryOutcome => ({
    notificationId: notification.id,
    dedupeKey: notification.dedupeKey || notification.id,
    status,
    permissionStatus,
    attemptedAt: Date.now()
  })

  if (!notification.native) return outcome('not-requested', 'not-requested')

  const permission = await getClientNotificationPermission()
  if (permission.status !== 'granted') {
    const statusMap: Record<
      Exclude<ClientNotificationNativePermissionStatus, 'granted'>,
      ClientNotificationNativeDeliveryStatus
    > = {
      'not-requested': 'not-requested',
      default: 'permission-default',
      denied: 'permission-denied',
      'check-failed': 'permission-check-failed',
      'request-failed': 'permission-request-failed'
    }
    const result = outcome(statusMap[permission.status], permission.status)
    reportNativeDeliveryFailure(notification, result.status)
    return result
  }

  try {
    if (isIosTauri()) {
      await invoke<IosLocalNotificationResult>('plugin:ios-foreground-notification|showLocalNotification', {
        title: notification.title,
        body: notification.body
      })
      return outcome('sent', 'granted')
    }
    const sendResult: unknown = sendNotification({
      title: notification.title,
      body: notification.body
    })
    if (isPromiseLike(sendResult)) await sendResult
    return outcome('sent', 'granted')
  } catch {
    const result = outcome('send-failed', 'granted')
    reportNativeDeliveryFailure(notification, result.status)
    return result
  }
}

export const clientNotifications = ref<ClientNotificationEntry[]>([])
export const clientNotificationUnreadIds = ref<string[]>(readStoredUnreadIds())
export const clientNotificationUnreadCount = computed(() => clientNotificationUnreadIds.value.length)
export const clientNotificationDeliveryOutcomes = ref<ClientNotificationDeliveryOutcome[]>([])
export const clientNotificationDeliveryState = computed<ClientNotificationDeliveryState>(() => ({
  outcomes: clientNotificationDeliveryOutcomes.value,
  latestByDedupeKey: clientNotificationDeliveryOutcomes.value.reduce<Record<string, ClientNotificationDeliveryOutcome>>(
    (latest, outcome) => {
      if (!latest[outcome.dedupeKey]) latest[outcome.dedupeKey] = outcome
      return latest
    },
    {}
  )
}))

export const getClientNotificationDeliveryOutcome = (dedupeKey: string) =>
  clientNotificationDeliveryOutcomes.value.find((outcome) => outcome.dedupeKey === dedupeKey)

const recordClientNotificationDeliveryOutcome = (outcome: ClientNotificationDeliveryOutcome) => {
  clientNotificationDeliveryOutcomes.value = [outcome, ...clientNotificationDeliveryOutcomes.value].slice(
    0,
    DELIVERY_OUTCOME_LIMIT
  )
}

export const syncClientNotificationBadge = () => updateAppBadgeCount(clientNotificationUnreadCount.value)

export const markClientNotificationRead = async (id: string) => {
  const nextIds = clientNotificationUnreadIds.value.filter((item) => item !== id)
  if (nextIds.length === clientNotificationUnreadIds.value.length) return
  clientNotificationUnreadIds.value = nextIds
  persistUnreadIds(nextIds)
  await syncClientNotificationBadge()
}

export const clearClientNotificationBadge = async () => {
  clientNotificationUnreadIds.value = []
  persistUnreadIds([])
  await syncClientNotificationBadge()
}

export const dismissClientNotification = async (id: string) => {
  clientNotifications.value = clientNotifications.value.filter((item) => item.id !== id)
  await markClientNotificationRead(id)
}

export const hideClientNotification = (id: string) => {
  clientNotifications.value = clientNotifications.value.filter((item) => item.id !== id)
}

export const pushClientNotification = async (payload: ClientNotificationPayload) => {
  const createdAt = payload.createdAt || Date.now()
  const id =
    payload.id || payload.dedupeKey || `client-notification-${createdAt}-${Math.random().toString(36).slice(2, 8)}`
  const dedupeKey = payload.dedupeKey || id
  if (clientNotifications.value.some((item) => (item.dedupeKey || item.id) === dedupeKey)) return null

  const notification: ClientNotificationEntry = {
    id,
    dedupeKey,
    source: payload.source || 'custom',
    level: payload.level || 'info',
    title: payload.title,
    body: payload.body,
    service: payload.service,
    createdAt,
    durationMs: payload.durationMs ?? DEFAULT_DURATION_MS,
    placement: payload.placement || 'bottom-right',
    native: payload.native ?? false,
    badge: payload.badge ?? true,
    actions: payload.actions,
    metadata: payload.metadata
  }

  clientNotifications.value = [notification, ...clientNotifications.value].slice(0, NOTIFICATION_LIMIT)
  if (notification.badge && !clientNotificationUnreadIds.value.includes(notification.id)) {
    clientNotificationUnreadIds.value = [notification.id, ...clientNotificationUnreadIds.value].slice(0, 99)
    persistUnreadIds(clientNotificationUnreadIds.value)
    await syncClientNotificationBadge()
  }
  recordClientNotificationDeliveryOutcome(await showNativeNotification(notification))
  return notification
}

syncClientNotificationBadge()
