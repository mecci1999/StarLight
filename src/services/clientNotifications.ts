import { invoke } from '@tauri-apps/api/core'
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

const NOTIFICATION_LIMIT = 5
const DEFAULT_DURATION_MS = 7000
const UNREAD_STORAGE_KEY = 'starlight_client_notification_unread_ids_v1'

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
  localStorage.setItem(UNREAD_STORAGE_KEY, JSON.stringify(ids.slice(0, 99)))
}

const updateAppBadgeCount = async (count: number) => {
  try {
    const platform = getPlatformType()
    if (platform === 'windows') return
    await invoke('set_badge_count', { count: count > 0 ? count : null })
  } catch (error) {
    if (import.meta.env.PROD) console.error('Failed to update app badge count:', error)
  }
}

const showNativeNotification = async (notification: ClientNotificationEntry) => {
  if (!notification.native) return
  try {
    let granted = await isPermissionGranted()
    if (!granted) granted = (await requestPermission()) === 'granted'
    if (granted) {
      sendNotification({
        title: notification.title,
        body: notification.body
      })
    }
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Failed to show native notification:', error)
  }
}

export const clientNotifications = ref<ClientNotificationEntry[]>([])
export const clientNotificationUnreadIds = ref<string[]>(readStoredUnreadIds())
export const clientNotificationUnreadCount = computed(() => clientNotificationUnreadIds.value.length)

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
  await showNativeNotification(notification)
  return notification
}

syncClientNotificationBadge()
