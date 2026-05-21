import { defineComponent } from 'vue'
import BillingPage from '@/domains/admin/pages/BillingPage'

export default defineComponent({
  name: 'BillingLegacyEntry',
  setup() {
    return () => <BillingPage />
  }
})
