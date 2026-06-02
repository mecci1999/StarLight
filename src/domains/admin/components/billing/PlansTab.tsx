import { defineComponent, ref, onMounted } from 'vue'
import { NCard, NButton, NGrid, NGridItem, NList, NListItem, NIcon, NEmpty, useMessage } from 'naive-ui'
import { CheckmarkCircleOutline } from '@vicons/ionicons5'
import * as api from '@/api/subscription'
import './PlansTab.scss'

export default defineComponent({
  name: 'BillingPlans',
  setup() {
    const message = useMessage()
    const router = useRouter()
    const route = useRoute()
    const currentPlan = ref('')
    const currentStatus = ref('unknown')
    const loading = ref(false)
    const plansError = ref(false)
    const paymentMethods = ref<api.PaymentMethodItem[]>([])
    const cancelledPlan = ref('')
    const plans = ref<
      Array<{
        name: string
        price: string
        period: string
        features: string[]
        value: string
        color: string
      }>
    >([])
    const planOrder = ref<Record<string, number>>({})

    const openExternalUrl = (url?: string | null) => {
      if (!url) return false
      try {
        const parsed = new URL(url, window.location.origin)
        if (!['http:', 'https:'].includes(parsed.protocol)) return false
        window.open(parsed.toString(), '_blank', 'noopener,noreferrer')
        return true
      } catch {
        return false
      }
    }

    const mapPlanFeatures = (plan: api.SubscriptionPlan) => {
      if (Array.isArray(plan.features)) {
        return plan.features
      }

      if (plan.features && typeof plan.features === 'object') {
        return Object.entries(plan.features)
          .filter(([, value]) => Boolean(value))
          .map(([key, value]) => (typeof value === 'string' ? value : key))
      }

      return []
    }

    const mapPlans = (items: api.SubscriptionPlan[]) => {
      const sortedItems = [...items].sort((a, b) => {
        const left = typeof a.sortOrder === 'number' ? a.sortOrder : Number.MAX_SAFE_INTEGER
        const right = typeof b.sortOrder === 'number' ? b.sortOrder : Number.MAX_SAFE_INTEGER
        if (left !== right) {
          return left - right
        }

        const leftPrice = typeof a.price === 'number' ? a.price : Number.MAX_SAFE_INTEGER
        const rightPrice = typeof b.price === 'number' ? b.price : Number.MAX_SAFE_INTEGER
        return leftPrice - rightPrice
      })

      planOrder.value = sortedItems.reduce<Record<string, number>>((acc, plan, index) => {
        acc[plan.name] = index
        return acc
      }, {})

      const palette = ['gray', 'green', 'purple', 'blue', 'orange']

      const formatPlanPrice = (plan: api.SubscriptionPlan) => {
        if (typeof plan.price !== 'number') return '未知'
        if (plan.price === 0) return plan.currency ? `${plan.currency}0` : '未知币种 0'
        return plan.currency ? `${plan.currency}${plan.price}` : `未知币种 ${plan.price}`
      }

      return sortedItems.map((plan, index) => ({
        name: plan.displayName || plan.name.toUpperCase(),
        price: formatPlanPrice(plan),
        period: plan.billingCycle ? `/${plan.billingCycle === 'yearly' ? 'year' : 'month'}` : '',
        features: mapPlanFeatures(plan),
        value: plan.name,
        color: palette[index % palette.length]
      }))
    }

    const refreshSubscriptionState = async () => {
      const [detailResult, historyResult, methods, plansResult] = await Promise.allSettled([
        api.getSubscriptionCurrentDetail(),
        api.getSubscriptionHistory({ limit: 5, offset: 0 }),
        api.getPaymentMethods(),
        api.getPlans()
      ])

      if (detailResult.status === 'fulfilled' && detailResult.value?.plan?.name) {
        currentPlan.value = detailResult.value.plan.name
        currentStatus.value = detailResult.value.subscription?.status || 'unknown'
      } else {
        currentPlan.value = ''
        currentStatus.value = 'unknown'
      }

      if (historyResult.status === 'fulfilled') {
        const latestCancelled = (historyResult.value?.subscriptions || []).find((item) => item.status === 'cancelled')
        cancelledPlan.value = latestCancelled?.planName || ''
        if (latestCancelled && currentStatus.value === 'unknown') {
          currentPlan.value = latestCancelled.planName
          currentStatus.value = 'cancelled'
        }
      } else {
        cancelledPlan.value = ''
      }

      paymentMethods.value = methods.status === 'fulfilled' ? methods.value?.methods || [] : []

      plansError.value = plansResult.status !== 'fulfilled'
      plans.value =
        plansResult.status === 'fulfilled' && plansResult.value?.plans?.length ? mapPlans(plansResult.value.plans) : []
    }

    const handlePlanAction = async (plan: string) => {
      loading.value = true
      try {
        if (currentStatus.value === 'cancelled' && cancelledPlan.value === plan) {
          await api.resumeSubscription()
          await refreshSubscriptionState()
          message.success(`已恢复 ${plan} 套餐订阅`)
          return
        }

        const currentPlanOrder = planOrder.value[currentPlan.value] ?? -1
        const targetPlanOrder = planOrder.value[plan] ?? -1

        if (
          currentStatus.value === 'active' &&
          currentPlanOrder >= 0 &&
          targetPlanOrder >= 0 &&
          targetPlanOrder <= currentPlanOrder
        ) {
          message.warning('当前版本仅支持升级到更高套餐')
          return
        }

        if (currentStatus.value === 'active' && currentPlan.value !== plan) {
          const paymentMethod = paymentMethods.value.find((item) => item.enabled)
          const result = await api.upgradeSubscription({
            targetPlan: plan,
            paymentMethodId: paymentMethod?.id,
            upgradeType: 'immediate'
          })

          if (result?.requiresPayment && result.paymentUrl) {
            await router.replace({
              query: {
                ...route.query,
                tab: 'payment',
                orderId: result.orderId
              }
            })
            if (openExternalUrl(result.paymentUrl)) {
              message.success(`已创建升级订单，请继续完成 ${plan} 套餐支付`)
            } else {
              message.error('支付链接不可用，请检查后端支付配置')
            }
          } else {
            await refreshSubscriptionState()
            message.success(`已升级到 ${plan} 套餐`)
          }
          return
        }

        const paymentMethod = paymentMethods.value.find((item) => item.enabled)
        if (plan !== 'free' && !paymentMethod) {
          message.error('当前没有可用支付方式，请先检查支付渠道配置')
          return
        }

        const result = await api.subscribe({
          planName: plan,
          paymentMethodId: paymentMethod?.id
        })

        if (result?.requiresPayment && result.paymentUrl) {
          await router.replace({
            query: {
              ...route.query,
              tab: 'payment',
              orderId: result.orderId
            }
          })
          if (openExternalUrl(result.paymentUrl)) {
            message.success(`已创建 ${plan} 套餐支付订单，请继续完成支付`)
          } else {
            message.error('支付链接不可用，请检查后端支付配置')
          }
          return
        }

        await refreshSubscriptionState()
        message.success(`已发起 ${plan} 套餐订阅申请，请刷新页面确认当前订阅状态`)
      } catch (e) {
        message.error('订阅更新失败')
      } finally {
        loading.value = false
      }
    }

    const handleCancel = async () => {
      loading.value = true
      try {
        await api.cancelSubscription({ cancelType: 'end_of_period' })
        await refreshSubscriptionState()
        message.success('已提交取消订阅申请')
      } catch (error) {
        message.error('取消订阅失败')
      } finally {
        loading.value = false
      }
    }

    const getPrimaryLabel = (plan: string) => {
      if (currentStatus.value === 'cancelled' && cancelledPlan.value === plan) {
        return '恢复订阅'
      }

      if (currentStatus.value === 'active' && currentPlan.value === plan) {
        return '当前套餐'
      }

      if (currentStatus.value === 'active') {
        return '升级套餐'
      }

      return '发起订阅'
    }

    const isPrimaryDisabled = (plan: string) => {
      if (currentStatus.value === 'active' && currentPlan.value === plan) {
        return true
      }

      const currentPlanOrder = planOrder.value[currentPlan.value] ?? -1
      const targetPlanOrder = planOrder.value[plan] ?? -1

      if (
        currentStatus.value === 'active' &&
        currentPlanOrder >= 0 &&
        targetPlanOrder >= 0 &&
        targetPlanOrder <= currentPlanOrder
      ) {
        return true
      }

      return false
    }

    onMounted(async () => {
      try {
        await refreshSubscriptionState()
      } catch (e) {
        console.error(e)
      }
    })

    return () => (
      <div class="billing-plans-tab">
        <div class="billing-plans-tab__section-head">
          <div>
            <h3>套餐与订阅</h3>
            <p>
              当前状态：
              {currentStatus.value === 'active' ? '订阅中' : currentStatus.value === 'cancelled' ? '已取消' : '未订阅'}
              。只展示可执行的下一步操作。
            </p>
          </div>
        </div>

        {plansError.value ? (
          <NCard class="billing-plans-tab__hint-card">
            <div class="billing-plans-tab__hint">套餐信息暂时不可用，请稍后重试。</div>
          </NCard>
        ) : null}

        {!plansError.value && plans.value.length === 0 ? (
          <NCard class="billing-plans-tab__hint-card">
            <NEmpty description="当前暂无可展示的套餐信息" class="billing-plans-tab__empty" />
          </NCard>
        ) : null}

        <NGrid x-gap={16} y-gap={16} cols="1 s:1 m:3 l:3" responsive="screen">
          {plans.value.map((plan) => (
            <NGridItem>
              <NCard
                class={[
                  'billing-plans-tab__plan-card',
                  currentPlan.value === plan.value ? 'billing-plans-tab__plan-card--current' : ''
                ]}
                hoverable>
                <div class="billing-plans-tab__plan-header">
                  <div>
                    <h3 class="billing-plans-tab__plan-title">{plan.name}</h3>
                    {currentPlan.value === plan.value ? (
                      <span class="billing-plans-tab__current-badge">当前套餐</span>
                    ) : null}
                  </div>
                  <div class="billing-plans-tab__price-row">
                    <span class="billing-plans-tab__price">{plan.price}</span>
                    <span class="billing-plans-tab__period">{plan.period}</span>
                  </div>
                </div>

                <NList>
                  {plan.features.map((feature) => (
                    <NListItem>
                      <div class="billing-plans-tab__feature-row">
                        <NIcon color="var(--color-success)" size={20} component={CheckmarkCircleOutline} />
                        <span class="billing-plans-tab__feature-text">{feature}</span>
                      </div>
                    </NListItem>
                  ))}
                </NList>

                <div class="billing-plans-tab__actions">
                  <NButton
                    block
                    type={currentPlan.value === plan.value ? 'default' : 'primary'}
                    secondary={currentPlan.value === plan.value}
                    disabled={isPrimaryDisabled(plan.value)}
                    loading={loading.value}
                    onClick={() => handlePlanAction(plan.value)}>
                    {getPrimaryLabel(plan.value)}
                  </NButton>

                  {currentStatus.value === 'active' &&
                    currentPlan.value === plan.value &&
                    currentPlan.value !== 'free' && (
                      <NButton
                        class="billing-plans-tab__cancel"
                        block
                        secondary
                        loading={loading.value}
                        onClick={handleCancel}>
                        取消订阅
                      </NButton>
                    )}
                </div>
              </NCard>
            </NGridItem>
          ))}
        </NGrid>
      </div>
    )
  }
})
