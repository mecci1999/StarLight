import { defineComponent, ref } from 'vue'
import { NTabs, NTabPane, NCard } from 'naive-ui'
import Usage from './usage'
import Plans from './plans'
import Payment from './payment'

export default defineComponent({
  name: 'Billing',
  setup() {
    return () => (
      <div class="h-full flex flex-col p-4 bg-[var(--color-bg-1)]">
        <h2 class="text-xl font-bold mb-4 text-[var(--color-text-1)]">Billing & Subscription</h2>
        <NCard class="flex-1">
          <NTabs type="line" animated>
            <NTabPane name="usage" tab="Usage Statistics">
              <Usage />
            </NTabPane>
            <NTabPane name="plans" tab="Plans & Subscription">
              <Plans />
            </NTabPane>
            <NTabPane name="payment" tab="Payment Methods">
              <Payment />
            </NTabPane>
          </NTabs>
        </NCard>
      </div>
    )
  }
})
