import { defineComponent } from 'vue'
import ServiceOverviewDashboardPage from '@/domains/overview/pages/ServiceOverviewDashboardPage'

// TODO(refactor-phase0): remove this legacy service-overview compatibility entry after remaining external/manual entrypoints are retired.
// The domain-owned ServiceOverviewDashboardPage is now the single owner of the service-overview dashboard preset.
export default defineComponent({
  name: 'ServiceOverviewLegacyEntry',
  setup() {
    return () => <ServiceOverviewDashboardPage />
  }
})
