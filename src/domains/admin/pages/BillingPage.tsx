import { computed, defineComponent, ref, watch } from 'vue'
import { NTabs, NTabPane, NCard } from 'naive-ui'
import PageHeader from '@/shared/layout/PageHeader'
import Usage from '@/domains/admin/components/billing/UsageTab'
import Plans from '@/domains/admin/components/billing/PlansTab'
import Payment from '@/domains/admin/components/billing/PaymentTab'
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

export default defineComponent({
  name: 'AdminBillingPage',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const activeTab = ref((typeof route.query.tab === 'string' && route.query.tab) || 'usage')
    const activeStep = computed(() => billingSteps.find((step) => step.key === activeTab.value) || billingSteps[0])

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

    return () => (
      <div class="billing-page">
        <PageHeader title="计费" subtitle="集中查看用量、套餐、支付方式和账单记录。" />

        <section class="billing-page__overview">
          <div class="billing-page__overview-main">
            <h2>按“用量 → 套餐 → 支付”的顺序完成订阅管理。</h2>
            <p>{activeStep.value.description}</p>
          </div>
          <div class="billing-page__step-list">
            {billingSteps.map((step, index) => (
              <button
                key={step.key}
                type="button"
                class={['billing-page__step', activeTab.value === step.key ? 'billing-page__step--active' : '']}
                onClick={() => handleTabChange(step.key)}>
                <span>{index + 1}</span>
                <strong>{step.title}</strong>
              </button>
            ))}
          </div>
        </section>

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
