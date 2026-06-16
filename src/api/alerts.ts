import request from '@/services/request'
import url from '@/api/url'
import type { AlertItem, AlertRuleItem, NotificationItem } from '@/types/monitor'
import type { MetricsDatasetScope } from './metrics'

const cleanAlertQueryParams = <T extends Record<string, unknown>>(params?: T) =>
  Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => {
      if (value === undefined || value === null || value === '') return false
      if (value === 'undefined' || value === 'null') return false
      return true
    })
  ) as Partial<T>

// 获取告警列表
export function fetchAlerts(params?: {
  level?: string
  status?: string
  serviceId?: string
  assigneeUserId?: string
  scope?: MetricsDatasetScope
  keyword?: string
  startTime?: number
  endTime?: number
}) {
  return request.get<AlertItem[]>(url.metricsAlerts, cleanAlertQueryParams(params))
}

export function fetchAlertAssignees() {
  return request.get<Array<{ userId: string; nickname: string; isAdmin?: boolean }>>(url.metricsAlertAssignees, {})
}

export function assignAlert(id: string, params: { assigneeUserId?: string; assigneeName?: string }) {
  return request.post<boolean | { success?: boolean }>(url.assignAlert(id), params)
}

// 解决告警
export function resolveAlert(id: string) {
  return request.post<boolean | { success?: boolean }>(url.resolveAlert(id), {})
}

export function acknowledgeAlert(id: string) {
  return request.post<boolean | { success?: boolean }>(url.acknowledgeAlert(id), {})
}

// 静默告警
export function suppressAlert(id: string) {
  return request.post<boolean | { success?: boolean }>(url.suppressAlert(id), {})
}

// 获取告警规则列表
export function fetchAlertRules(params?: {
  serviceId?: string
  startTime?: number
  endTime?: number
  scope?: MetricsDatasetScope
}) {
  return request.get<AlertRuleItem[]>(url.metricsAlertRules, cleanAlertQueryParams(params))
}

// 保存告警规则
export function saveAlertRule(rule: Partial<AlertRuleItem>) {
  return request.post<AlertRuleItem>(`${url.metricsAlertRules}/create`, rule)
}

// 更新告警规则
export function updateAlertRule(rule: AlertRuleItem) {
  return request.put<AlertRuleItem>(url.updateAlertRule(rule.id), rule)
}

export function bulkUpdateAlertRules(params: { ids: string[]; enabled: boolean }) {
  return request.post<AlertRuleItem[]>(url.metricsAlertRulesBulkUpdate, params)
}

export function exportAlertRules(params?: {
  serviceId?: string
  startTime?: number
  endTime?: number
  scope?: MetricsDatasetScope
}) {
  return request.get<{ rules: AlertRuleItem[]; exportedAt: string }>(
    url.metricsAlertRulesExport,
    cleanAlertQueryParams(params)
  )
}

export function importAlertRules(params: { rules: Array<Partial<AlertRuleItem>> }) {
  return request.post<AlertRuleItem[]>(url.metricsAlertRulesImport, params)
}

// 删除告警规则
export function deleteAlertRule(id: string) {
  return request.delete<boolean | { success?: boolean }>(`${url.metricsAlertRules}/${id}/delete`, {})
}

// 获取通知历史
export function fetchNotifications(params?: {
  keyword?: string
  channel?: string
  status?: string
  serviceId?: string
  scope?: MetricsDatasetScope
  startTime?: number
  endTime?: number
}) {
  return request.get<NotificationItem[]>(url.metricsNotifications, cleanAlertQueryParams(params)).catch((error) => {
    console.error('Failed to fetch notifications, using empty fallback:', error)
    return []
  })
}

// 重发通知
export function resendNotification(id: string) {
  return request.post<boolean | { success?: boolean }>(url.resendNotification(id), {})
}
