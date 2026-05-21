import { defineComponent, PropType } from 'vue'
import { NModal, NForm, NFormItem, NInput, NSelect, NButton } from 'naive-ui'
import './WidgetDrawer.scss'

type WidgetOption = {
  label: string
  value: string
}

type WidgetForm = {
  title: string
  type: string
  metric: string
}

export default defineComponent({
  name: 'AddWidgetDrawer',
  props: {
    show: { type: Boolean, default: false },
    form: { type: Object as PropType<WidgetForm>, required: true },
    widgetTypeOptions: { type: Array as PropType<WidgetOption[]>, required: true },
    widgetOptions: { type: Array as PropType<WidgetOption[]>, required: true }
  },
  emits: ['update:show', 'update:form', 'confirm'],
  setup(props, { emit }) {
    const updateField = (field: keyof WidgetForm, value: string) => {
      emit('update:form', {
        ...props.form,
        [field]: value
      })
    }

    return () => (
      <NModal
        show={props.show}
        preset="dialog"
        title="添加组件"
        onUpdate:show={(value: boolean) => emit('update:show', value)}>
        <NForm>
          <NFormItem label="组件名称">
            <NInput
              value={props.form.title}
              placeholder="请输入名称"
              onUpdate:value={(value: string) => updateField('title', value)}
            />
          </NFormItem>
          <NFormItem label="组件类型">
            <NSelect
              value={props.form.type}
              options={props.widgetTypeOptions}
              onUpdateValue={(value: string) => updateField('type', value)}
            />
          </NFormItem>
          <NFormItem label="指标类型">
            <NSelect
              value={props.form.metric}
              options={props.widgetOptions}
              onUpdateValue={(value: string) => updateField('metric', value)}
            />
          </NFormItem>
        </NForm>
        <div class="widget-drawer__actions">
          <NButton onClick={() => emit('update:show', false)}>取消</NButton>
          <NButton type="primary" onClick={() => emit('confirm')}>
            确认
          </NButton>
        </div>
      </NModal>
    )
  }
})
