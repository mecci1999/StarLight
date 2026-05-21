import { defineComponent } from 'vue'
import ServiceCatalogPage from '@/domains/service/pages/ServiceCatalogPage'

// TODO(refactor-phase0): remove this legacy service-list compatibility entry after any remaining external/manual entrypoints are retired.
// The domain-owned ServiceCatalogPage is now the single implementation owner.
export default defineComponent({
  name: 'ServiceListLegacyEntry',
  setup() {
    return () => <ServiceCatalogPage />
  }
})
