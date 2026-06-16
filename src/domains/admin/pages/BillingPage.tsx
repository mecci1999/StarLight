import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { NTabs, NTabPane, NCard, NEmpty, NSpin, NTag, NButton } from 'naive-ui'
import PageHeader from '@/shared/layout/PageHeader'
import Usage from '@/domains/admin/components/billing/UsageTab'
import Plans from '@/domains/admin/components/billing/PlansTab'
import Payment from '@/domains/admin/components/billing/PaymentTab'
import { reportUnexpectedBillingError } from '@/domains/admin/components/billing/billingErrorState'
import { getStoredUserInfo } from '@/services/authSession'
import * as subscriptionApi from '@/api/subscription'
import './BillingPage.scss'

const billingSteps = [
  {
    key: 'usage',
    title: '使用概览',
    description: '先确认当前配额、消耗趋势和是否接近上限。'
  },
  {
    key: 'plans',
    title: '套餐与订阅',
    description: '对比套餐能力，选择升级、恢复或取消订阅。'
  },
  {
    key: 'payment',
    title: '支付与账单',
    description: '查看支付渠道、待处理订单和历史账单。'
  }
]

const userScenarioCards = [
  { label: '当前套餐', value: '个人订阅', description: '确认套餐状态、到期时间与是否自动续费。' },
  { label: '配额健康度', value: '用量优先', description: '先看核心配额是否接近上限，再决定是否升级。' },
  { label: '支付账单', value: '自助处理', description: '处理待支付订单，查看支付方式与历史账单。' }
]

const adminInsightCards = ['订阅用户规模', '收益与待收款', '逾期风险', '套餐分布']

export default defineComponent({
  name: 'AdminBillingPage',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const activeTab = ref((typeof route.query.tab === 'string' && route.query.tab) || 'usage')
    const analytics = ref<subscriptionApi.BillingAnalyticsResult | null>(null)
    const analyticsLoading = ref(false)
    const analyticsUnavailable = ref(false)
    const isAdminUser = computed(() => Boolean(getStoredUserInfo()?.isAdmin))
    const activeStep = computed(() => billingSteps.find((step) => step.key === activeTab.value) || billingSteps[0])
    const pageTitle = computed(() => (isAdminUser.value ? '计费运营' : '我的订阅'))
    const pageSubtitle = computed(() =>
      isAdminUser.value
        ? '集中查看订阅规模、收入状态、套餐结构和用户账单风险。'
        : '查看当前套餐、配额使用、支付方式和历史账单。'
    )

    const formatMoney = (amount?: number, currency?: string) =>
      `${currency || 'CNY'} ${Number(amount || 0).toLocaleString()}`
    const analyticsGeneratedAt = computed(() => {
      if (!analytics.value?.generatedAt) return '未同步'
      return analytics.value.generatedAt.replace('T', ' ').slice(0, 16)
    })
    const metricCards = computed(() => {
      if (!isAdminUser.value) return userScenarioCards
      if (!analytics.value) return []

      return [
        {
          label: '活跃订阅',
          value: analytics.value.summary.activeSubscriptions.toLocaleString(),
          description: `试用用户 ${analytics.value.summary.trialUsers.toLocaleString()}`
        },
        {
          label: '已确认收入',
          value: formatMoney(analytics.value.summary.paidRevenue, analytics.value.currency),
          description: `已支付账单 ${analytics.value.summary.paidBills.toLocaleString()} 笔`
        },
        {
          label: '待收款',
          value: formatMoney(analytics.value.summary.pendingRevenue, analytics.value.currency),
          description: `待处理账单 ${analytics.value.summary.pendingBills.toLocaleString()} 笔`
        },
        {
          label: '逾期风险',
          value: formatMoney(analytics.value.summary.overdueRevenue, analytics.value.currency),
          description: `逾期账单 ${analytics.value.summary.overdueBills.toLocaleString()} 笔`
        }
      ]
    })

    const fetchAnalytics = async () => {
      if (!isAdminUser.value) return
      analyticsLoading.value = true
      analyticsUnavailable.value = false
      try {
        analytics.value = await subscriptionApi.getBillingAnalytics()
      } catch (error) {
        reportUnexpectedBillingError('Billing analytics unavailable:', error)
        analytics.value = null
        analyticsUnavailable.value = true
      } finally {
        analyticsLoading.value = false
      }
    }

    watch(
      () => route.query.tab,
      (value) => {
        activeTab.value = (typeof value === 'string' && value) || 'usage'
      },
      { immediate: true }
    )

    const handleTabChange = async (value: string) => {
      activeTab.value = value
      await router.replace({
        query: {
          ...route.query,
          tab: value
        }
      })
    }

    onMounted(fetchAnalytics)

    return () => (
      <div class="billing-page">
        <PageHeader title={pageTitle.value} subtitle={pageSubtitle.value} />

        <section class="billing-page__overview">
          <div class="billing-page__overview-main">
            <NTag
              bordered={false}
              type={isAdminUser.value ? 'warning' : 'info'}
              class={'billing-page__overview-main-tag'}>
              {isAdminUser.value ? '管理员经营视角' : '普通用户订阅中心'}
            </NTag>
            <h2 class={'billing-page__overview-main-title'}>
              {isAdminUser.value ? '从经营结果反推订阅策略。' : '从用量开始判断是否需要升级。'}
            </h2>
            <p>{activeStep.value.description}</p>
            <div class="billing-page__overview-actions">
              <NButton size="small" type="primary" secondary onClick={() => handleTabChange(activeStep.value.key)}>
                继续查看{activeStep.value.title}
              </NButton>
              {isAdminUser.value ? (
                <NButton size="small" quaternary loading={analyticsLoading.value} onClick={fetchAnalytics}>
                  刷新经营数据
                </NButton>
              ) : null}
            </div>
          </div>
        </section>

        <section class="billing-page__metric-grid">
          {analyticsLoading.value && isAdminUser.value ? (
            <NCard bordered={false} class="billing-page__metric-card billing-page__metric-card--loading">
              <NSpin size="small" />
            </NCard>
          ) : metricCards.value.length ? (
            metricCards.value.map((card) => (
              <NCard bordered={false} class="billing-page__metric-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <em>{card.description}</em>
              </NCard>
            ))
          ) : (
            <NCard bordered={false} class="billing-page__metric-card billing-page__metric-card--empty">
              <NEmpty
                description={
                  analyticsUnavailable.value
                    ? '经营概览接口暂不可用，订阅、套餐和账单仍可继续查看。'
                    : '暂无经营概览数据'
                }
              />
            </NCard>
          )}
        </section>

        <section class="billing-page__role-note">
          <div>
            <strong>{isAdminUser.value ? '管理员能看到什么？' : '普通用户能看到什么？'}</strong>
            <span>
              {isAdminUser.value
                ? '除个人订阅操作外，还展示全局订阅用户数、收益、待收款、逾期风险和套餐分布。'
                : '只展示自己的套餐权益、用量配额、支付方式和账单记录；全局收益与订阅用户统计仅管理员可见。'}
            </span>
          </div>
          <div class="billing-page__role-chip-list">
            {(isAdminUser.value ? adminInsightCards : billingSteps.map((step) => step.title)).map((label) => (
              <NTag key={label} bordered={false} type={isAdminUser.value ? 'warning' : 'info'}>
                {label}
              </NTag>
            ))}
          </div>
        </section>

        {isAdminUser.value && analytics.value?.planDistribution?.length ? (
          <section class="billing-page__plan-strip">
            <div>
              <strong>套餐订阅分布</strong>
              <span>帮助判断免费用户转化、Pro/Team 套餐占比和升级策略。同步时间：{analyticsGeneratedAt.value}</span>
            </div>
            <div class="billing-page__plan-strip-list">
              {analytics.value.planDistribution.map((item) => (
                <NTag key={item.planName} bordered={false} type="info">
                  {item.planName}: {item.count}
                </NTag>
              ))}
            </div>
          </section>
        ) : null}

        <NCard class="billing-page__card" bordered={false}>
          <NTabs
            type="line"
            animated={false}
            value={activeTab.value}
            onUpdateValue={handleTabChange}
            paneClass="billing-page__pane">
            <NTabPane name="usage" tab="使用概览">
              <Usage />
            </NTabPane>
            <NTabPane name="plans" tab="套餐与订阅">
              <Plans />
            </NTabPane>
            <NTabPane name="payment" tab="支付与账单">
              <Payment />
            </NTabPane>
          </NTabs>
        </NCard>
      </div>
    )
  }
})
