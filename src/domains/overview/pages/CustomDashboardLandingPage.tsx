import { defineComponent } from 'vue'
import CustomDashboardPage from './CustomDashboardPage'

export default defineComponent({
  name: 'CustomDashboardLandingPage',
  setup() {
    return () => (
      <CustomDashboardPage
        pageTitle="自定义面板"
        pageSubtitle="实时监控系统性能与健康状态，支持按需组合展示内容"
        storageKey="starlight_custom_dashboard_layout"
        templateStorageKey="starlight_custom_dashboard_templates"
        startInEditMode={false}
        useDefaultTemplate={true}
        hideControls={false}
      />
    )
  }
})
