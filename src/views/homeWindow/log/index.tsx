import { defineComponent } from 'vue'
import LogCenterPage from '@/domains/logs/pages/LogCenterPage'

export default defineComponent({
  name: 'LogCenterLegacyEntry',
  setup() {
    return () => <LogCenterPage />
  }
})
