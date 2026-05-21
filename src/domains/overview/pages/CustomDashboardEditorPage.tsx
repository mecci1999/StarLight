import { defineComponent } from 'vue'
import CustomDashboardPage from './CustomDashboardPage'

export default defineComponent({
  name: 'CustomDashboardEditorPage',
  setup() {
    return () => (
      <CustomDashboardPage
        pageTitle="监控画布编辑器"
        pageSubtitle="用更清晰的分区、预览卡片和轻量属性配置，快速搭出面向监控场景的组件画布。"
        storageKey="starlight_custom_dashboard_editor_layout"
        templateStorageKey="starlight_custom_dashboard_editor_templates"
        startInEditMode={true}
        useDefaultTemplate={false}
        hideControls={false}
      />
    )
  }
})
