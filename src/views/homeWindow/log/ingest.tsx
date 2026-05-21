import { defineComponent } from 'vue'
import IngestionPage from '@/domains/admin/pages/IngestionPage'

export default defineComponent({
  name: 'LogIngestLegacyEntry',
  setup() {
    return () => <IngestionPage />
  }
})
