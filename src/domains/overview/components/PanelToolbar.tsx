import { computed, defineComponent, PropType } from 'vue'
import { NButton, NCard, NDropdown, NSelect, NTag } from 'naive-ui'
import { type OverviewCapabilityState, type OverviewPanelDefinition } from '@/domains/overview/panelModel'
import './PanelToolbar.scss'

export default defineComponent({
  name: 'PanelToolbar',
  props: {
    panel: { type: Object as PropType<OverviewPanelDefinition>, required: true },
    panelOptions: { type: Array as PropType<OverviewPanelDefinition[]>, required: true },
    capabilities: { type: Array as PropType<OverviewCapabilityState[]>, required: true },
    canRestore: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: true },
    editMode: { type: Boolean, default: false }
  },
  emits: [
    'toggle-edit',
    'save-default',
    'add-widget',
    'change-panel',
    'duplicate-panel',
    'rename-panel',
    'delete-panel',
    'restore-panel'
  ],
  setup(props, { emit }) {
    const panelSelectOptions = computed(() =>
      props.panelOptions.map((panel) => ({
        label: panel.name,
        value: panel.id
      }))
    )

    const panelActionOptions = computed(() => {
      const actions = [{ label: '创建用户面板副本', key: 'duplicate' }]
      if (props.panel.kind === 'user') {
        actions.push({ label: '重命名当前面板', key: 'rename' })
        if (props.canRestore) {
          actions.push({ label: '恢复面板初始版本', key: 'restore' })
        }
        actions.push({ label: '删除当前面板', key: 'delete' })
      }
      return actions
    })

    const handlePanelAction = (key: string) => {
      if (key === 'duplicate') emit('duplicate-panel')
      if (key === 'rename') emit('rename-panel')
      if (key === 'restore') emit('restore-panel')
      if (key === 'delete') emit('delete-panel')
    }

    return () => (
      <NCard bordered={false} class="panel-toolbar">
        <div class="panel-toolbar__content">
          <div class="panel-toolbar__main">
            <div class="panel-toolbar__title-row">
              {props.panelOptions.length > 1 ? (
                <div class="panel-toolbar__panel-picker">
                  <NSelect
                    value={props.panel.id}
                    options={panelSelectOptions.value}
                    onUpdateValue={(value: string) => emit('change-panel', value)}
                  />
                </div>
              ) : (
                <div class="panel-toolbar__title">{props.panel.name}</div>
              )}
              {props.capabilities.map((capability) => (
                <NTag
                  key={capability.key}
                  size="small"
                  bordered={false}
                  type={capability.available ? (capability.frontendReady ? 'success' : 'warning') : 'default'}>
                  {capability.label}
                </NTag>
              ))}
            </div>
            <div class="panel-toolbar__description">{props.panel.description}</div>
          </div>
          <div class="panel-toolbar__actions">
            <div class="panel-toolbar__buttons">
              <NDropdown trigger="click" options={panelActionOptions.value as any} onSelect={handlePanelAction}>
                <NButton secondary>面板操作</NButton>
              </NDropdown>
              <NButton secondary onClick={() => emit('save-default')}>
                保存默认视角
              </NButton>
              <NButton secondary disabled={!props.canEdit} onClick={() => emit('toggle-edit')}>
                {props.editMode ? '完成编辑' : '编辑面板'}
              </NButton>
              {props.editMode && props.canEdit ? (
                <NButton type="primary" onClick={() => emit('add-widget')}>
                  添加组件
                </NButton>
              ) : null}
            </div>
          </div>
        </div>
      </NCard>
    )
  }
})
