import request from '@/services/request'

export interface PlanLimit {
  metrics: {
    hourly: number
    daily: number
    monthly: number
  }
  apiKeys: number
  storage: number // bytes
}

export interface UsageStatistics {
  metrics: {
    hourly: number
    daily: number
    monthly: number
  }
  apiKeys: number
  storage: number // bytes
  periodStart: string
  periodEnd: string
}

export interface SubscriptionPlan {
  name: string
  price: number
  currency: string
  limits: PlanLimit
  features: string[]
}

export interface UserSubscription {
  userId: string
  plan: string
  status: 'active' | 'expired' | 'cancelled'
  startDate: string
  endDate: string
  autoRenew: boolean
}

// 获取所有订阅计划
export function getPlans() {
  return request.get<SubscriptionPlan[]>('/subscription/v1/plans', {})
}

// 获取当前用户订阅信息
export function getUserSubscription() {
  return request.get<UserSubscription>('/subscription/v1/user', {})
}

// 获取当前使用量统计
export function getUsageStatistics() {
  return request.get<UsageStatistics>('/subscription/v1/usage', {})
}

// 订阅计划
export function subscribe(params: { planName: string; paymentMethodId?: string }) {
  return request.post<{ success: boolean; subscription: UserSubscription }>('/subscription/v1/subscribe', params)
}

// 取消订阅
export function cancelSubscription() {
  return request.post<{ success: boolean }>('/subscription/v1/cancel', {})
}
