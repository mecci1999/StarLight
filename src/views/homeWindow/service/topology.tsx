import { defineComponent } from 'vue'
import TopologyPage from '@/domains/service/pages/TopologyPage'

// TODO(refactor-phase0): keep this legacy entry only while old imports still exist.
// Remove it after the remaining topology entrypoints finish converging on domains/service/pages/TopologyPage.

export default defineComponent({
  name: 'ServiceTopologyLegacyEntry',
  setup() {
    return () => <TopologyPage />
  }
})
