import { defineComponent } from 'vue'
import NotificationCenterPage from '@/domains/alerts/pages/NotificationCenterPage'

export default defineComponent({
  name: 'AlertNotificationsLegacyEntry',
  setup() {
    return () => <NotificationCenterPage />
  }
})
