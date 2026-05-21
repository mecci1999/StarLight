import { defineComponent } from 'vue'
import AlertRulesPage from '@/domains/alerts/pages/AlertRulesPage'

export default defineComponent({
  name: 'AlertRulesLegacyEntry',
  setup() {
    return () => <AlertRulesPage />
  }
})
