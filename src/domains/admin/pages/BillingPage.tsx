import { defineComponent, ref, watch } from 'vue'
import { NTabs, NTabPane, NCard } from 'naive-ui'
import PageHeader from '@/shared/layout/PageHeader'
import Usage from '@/domains/admin/components/billing/UsageTab'
import Plans from '@/domains/admin/components/billing/PlansTab'
import Payment from '@/domains/admin/components/billing/PaymentTab'
import './BillingPage.scss'

export default defineComponent({
  name: 'AdminBillingPage',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const activeTab = ref((typeof route.query.tab === 'string' && route.query.tab) || 'usage')

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
        <PageHeader title="管理中心 / 账单与订阅（V2）" subtitle="查看套餐、用量、支付历史与管理信息" />
        <NCard class="billing-page__card">
          <NTabs type="line" animated value={activeTab.value} onUpdateValue={handleTabChange}>
            <NTabPane name="usage" tab="使用概览">
              <Usage />
            </NTabPane>
            <NTabPane name="plans" tab="套餐与订阅">
              <Plans />
            </NTabPane>
            <NTabPane name="payment" tab="支付方式">
              <Payment />
            </NTabPane>
          </NTabs>
        </NCard>
      </div>
    )
  }
})
