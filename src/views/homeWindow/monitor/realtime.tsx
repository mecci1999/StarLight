import { defineComponent } from 'vue'
import RealtimeMonitorPage from '@/domains/overview/pages/RealtimeMonitorPage'

export default defineComponent({
  name: 'RealtimeMonitorLegacyEntry',
  setup() {
    return () => <RealtimeMonitorPage />
  }
})
