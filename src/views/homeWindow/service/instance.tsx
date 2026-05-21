import { defineComponent } from 'vue'
import InstanceMonitorPage from '@/domains/service/pages/InstanceMonitorPage'

export default defineComponent({
  name: 'InstanceMonitorLegacyEntry',
  setup() {
    return () => <InstanceMonitorPage />
  }
})
