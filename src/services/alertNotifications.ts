import type { ClientNotificationPayload } from './clientNotifications'

type WebSocketAlert = {
  alertId: string
  ruleId: string
  tenantId: string
  level: 'critical' | 'warning' | 'info'
  service: string
  metric: string
  value: number
  threshold: number
  operator: '>' | '>=' | '<' | '<=' | '='
  status: 'active' | 'resolved' | 'suppressed'
  message: string
  time: string
  recipientUserId?: string
}

type WebSocketAlertMessage = {
  type: 'alert'
  data: WebSocketAlert
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= 500

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

export const isWebSocketAlertMessage = (value: unknown): value is WebSocketAlertMessage => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const message = value as Record<string, unknown>
  if (message.type !== 'alert' || !message.data || typeof message.data !== 'object' || Array.isArray(message.data)) {
    return false
  }

  const alert = message.data as Record<string, unknown>
  return (
    isNonEmptyString(alert.alertId) &&
    isNonEmptyString(alert.ruleId) &&
    isNonEmptyString(alert.tenantId) &&
    (alert.level === 'critical' || alert.level === 'warning' || alert.level === 'info') &&
    isNonEmptyString(alert.service) &&
    isNonEmptyString(alert.metric) &&
    isFiniteNumber(alert.value) &&
    isFiniteNumber(alert.threshold) &&
    (alert.operator === '>' ||
      alert.operator === '>=' ||
      alert.operator === '<' ||
      alert.operator === '<=' ||
      alert.operator === '=') &&
    (alert.status === 'active' || alert.status === 'resolved' || alert.status === 'suppressed') &&
    isNonEmptyString(alert.message) &&
    isNonEmptyString(alert.time) &&
    (alert.recipientUserId === undefined || isNonEmptyString(alert.recipientUserId))
  )
}

export const toClientAlertNotification = (message: WebSocketAlertMessage): ClientNotificationPayload => {
  const { data } = message
  const createdAt = new Date(data.time).getTime()
  return {
    id: data.alertId,
    dedupeKey: data.alertId,
    source: 'alerts',
    level: data.level,
    title: `${data.level === 'critical' ? '严重告警' : data.level === 'warning' ? '警告告警' : '提示告警'} · ${data.service}`,
    body: data.message,
    service: data.service,
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
    native: true,
    badge: true,
    actions: [{ label: '查看通知', route: '/home/alert-notifications' }],
    metadata: {
      alertId: data.alertId,
      ruleId: data.ruleId,
      tenantId: data.tenantId,
      metric: data.metric,
      value: data.value,
      threshold: data.threshold,
      operator: data.operator,
      status: data.status
    }
  }
}
