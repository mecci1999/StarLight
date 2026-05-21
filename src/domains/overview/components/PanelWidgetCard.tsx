import { defineComponent, PropType } from 'vue'
import { NButton, NButtonGroup, NCard, NTag } from 'naive-ui'
import {
  type OverviewCapabilityKey,
  type OverviewPanelWidget,
  type OverviewWidgetKind,
  type OverviewWidgetSize,
  getWidgetSizeSpan
} from '@/domains/overview/panelModel'
import './PanelWidgetCard.scss'

const widgetKindLabels: Record<OverviewWidgetKind, string> = {
  'query-card': '开放查询卡',
  'metric-summary': '指标摘要',
  'risk-service': '风险服务',
  incident: '事件列表',
  'ingest-status': '接入状态',
  trend: '趋势图',
  'quick-pivot': '快捷入口',
  'darwin-infra-summary': '资源摘要',
  'darwin-infra-trend': '资源趋势',
  'darwin-instance-table': '实例资源'
}

const capabilityLabels: Record<OverviewCapabilityKey, string> = {
  metrics: '指标',
  logs: '日志',
  traces: '链路',
  alerts: '告警',
  serviceCatalog: '服务目录',
  ingestion: '接入'
}

export default defineComponent({
  name: 'PanelWidgetCard',
  props: {
    widget: { type: Object as PropType<OverviewPanelWidget>, required: true },
    editMode: { type: Boolean, default: false },
    panelEditable: { type: Boolean, default: true }
  },
  emits: ['configure', 'remove', 'resize', 'reorder-pointerdown'],
  setup(props, { emit, slots }) {
    const sizeOptions: OverviewWidgetSize[] = ['S', 'M', 'L']

    return () => (
      <NCard bordered class="panel-widget-card">
        <div class="panel-widget-card__header">
          <div class="panel-widget-card__main">
            <div class="panel-widget-card__title-row">
              <div class="panel-widget-card__title">{props.widget.title}</div>
              <div class="panel-widget-card__meta">
                <NTag size="small" bordered={false} type={props.widget.future ? 'warning' : 'default'}>
                  {widgetKindLabels[props.widget.kind]}
                </NTag>
                <NTag size="small" bordered={false} type="info">
                  {capabilityLabels[props.widget.capability]}
                </NTag>
              </div>
            </div>
            <div class="panel-widget-card__description">{props.widget.description}</div>
          </div>
          {props.editMode && props.panelEditable ? (
            <div class="panel-widget-card__controls">
              <div class="panel-widget-card__control-hint">
                <NTag size="small" bordered={false}>
                  拖拽排序 · span {getWidgetSizeSpan(props.widget.size)}/12
                </NTag>
              </div>
              <div
                class="panel-widget-card__control-row panel-widget-card__control-row--handle"
                onPointerdown={(event: PointerEvent) => emit('reorder-pointerdown', event)}>
                <NButton size="small" secondary class="panel-widget-card__drag-handle">
                  拖拽排序
                </NButton>
              </div>
              <div class="panel-widget-card__control-row">
                <NButtonGroup size="small">
                  {sizeOptions.map((size) => (
                    <NButton
                      key={size}
                      type={props.widget.size === size ? 'primary' : 'default'}
                      secondary={props.widget.size !== size}
                      onClick={() => emit('resize', size)}>
                      {size}
                    </NButton>
                  ))}
                </NButtonGroup>
              </div>
              <div class="panel-widget-card__actions">
                <NButton size="small" quaternary onClick={() => emit('configure')}>
                  编辑
                </NButton>
                <NButton size="small" quaternary type="error" onClick={() => emit('remove')}>
                  删除组件
                </NButton>
              </div>
            </div>
          ) : null}
        </div>
        <div class="panel-widget-card__content">{slots.default?.()}</div>
      </NCard>
    )
  }
})
