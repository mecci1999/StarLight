import { defineComponent } from 'vue'
import LogExplorerPage from '@/domains/logs/pages/LogExplorerPage'

export default defineComponent({
  name: 'ServiceLogsLegacyEntry',
  setup() {
    return () => <LogExplorerPage />
  }
})
