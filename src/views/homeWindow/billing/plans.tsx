import { defineComponent } from 'vue'
import PlansTab from '@/domains/admin/components/billing/PlansTab'

export default defineComponent({
  name: 'BillingPlansLegacyEntry',
  setup() {
    return () => <PlansTab />
  }
})
