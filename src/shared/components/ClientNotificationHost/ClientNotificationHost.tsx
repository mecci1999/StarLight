import { PulseOutline, WarningOutline, NotificationsOutline, CheckmarkCircleOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { fetchNotifications } from '@/api/alerts'
import { useMitt } from '@/hooks/useMitt'
import { isWebSocketAlertMessage, toClientAlertNotification } from '@/services/alertNotifications'
import {
  clientNotifications,
  dismissClientNotification,
  hideClientNotification,
  pushClientNotification,
  syncClientNotificationBadge,
  type ClientNotificationEntry,
  type ClientNotificationLevel
} from '@/services/clientNotifications'
import type { NotificationItem } from '@/types/monitor'
import './ClientNotificationHost.scss'

type RawNotification = NotificationItem & {
  id?: string
  alertId?: string
  ruleId?: string
  type?: ClientNotificationLevel
  mobileTitle?: string
  mobileBody?: string
  sentAt?: string
  updatedAt?: number
  target?: string
}

const SEEN_STORAGE_KEY = 'starlight_client_notification_seen_ids_v1'
const POLL_INTERVAL_MS = 30 * 1000
const SEEN_LIMIT = 300

const readSeenIds = () => {
  if (typeof localStorage === 'undefined') return new Set<string>()
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

const persistSeenIds = (ids: Set<string>) => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-SEEN_LIMIT)))
  } catch {
    if (import.meta.env.PROD) console.warn('Client notification seen state could not be persisted')
  }
}

const resolveNotificationId = (item: RawNotification) => {
  const stableId = item.alertId || item.id || item.key
  if (stableId) return String(stableId)
  return `${item.ruleId || 'notification'}-${item.sentAt || item.updatedAt || 'unknown'}`
}

const resolveNotificationTime = (item: RawNotification) => {
  if (typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt)) return item.updatedAt
  const timestamp = new Date(item.sentAt || item.sendTime || '').getTime()
  return Number.isFinite(timestamp) ? timestamp : Date.now()
}

const resolveNotificationLevel = (item: RawNotification): ClientNotificationLevel => {
  if (item.type === 'critical' || item.type === 'warning' || item.type === 'info') return item.type
  if (item.status === 'failed') return 'critical'
  return 'warning'
}

const isClientVisibleNotification = (item: RawNotification) => {
  const channel = String(item.channel || '').toLowerCase()
  const status = String(item.status || '').toLowerCase()
  return (channel === 'inapp' || channel === 'in-app') && status !== 'failed'
}

const levelIconMap: Record<ClientNotificationLevel, typeof PulseOutline> = {
  critical: PulseOutline,
  warning: WarningOutline,
  info: NotificationsOutline,
  success: CheckmarkCircleOutline
}

const levelLabel: Record<ClientNotificationLevel, string> = {
  critical: '严重',
  warning: '警告',
  info: '提示',
  success: '完成'
}

export default defineComponent({
  name: 'ClientNotificationHost',
  props: {
    pollIntervalMs: { type: Number, default: POLL_INTERVAL_MS }
  },
  setup(props) {
    const seenIds = ref(readSeenIds())
    const hydrated = ref(false)
    const sessionStartedAt = Date.now()
    const pendingWebSocketAlerts = ref<ReturnType<typeof toClientAlertNotification>[]>([])
    const dismissTimers = new Map<string, number>()
    let pollTimer: number | null = null
    let polling = false

    const visibleNotifications = computed(() =>
      clientNotifications.value.filter((item) => item.placement === 'bottom-right').slice(0, 4)
    )

    const markSeen = (id: string) => {
      seenIds.value.add(id)
      persistSeenIds(seenIds.value)
    }

    const ingestNotification = async (payload: ReturnType<typeof toClientAlertNotification>) => {
      const id = payload.dedupeKey || payload.id
      if (!id || seenIds.value.has(id)) return
      const notification = await pushClientNotification(payload)
      if (notification) markSeen(id)
    }

    const pollNotifications = async () => {
      if (polling) return
      polling = true
      try {
        const notifications = ((await fetchNotifications({ channel: 'InApp' })) || []) as RawNotification[]
        const visibleItems = notifications.filter(isClientVisibleNotification)
        if (!hydrated.value) {
          visibleItems
            .filter((item) => resolveNotificationTime(item) < sessionStartedAt)
            .forEach((item) => markSeen(resolveNotificationId(item)))
          hydrated.value = true
          syncClientNotificationBadge()
          const bufferedAlerts = pendingWebSocketAlerts.value
          pendingWebSocketAlerts.value = []
          for (const alert of bufferedAlerts) await ingestNotification(alert)
        }

        const freshItems = visibleItems
          .map((item) => ({
            item,
            id: resolveNotificationId(item),
            createdAt: resolveNotificationTime(item)
          }))
          .filter(({ id }) => !seenIds.value.has(id))
          .sort((left, right) => left.createdAt - right.createdAt)

        for (const { item, id, createdAt } of freshItems) {
          await ingestNotification({
            id,
            dedupeKey: id,
            source: 'alerts',
            level: resolveNotificationLevel(item),
            title: item.mobileTitle || item.ruleName || '告警通知',
            body: item.mobileBody || item.content || '有新的告警通知需要关注',
            service: item.service,
            createdAt,
            native: true,
            badge: true,
            actions: [
              {
                label: '查看通知',
                route: '/home/alert-notifications'
              }
            ],
            metadata: {
              alertId: item.alertId,
              ruleId: item.ruleId,
              channel: item.channel,
              status: item.status
            }
          })
        }
      } catch {
        if (import.meta.env.PROD) console.warn('Client notification polling failed; will retry')
      } finally {
        polling = false
      }
    }

    const handleWebSocketAlert = async (message: unknown) => {
      if (!isWebSocketAlertMessage(message)) return
      const alert = toClientAlertNotification(message)
      if (!hydrated.value) {
        pendingWebSocketAlerts.value = [...pendingWebSocketAlerts.value, alert]
        return
      }
      await ingestNotification(alert)
    }

    const scheduleDismiss = (notification: ClientNotificationEntry) => {
      if (dismissTimers.has(notification.id)) return
      dismissTimers.set(
        notification.id,
        window.setTimeout(() => {
          dismissTimers.delete(notification.id)
          hideClientNotification(notification.id)
        }, notification.durationMs)
      )
    }

    watch(
      visibleNotifications,
      (items) => {
        items.forEach(scheduleDismiss)
        Array.from(dismissTimers.keys()).forEach((id) => {
          if (items.some((item) => item.id === id)) return
          const timer = dismissTimers.get(id)
          if (timer) window.clearTimeout(timer)
          dismissTimers.delete(id)
        })
      },
      { immediate: true }
    )

    onMounted(() => {
      useMitt.on('wsRawMessage', handleWebSocketAlert)
      pollNotifications()
      pollTimer = window.setInterval(pollNotifications, props.pollIntervalMs)
    })

    onUnmounted(() => {
      useMitt.off('wsRawMessage', handleWebSocketAlert)
      if (pollTimer) window.clearInterval(pollTimer)
      dismissTimers.forEach((timer) => window.clearTimeout(timer))
      dismissTimers.clear()
    })

    return () => (
      <div class="client-notification-host" aria-live="polite" aria-atomic="false">
        {visibleNotifications.value.map((notification) => (
          <article
            class={['client-notification', `is-${notification.level}`]}
            key={notification.id}
            role="status"
            style={{ '--client-notification-duration': `${notification.durationMs}ms` }}>
            <div class="client-notification__inner">
              <div class="client-notification__icon" aria-hidden="true">
                <NIcon size={18} component={levelIconMap[notification.level]} />
              </div>
              <div class="client-notification__body">
                <div class="client-notification__head">
                  <span
                    class={['client-notification__level-tag', `client-notification__level-tag--${notification.level}`]}>
                    {levelLabel[notification.level]}
                  </span>
                  {notification.service ? (
                    <span class="client-notification__service">{notification.service}</span>
                  ) : null}
                </div>
                <div class="client-notification__title">{notification.title}</div>
                <div class="client-notification__content">{notification.body}</div>
              </div>
            </div>
            <button
              type="button"
              class="client-notification__close"
              aria-label="关闭通知"
              onClick={() => dismissClientNotification(notification.id)}>
              <NIcon size={12}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </NIcon>
            </button>
            <div class="client-notification__progress">
              <div class="client-notification__progress-bar" />
            </div>
          </article>
        ))}
      </div>
    )
  }
})
