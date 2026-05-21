import { defineComponent } from 'vue'
import MetricsExplorerPage from '@/domains/metrics/pages/MetricsExplorerPage'

export default defineComponent({
  name: 'MetricsAnalysisLegacyEntry',
  setup() {
    return () => <MetricsExplorerPage />
  }
})
