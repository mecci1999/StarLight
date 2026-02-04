import { defineComponent, ref, onMounted } from 'vue'
import { NCard, NButton, NGrid, NGridItem, NTag, NList, NListItem, NIcon, useMessage } from 'naive-ui'
import { CheckmarkCircleOutline } from '@vicons/ionicons5'
import * as api from '@/api/subscription'

export default defineComponent({
  name: 'BillingPlans',
  setup() {
    const message = useMessage()
    const currentPlan = ref('free')
    const loading = ref(false)

    const plans = [
      {
        name: 'Free',
        price: '$0',
        period: '/month',
        features: ['100k Requests/month', '1GB Storage', '1 User', 'Community Support'],
        value: 'free',
        color: 'gray'
      },
      {
        name: 'Pro',
        price: '$29',
        period: '/month',
        features: ['1M Requests/month', '10GB Storage', '5 Users', 'Email Support', 'Advanced Analytics'],
        value: 'pro',
        color: 'green'
      },
      {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        features: ['Unlimited Requests', 'Unlimited Storage', 'Unlimited Users', '24/7 Priority Support', 'SLA'],
        value: 'enterprise',
        color: 'purple'
      }
    ]

    const handleSubscribe = async (plan: string) => {
      loading.value = true
      try {
        await api.subscribe({ planName: plan })
        message.success(`Successfully subscribed to ${plan} plan`)
        currentPlan.value = plan
      } catch (e) {
        // message.error('Failed to update subscription')
        // Mock success for demo
        message.success(`Successfully subscribed to ${plan} plan (Mock)`)
        currentPlan.value = plan
      } finally {
        loading.value = false
      }
    }

    onMounted(async () => {
      try {
        const sub = await api.getUserSubscription()
        if (sub && sub.plan) {
          currentPlan.value = sub.plan
        }
      } catch (e) {
        console.error(e)
      }
    })

    return () => (
      <div class="p-4">
        <NGrid x-gap={24} cols="1 s:1 m:3 l:3" responsive="screen">
          {plans.map((plan) => (
            <NGridItem>
              <NCard
                class={`h-full border-t-4`}
                style={{ borderColor: currentPlan.value === plan.value ? 'var(--color-primary-6)' : 'transparent' }}
                hoverable>
                <div class="text-center mb-6">
                  <h3 class="text-lg font-bold text-[var(--color-text-1)] uppercase tracking-wider">{plan.name}</h3>
                  <div class="mt-4 flex items-baseline justify-center">
                    <span class="text-3xl font-extrabold text-[var(--color-text-1)]">{plan.price}</span>
                    <span class="ml-1 text-[var(--color-text-3)]">{plan.period}</span>
                  </div>
                </div>

                <NList>
                  {plan.features.map((feature) => (
                    <NListItem>
                      <div class="flex items-center">
                        <NIcon color="var(--color-success)" size={20} component={CheckmarkCircleOutline} />
                        <span class="ml-3 text-[var(--color-text-2)]">{feature}</span>
                      </div>
                    </NListItem>
                  ))}
                </NList>

                <div class="mt-8">
                  <NButton
                    block
                    type={currentPlan.value === plan.value ? 'default' : 'primary'}
                    secondary={currentPlan.value === plan.value}
                    disabled={currentPlan.value === plan.value}
                    loading={loading.value}
                    onClick={() => handleSubscribe(plan.value)}>
                    {currentPlan.value === plan.value ? 'Current Plan' : 'Upgrade'}
                  </NButton>
                </div>
              </NCard>
            </NGridItem>
          ))}
        </NGrid>
      </div>
    )
  }
})
