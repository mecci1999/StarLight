import { defineComponent } from 'vue'
import UsageTab from '@/domains/admin/components/billing/UsageTab'

export default defineComponent({
  name: 'BillingUsageLegacyEntry',
  setup() {
    return () => <UsageTab />
  }
})
