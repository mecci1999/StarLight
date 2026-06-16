import request from '@/services/request'
import url from '@/api/url'

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
  id: string
  name: string
  displayName?: string
  price: number
  currency: string
  billingCycle?: string
  sortOrder?: number
  popular?: boolean
  limits?: PlanLimit | Record<string, any>
  limitations?: Record<string, any>
  features?: string[] | Record<string, any>
}

export interface UserSubscription {
  userId: string
  plan: string
  status: 'active' | 'expired' | 'cancelled'
  startDate: string
  endDate: string
  autoRenew: boolean
}

export interface SubscriptionCurrentDetail {
  plan: {
    id: string
    name: string
    displayName: string
    price: number
    currency: string
    billingCycle: string
  }
  subscription: {
    id: string
    status: string
    startDate: string
    expiresAt: string
    autoRenew: boolean
    trialEndsAt?: string
  }
  usage: any
  limits: Record<string, any> | null
  daysUntilExpiry: number | null
}

export interface SubscriptionUsageSummary {
  quotas: Array<{
    type: string
    current: number
    total: number
  }>
  summary: {
    planName: string
    planDisplayName: string
    expiresAt: string
  }
}

export interface SubscriptionQuotaHistoryItem {
  timestamp: string
  quotaType: string
  current: number
  total: number
  percentage: number
  status: string
}

export interface SubscriptionHistoryItem {
  id: string
  planName: string
  planDisplayName: string
  status: string
  startDate: string
  expiresAt?: string
  cancelledAt?: string
  price?: number | null
  currency?: string | null
  billingCycle?: string
  autoRenew: boolean
}

export interface BillingHistoryItem {
  id: string
  billNumber: string
  planName: string
  billingPeriod: {
    start: string
    end: string
  }
  amount: number
  currency: string
  status: string
  dueDate: string
  paidAt?: string
  createdAt: string
  downloadUrl?: string
}

export interface PaymentMethodItem {
  id: string
  name: string
  displayName: string
  icon?: string
  enabled: boolean
  supportedCurrencies: string[]
  fees?: {
    type?: string
    value?: number
    fixed?: number
  }
  description?: string
}

export interface PaymentOrderItem {
  orderId: string
  orderNumber: string
  planName: string
  billingCycle: string
  paymentMethod: string
  paymentUrl: string
  qrCode?: string | null
  expiresAt: string
  status: string
  pricing: {
    billingCycle: string
    currency: string
    originalAmount: number
    discountAmount: number
    finalAmount: number
    promoCode: string | null
  }
}

export interface SubscriptionActionResult {
  orderId?: string
  subscription: {
    id: string
    planName: string
    status: string
    effectiveDate?: string
    cancelledAt?: string
    resumedAt?: string
    expiresAt?: string
    autoRenew?: boolean
  }
  requiresPayment?: boolean
  paymentUrl?: string
  upgradeType?: string
}

export interface PaymentOrderStatusResult {
  order: {
    id: string
    orderNumber: string
    planName: string
    amount: number
    currency: string
    status: string
    paymentMethod: string
    createdAt: string
    paidAt?: string
    expiresAt: string
    transactionId?: string
  }
  statusDescription: string
  nextAction?: {
    type: string
    label: string
    target?: string | null
  } | null
}

export interface BillingAnalyticsResult {
  summary: {
    activeSubscriptions: number
    trialUsers: number
    paidRevenue: number
    pendingRevenue: number
    overdueRevenue: number
    paidBills: number
    pendingBills: number
    overdueBills: number
  }
  planDistribution: Array<{
    planName: string
    count: number
  }>
  currency: string
  generatedAt: string
}

// 获取所有订阅计划
export function getPlans() {
  return request.get<{ plans: SubscriptionPlan[]; currency: string; total: number }>(url.subscriptionPlans, {})
}

// 获取当前用户订阅信息
export function getUserSubscription() {
  return request.get<UserSubscription>(url.userSubscription, {})
}

export function getSubscriptionCurrentDetail() {
  return request.get<SubscriptionCurrentDetail>(url.subscriptionCurrentDetail, {})
}

// 获取当前使用量统计
export function getUsageStatistics() {
  return request.get<UsageStatistics>(url.subscriptionUsage, {})
}

export function getUsageSummary() {
  return request.get<SubscriptionUsageSummary>(url.subscriptionUsageSummary, {})
}

export function getQuotaHistory(params?: { quotaType?: string; timeRange?: string; limit?: number; offset?: number }) {
  return request.get<{
    history: SubscriptionQuotaHistoryItem[]
    stats: any
    timeRange: string
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }>(url.subscriptionQuotaHistory, params || {})
}

export function getBillingHistory(params?: { limit?: number; offset?: number; status?: string }) {
  return request.get<{ bills: BillingHistoryItem[]; total: number }>(url.billingHistory, params || {})
}

export function getBillingAnalytics() {
  return request.get<BillingAnalyticsResult>(url.billingAnalytics, {})
}

export function getPaymentMethods() {
  return request.get<{ methods: PaymentMethodItem[]; total: number }>(url.paymentMethods, {})
}

export function createPaymentOrder(params: { planName: string; billingCycle?: string; paymentMethod: string }) {
  return request.post<PaymentOrderItem>(url.createPaymentOrder, params)
}

export function queryPaymentOrder(params: { orderId: string }) {
  return request.get<PaymentOrderStatusResult>(url.queryPaymentOrder, params)
}

// 订阅计划
export function subscribe(params: { planName: string; paymentMethodId?: string }) {
  return request.post<SubscriptionActionResult>(url.subscribe, params)
}

export function upgradeSubscription(params: {
  targetPlan: string
  billingCycle?: string
  paymentMethodId?: string
  upgradeType?: string
}) {
  return request.post<SubscriptionActionResult>(url.upgradeSubscription, params)
}

// 取消订阅
export function cancelSubscription(params?: { reason?: string; cancelType?: string; feedback?: string }) {
  return request.post<SubscriptionActionResult>(url.cancelSubscription, params || {})
}

export function resumeSubscription() {
  return request.post<SubscriptionActionResult>(url.resumeSubscription, {})
}

export function getSubscriptionHistory(params?: { limit?: number; offset?: number; status?: string }) {
  return request.get<{ subscriptions: SubscriptionHistoryItem[]; total: number }>(url.subscriptionHistory, params || {})
}
