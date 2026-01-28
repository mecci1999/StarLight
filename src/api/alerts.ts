import request from '@/services/request'
import type { AlertItem, AlertRuleItem } from '@/types/monitor'

// 获取告警列表
// 暂时没有后端实现，或者复用 metrics 的查询?
// 之前假设在 metrics 服务中，但没有实现 alerts actions
// 这里先保留 mock 的接口定义，实际可能需要后续实现 alerts 服务
export function fetchAlerts(params?: { level?: string; status?: string; serviceId?: string }) {
  // 假设我们会在 metrics 服务中实现 v1.alerts.list
  // 或者暂时返回空数组以免报错
  return request.get<AlertItem[]>('/metrics/v1/alerts', params || {})
}

export function fetchAlertRules() {
  return request.get<AlertRuleItem[]>('/metrics/v1/alert-rules', {})
}
