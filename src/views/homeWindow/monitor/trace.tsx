import { defineComponent } from 'vue'
import TraceExplorerPage from '@/domains/trace/pages/TraceExplorerPage'

export default defineComponent({
  name: 'TraceExplorerLegacyEntry',
  setup() {
    return () => <TraceExplorerPage />
  }
})
