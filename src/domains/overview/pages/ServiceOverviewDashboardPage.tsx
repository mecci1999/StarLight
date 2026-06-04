import { defineComponent } from 'vue'
import CustomDashboardPage from './CustomDashboardPage'

export default defineComponent({
  name: 'ServiceOverviewDashboardPage',
  setup() {
    return () => (
      <CustomDashboardPage
        pageTitle="看板"
        pageSubtitle="拖拽组件，连接数据，快速构建可视化平台"
        storageKey="starlight_service_overview_layout"
        templateStorageKey="starlight_service_overview_templates"
        startInEditMode={false}
        useDefaultTemplate={false}
        hideControls={true}
      />
    )
  }
})
