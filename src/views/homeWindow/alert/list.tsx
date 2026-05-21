import { defineComponent } from 'vue'
import AlertInboxPage from '@/domains/alerts/pages/AlertInboxPage'

export default defineComponent({
  name: 'AlertListLegacyEntry',
  setup() {
    return () => <AlertInboxPage />
  }
})
