import { defineComponent } from 'vue'
import CustomDashboardLandingPage from '@/domains/overview/pages/CustomDashboardLandingPage'

// TODO(refactor-phase0): remove this legacy dashboard compatibility entry after remaining external/manual entrypoints are retired.
// The domain-owned CustomDashboardLandingPage is now the single owner of the default dashboard preset.
export default defineComponent({
  name: 'CustomDashboardLegacyEntry',
  setup() {
    return () => <CustomDashboardLandingPage />
  }
})
