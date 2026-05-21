import { defineComponent } from 'vue'
import PaymentTab from '@/domains/admin/components/billing/PaymentTab'

export default defineComponent({
  name: 'BillingPaymentLegacyEntry',
  setup() {
    return () => <PaymentTab />
  }
})
