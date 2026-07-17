import { defineComponent, ref, onMounted, computed } from 'vue'
import { NCard, NButton, NTag, NSpin, NEmpty, NStatistic, NProgress, NIcon } from 'naive-ui'
import { PhArrowsClockwise, PhWallet, PhChartBar, PhStack } from '@phosphor-icons/vue'
import { getStoredUserInfo } from '@/services/authSession'
import * as subscriptionApi from '@/api/subscription'
import type { BillingAnalyticsResult, BillingHistoryItem } from '@/api/subscription'
import { reportUnexpectedBillingError } from '@/domains/admin/components/billing/billingErrorState'
import './MobileBilling.scss'

// ── Types ──────────────────────────────────
type MobileBillingTab = 'plans' | 'payment' | 'usage'

type PlanItem = {
  name: string
  price: string
  period: string
  features: string[]
  value: string
  color: string
}

type PaymentHistoryItem = {
  id: string
  date: string
  description: string
  amount: string
  status: string
  downloadUrl?: string
}

type UsageQuota = {
  type: string
  label: string
  current: number
  total: number
}

// ── Constants ──────────────────────────────
const fallbackPlans: PlanItem[] = [
  {
    name: 'Free',
    price: 'CNY0',
    period: '/month',
    features: ['基础指标接入', '1 个 API Key', '社区支持'],
    value: 'free',
    color: 'gray'
  },
  {
    name: 'Pro',
    price: 'CNY99',
    period: '/month',
    features: ['更高指标写入额度', '多 API Key 管理', '告警与趋势分析'],
    value: 'pro',
    color: 'blue'
  },
  {
    name: 'Team',
    price: 'CNY299',
    period: '/month',
    features: ['团队级配额', '更长数据保留', '优先支持'],
    value: 'team',
    color: 'purple'
  }
]

const quotaTypeLabels: Record<string, string> = {
  maxMetricsPerMonth: '月度指标写入',
  maxCustomSchemas: '自定义 Schema',
  maxAppKeys: '活跃 API Key'
}

// ── Component ──────────────────────────────
export default defineComponent({
  name: 'MobileBilling',
  setup() {
    // ── State ────────────────────────────────
    const activeTab = ref<MobileBillingTab>('plans')
    const isAdminUser = computed(() => Boolean(getStoredUserInfo()?.isAdmin))

    // ── Plans state ──────────────────────────
    const plans = ref<PlanItem[]>([])
    const currentPlan = ref('')
    const currentStatus = ref('unknown')
    const plansLoading = ref(false)
    const plansError = ref(false)

    // ── Payment state ────────────────────────
    const paymentHistory = ref<PaymentHistoryItem[]>([])
    const paymentLoading = ref(false)
    const paymentError = ref(false)
    const analytics = ref<BillingAnalyticsResult | null>(null)

    // ── Usage state ──────────────────────────
    const usageQuotas = ref<UsageQuota[]>([])
    const usageLoading = ref(false)
    const usageError = ref(false)
    const planSummary = ref<{ planName: string; planDisplayName: string; expiresAt: string } | null>(null)

    // ── Helpers ──────────────────────────────
    const formatAmount = (currency?: string | null, amount?: number | null) => {
      if (typeof amount !== 'number') return '未知金额'
      return `${currency || ''} ${amount.toLocaleString()}`
    }

    const getQuotaPercent = (quota: UsageQuota) => {
      if (!quota.total) return 0
      return Math.min(Math.round((quota.current / quota.total) * 100), 100)
    }

    const displayNumber = (value: number | null | undefined) =>
      typeof value === 'number' ? value.toLocaleString() : '未知'

    const mapPlans = (items: subscriptionApi.SubscriptionPlan[]) => {
      const palette = ['gray', 'green', 'purple', 'blue', 'orange']
      const sortedItems = [...items].sort((a, b) => {
        const left = typeof a.sortOrder === 'number' ? a.sortOrder : Number.MAX_SAFE_INTEGER
        const right = typeof b.sortOrder === 'number' ? b.sortOrder : Number.MAX_SAFE_INTEGER
        if (left !== right) return left - right
        const leftPrice = typeof a.price === 'number' ? a.price : Number.MAX_SAFE_INTEGER
        const rightPrice = typeof b.price === 'number' ? b.price : Number.MAX_SAFE_INTEGER
        return leftPrice - rightPrice
      })

      return sortedItems.map((plan, index) => {
        const formatPlanPrice = (p: subscriptionApi.SubscriptionPlan) => {
          if (typeof p.price !== 'number') return '未知'
          if (p.price === 0) return p.currency ? `${p.currency}0` : '未知币种 0'
          return p.currency ? `${p.currency}${p.price}` : `未知币种 ${p.price}`
        }

        const mapPlanFeatures = (p: subscriptionApi.SubscriptionPlan) => {
          if (Array.isArray(p.features)) return p.features
          if (p.features && typeof p.features === 'object') {
            return Object.entries(p.features)
              .filter(([, value]) => Boolean(value))
              .map(([key, value]) => (typeof value === 'string' ? value : key))
          }
          return []
        }

        return {
          name: plan.displayName || plan.name.toUpperCase(),
          price: formatPlanPrice(plan),
          period: plan.billingCycle ? `/${plan.billingCycle === 'yearly' ? 'year' : 'month'}` : '',
          features: mapPlanFeatures(plan),
          value: plan.name,
          color: palette[index % palette.length]
        }
      })
    }

    // ── Data loading ─────────────────────────
    const loadPlans = async () => {
      plansLoading.value = true
      plansError.value = false
      try {
        const [detailResult, plansResult] = await Promise.allSettled([
          subscriptionApi.getSubscriptionCurrentDetail(),
          subscriptionApi.getPlans()
        ])

        if (detailResult.status === 'fulfilled' && detailResult.value?.plan?.name) {
          currentPlan.value = detailResult.value.plan.name
          currentStatus.value = detailResult.value.subscription?.status || 'unknown'
        }

        if (plansResult.status === 'fulfilled' && plansResult.value?.plans?.length) {
          plans.value = mapPlans(plansResult.value.plans)
        } else {
          plans.value = fallbackPlans
          plansError.value = plansResult.status !== 'fulfilled'
        }
      } catch (e) {
        reportUnexpectedBillingError('Mobile billing plans load failed:', e)
        plans.value = fallbackPlans
        plansError.value = true
      } finally {
        plansLoading.value = false
      }
    }

    const loadPayment = async () => {
      paymentLoading.value = true
      paymentError.value = false
      try {
        const [historyRes, analyticsRes] = await Promise.allSettled([
          subscriptionApi.getBillingHistory({ limit: 20, offset: 0 }),
          isAdminUser.value ? subscriptionApi.getBillingAnalytics() : Promise.resolve(null)
        ])

        if (historyRes.status === 'fulfilled') {
          paymentHistory.value = (historyRes.value?.bills || []).map((item: BillingHistoryItem) => ({
            id: item.id,
            date: item.createdAt?.slice(0, 10) || '-',
            description: item.planName || item.billNumber,
            amount: formatAmount(item.currency, item.amount),
            status: item.status,
            downloadUrl: item.downloadUrl
          }))
        } else {
          paymentHistory.value = []
          paymentError.value = true
        }

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
          analytics.value = analyticsRes.value
        }
      } catch (e) {
        reportUnexpectedBillingError('Mobile billing payment load failed:', e)
        paymentHistory.value = []
        paymentError.value = true
      } finally {
        paymentLoading.value = false
      }
    }

    const loadUsage = async () => {
      usageLoading.value = true
      usageError.value = false
      try {
        const summary = await subscriptionApi.getUsageSummary()
        planSummary.value = summary?.summary || null

        usageQuotas.value = (summary?.quotas || []).map((q) => ({
          type: q.type,
          label: quotaTypeLabels[q.type] || q.type,
          current: q.current,
          total: q.total
        }))
      } catch (e) {
        reportUnexpectedBillingError('Mobile billing usage load failed:', e)
        usageQuotas.value = []
        usageError.value = true
      } finally {
        usageLoading.value = false
      }
    }

    const loadAll = async () => {
      await Promise.all([loadPlans(), loadPayment(), loadUsage()])
    }

    onMounted(loadAll)

    // ── Tab switch ───────────────────────────
    const handleTabChange = (tab: MobileBillingTab) => {
      activeTab.value = tab
    }

    // ── Status tag ───────────────────────────
    const statusTagType = (status: string): 'success' | 'warning' | 'error' | 'default' | 'info' => {
      switch (status) {
        case 'paid':
          return 'success'
        case 'pending':
          return 'warning'
        case 'overdue':
          return 'error'
        case 'active':
          return 'success'
        case 'cancelled':
          return 'default'
        default:
          return 'info'
      }
    }

    const statusLabel = (status: string): string => {
      switch (status) {
        case 'paid':
          return '已支付'
        case 'pending':
          return '待处理'
        case 'overdue':
          return '已逾期'
        case 'active':
          return '订阅中'
        case 'cancelled':
          return '已取消'
        default:
          return status
      }
    }

    // ── Section: Plans ───────────────────────
    const renderPlansTab = () => {
      if (plansLoading.value) {
        return (
          <div class="mobile-billing__loading">
            <NSpin size="medium" />
          </div>
        )
      }

      if (plansError.value && plans.value.length === 0) {
        return (
          <div class="mobile-billing__error-state">
            <NEmpty description="套餐数据加载失败">
              {{
                action: () => (
                  <NButton size="small" type="primary" onClick={loadPlans}>
                    重新加载
                  </NButton>
                )
              }}
            </NEmpty>
          </div>
        )
      }

      if (plans.value.length === 0) {
        return (
          <div class="mobile-billing__empty-state">
            <NEmpty description="暂无可用套餐" />
          </div>
        )
      }

      return (
        <div class="mobile-billing__plans-list">
          {plans.value.map((plan) => (
            <NCard
              key={plan.value}
              size="small"
              bordered={false}
              class={[
                'mobile-billing__plan-card',
                currentPlan.value === plan.value ? 'mobile-billing__plan-card--current' : ''
              ]}>
              <div class="mobile-billing__plan-header">
                <div class="mobile-billing__plan-name-row">
                  <span class="mobile-billing__plan-name">{plan.name}</span>
                  {currentPlan.value === plan.value && (
                    <NTag size="tiny" bordered={false} type="success">
                      当前套餐
                    </NTag>
                  )}
                </div>
                <div class="mobile-billing__plan-price">
                  <span class="mobile-billing__plan-price-value">{plan.price}</span>
                  <span class="mobile-billing__plan-price-period">{plan.period}</span>
                </div>
              </div>

              <div class="mobile-billing__plan-features">
                {plan.features.map((feature, idx) => (
                  <div key={idx} class="mobile-billing__plan-feature">
                    <span class="mobile-billing__plan-feature-dot" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div class="mobile-billing__plan-status">
                <NTag
                  size="small"
                  bordered={false}
                  type={statusTagType(currentPlan.value === plan.value ? currentStatus.value : 'pending')}>
                  {currentPlan.value === plan.value ? statusLabel(currentStatus.value) : '可订阅'}
                </NTag>
              </div>
            </NCard>
          ))}
        </div>
      )
    }

    // ── Section: Payment ─────────────────────
    const renderPaymentTab = () => {
      if (paymentLoading.value) {
        return (
          <div class="mobile-billing__loading">
            <NSpin size="medium" />
          </div>
        )
      }

      // ── Admin analytics summary ──────────────
      const renderAdminSummary = () => {
        if (!isAdminUser.value || !analytics.value) return null
        return (
          <div class="mobile-billing__admin-summary">
            <div class="mobile-billing__summary-grid">
              <NCard size="small" bordered={false} class="mobile-billing__summary-card">
                <NStatistic label="活跃订阅" value={analytics.value.summary.activeSubscriptions} />
              </NCard>
              <NCard size="small" bordered={false} class="mobile-billing__summary-card">
                <NStatistic
                  label="已确认收入"
                  value={formatAmount(analytics.value.currency, analytics.value.summary.paidRevenue)}
                />
              </NCard>
              <NCard size="small" bordered={false} class="mobile-billing__summary-card">
                <NStatistic
                  label="待收款"
                  value={formatAmount(analytics.value.currency, analytics.value.summary.pendingRevenue)}
                />
              </NCard>
              <NCard size="small" bordered={false} class="mobile-billing__summary-card">
                <NStatistic
                  label="逾期风险"
                  value={formatAmount(analytics.value.currency, analytics.value.summary.overdueRevenue)}
                />
              </NCard>
            </div>
          </div>
        )
      }

      if (paymentError.value && paymentHistory.value.length === 0) {
        return (
          <div class="mobile-billing__error-state">
            <NEmpty description="账单数据加载失败">
              {{
                action: () => (
                  <NButton size="small" type="primary" onClick={loadPayment}>
                    重新加载
                  </NButton>
                )
              }}
            </NEmpty>
          </div>
        )
      }

      if (paymentHistory.value.length === 0) {
        return (
          <div class="mobile-billing__empty-state">
            <NEmpty description="暂无账单记录" />
          </div>
        )
      }

      return (
        <div class="mobile-billing__payment-section">
          {renderAdminSummary()}
          <div class="mobile-billing__payment-list">
            {paymentHistory.value.map((item) => (
              <NCard key={item.id} size="small" bordered={false} class="mobile-billing__payment-card">
                <div class="mobile-billing__payment-card-header">
                  <div class="mobile-billing__payment-card-desc">{item.description}</div>
                  <NTag size="tiny" bordered={false} type={statusTagType(item.status)}>
                    {statusLabel(item.status)}
                  </NTag>
                </div>
                <div class="mobile-billing__payment-card-body">
                  <span class="mobile-billing__payment-card-amount">{item.amount}</span>
                  <span class="mobile-billing__payment-card-date">{item.date}</span>
                </div>
              </NCard>
            ))}
          </div>
        </div>
      )
    }

    // ── Section: Usage ───────────────────────
    const renderUsageTab = () => {
      if (usageLoading.value) {
        return (
          <div class="mobile-billing__loading">
            <NSpin size="medium" />
          </div>
        )
      }

      if (usageError.value) {
        return (
          <div class="mobile-billing__error-state">
            <NEmpty description="用量数据加载失败">
              {{
                action: () => (
                  <NButton size="small" type="primary" onClick={loadUsage}>
                    重新加载
                  </NButton>
                )
              }}
            </NEmpty>
          </div>
        )
      }

      if (usageQuotas.value.length === 0) {
        return (
          <div class="mobile-billing__empty-state">
            <NEmpty description="暂无用量数据" />
          </div>
        )
      }

      return (
        <div class="mobile-billing__usage-section">
          {planSummary.value && (
            <div class="mobile-billing__usage-plan-badge">
              <NTag bordered={false} type="info">
                {planSummary.value.planDisplayName || planSummary.value.planName}
              </NTag>
              <span class="mobile-billing__usage-expiry">到期时间：{planSummary.value.expiresAt || '—'}</span>
            </div>
          )}

          <div class="mobile-billing__usage-quotas">
            {usageQuotas.value.map((quota) => {
              const percent = getQuotaPercent(quota)
              return (
                <NCard key={quota.type} size="small" bordered={false} class="mobile-billing__usage-quota-card">
                  <div class="mobile-billing__usage-quota-head">
                    <span class="mobile-billing__usage-quota-label">{quota.label}</span>
                    <NTag size="tiny" bordered={false} type={percent >= 85 ? 'warning' : 'success'}>
                      {percent}%
                    </NTag>
                  </div>
                  <div class="mobile-billing__usage-quota-value">
                    {displayNumber(quota.current)} / {displayNumber(quota.total)}
                  </div>
                  <NProgress
                    percentage={percent}
                    showIndicator={false}
                    status={percent >= 85 ? 'warning' : 'success'}
                    height={8}
                    borderRadius={4}
                  />
                </NCard>
              )
            })}
          </div>
        </div>
      )
    }

    // ── Main render ──────────────────────────
    return () => (
      <div class="mobile-billing">
        {/* ── Header ──────────────────────────── */}
        <div class="mobile-billing__header">
          <div>
            <h2 class="mobile-billing__title">{isAdminUser.value ? '计费运营' : '我的订阅'}</h2>
            <div class="mobile-billing__subtitle">
              {isAdminUser.value ? '管理套餐、支付与用量' : '查看套餐、账单与配额'}
            </div>
          </div>
          <NButton size="small" secondary type="primary" onClick={loadAll}>
            <NIcon size={16}>
              <PhArrowsClockwise />
            </NIcon>
          </NButton>
        </div>

        {/* ── Tab bar ─────────────────────────── */}
        <div class="mobile-billing__tab-bar">
          <div
            class={['mobile-billing__tab', activeTab.value === 'plans' ? 'mobile-billing__tab--active' : '']}
            onClick={() => handleTabChange('plans')}>
            <NIcon size={16}>
              <PhStack />
            </NIcon>
            <span>套餐</span>
          </div>
          <div
            class={['mobile-billing__tab', activeTab.value === 'payment' ? 'mobile-billing__tab--active' : '']}
            onClick={() => handleTabChange('payment')}>
            <NIcon size={16}>
              <PhWallet />
            </NIcon>
            <span>支付</span>
          </div>
          <div
            class={['mobile-billing__tab', activeTab.value === 'usage' ? 'mobile-billing__tab--active' : '']}
            onClick={() => handleTabChange('usage')}>
            <NIcon size={16}>
              <PhChartBar />
            </NIcon>
            <span>用量</span>
          </div>
        </div>

        {/* ── Content ─────────────────────────── */}
        <div class="mobile-billing__content">
          {activeTab.value === 'plans' && renderPlansTab()}
          {activeTab.value === 'payment' && renderPaymentTab()}
          {activeTab.value === 'usage' && renderUsageTab()}
        </div>
      </div>
    )
  }
})
