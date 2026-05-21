import { defineComponent } from 'vue'
import CustomDashboardEditorPage from '@/domains/overview/pages/CustomDashboardEditorPage'

// TODO(refactor-phase0): remove this legacy dashboard-editor compatibility entry after remaining external/manual entrypoints are retired.
// The domain-owned CustomDashboardEditorPage is now the single owner of the editor preset.
export default defineComponent({
  name: 'DashboardEditorLegacyEntry',
  setup() {
    return () => <CustomDashboardEditorPage />
  }
})
