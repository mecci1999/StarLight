import request from '@/services/request'
import type { AlertItem, AlertRuleItem, NotificationItem } from '@/types/monitor'

// 获取告警列表
export function fetchAlerts(params?: {
  level?: string
  status?: string
  serviceId?: string
  keyword?: string
  startTime?: number
  endTime?: number
}) {
  return request.get<AlertItem[]>('/metrics/v1/alerts', params || {})
}

// 解决告警
export function resolveAlert(id: string) {
  return request.post<{ success: boolean }>(`/metrics/v1/alerts/${id}/resolve`, {})
}

// 静默告警
export function suppressAlert(id: string) {
  return request.post<{ success: boolean }>(`/metrics/v1/alerts/${id}/suppress`, {})
}

// 获取告警规则列表
export function fetchAlertRules() {
  return request.get<AlertRuleItem[]>('/metrics/v1/alert-rules', {})
}

// 保存告警规则
export function saveAlertRule(rule: Partial<AlertRuleItem>) {
  return request.post<AlertRuleItem>('/metrics/v1/alert-rules', rule)
}

// 更新告警规则
export function updateAlertRule(rule: AlertRuleItem) {
  return request.put<AlertRuleItem>(`/metrics/v1/alert-rules/${rule.id}`, rule)
}

// 删除告警规则
export function deleteAlertRule(id: string) {
  return request.delete<{ success: boolean }>(`/metrics/v1/alert-rules/${id}`, {})
}

// 获取通知历史
export function fetchNotifications(params?: {
  keyword?: string
  channel?: string
  status?: string
  startTime?: number
  endTime?: number
}) {
  return request.get<NotificationItem[]>('/metrics/v1/notifications', params || {})
}

// 重发通知
export function resendNotification(id: string) {
  return request.post<{ success: boolean }>(`/metrics/v1/notifications/${id}/resend`, {})
}
