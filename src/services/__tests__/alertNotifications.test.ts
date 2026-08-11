import { describe, expect, it } from 'vitest'
import { isWebSocketAlertMessage, toClientAlertNotification } from '@/services/alertNotifications'

const alertMessage = {
  type: 'alert' as const,
  data: {
    alertId: 'alert-1',
    ruleId: 'rule-1',
    tenantId: 'tenant-a',
    level: 'critical' as const,
    service: 'gateway',
    metric: 'service.cpu.usage',
    value: 95,
    threshold: 90,
    operator: '>' as const,
    status: 'active' as const,
    message: 'CPU 超过阈值',
    time: '2026-08-11T12:00:00.000Z'
  }
}

describe('alertNotifications', () => {
  it('converts valid websocket alerts to existing client notification payloads', () => {
    expect(isWebSocketAlertMessage(alertMessage)).toBe(true)
    const notification = toClientAlertNotification(alertMessage)

    expect(notification).toMatchObject({
      id: 'alert-1',
      dedupeKey: 'alert-1',
      source: 'alerts',
      level: 'critical',
      native: true,
      badge: true,
      service: 'gateway'
    })
    expect(notification.actions).toEqual([{ label: '查看通知', route: '/home/alert-notifications' }])
  })

  it('rejects malformed or non-alert websocket messages', () => {
    expect(isWebSocketAlertMessage({ type: 'logs', data: alertMessage.data })).toBe(false)
    expect(isWebSocketAlertMessage({ ...alertMessage, data: { ...alertMessage.data, tenantId: '' } })).toBe(false)
    expect(isWebSocketAlertMessage({ ...alertMessage, data: { ...alertMessage.data, value: Number.NaN } })).toBe(false)
  })
})
