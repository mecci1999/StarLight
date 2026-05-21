import { computed, defineComponent, onBeforeUnmount, onMounted, PropType, ref } from 'vue'
import { NButton, NCard, NCheckbox, NCheckboxGroup, NInput, NSelect, NTag } from 'naive-ui'
import DetailDrawer from '@/shared/components/DetailDrawer'
import type {
  OverviewCompareWindow,
  OverviewPanelWidget,
  OverviewWidgetDisplayMetricKey,
  OverviewWidgetEditorState,
  OverviewWidgetEditorTimeRange,
  OverviewWidgetSize,
  OverviewWidgetTimeGranularity,
  OverviewWidgetVisualization,
  OverviewWidgetKind
} from '@/domains/overview/panelModel'
import './OverviewAnalyticsWidgetEditor.scss'

type Option<T extends string> = {
  label: string
  value: T
  description?: string
}

export default defineComponent({
  name: 'OverviewAnalyticsWidgetEditor',
  props: {
    show: { type: Boolean, required: true },
    mode: { type: String as PropType<'create' | 'update'>, required: true },
    draft: { type: Object as PropType<OverviewPanelWidget>, required: true },
    widgetTypeOptions: { type: Array as PropType<Array<Option<OverviewWidgetKind>>>, required: true },
    granularityOptions: { type: Array as PropType<Array<Option<OverviewWidgetTimeGranularity>>>, required: true },
    timeRangeOptions: { type: Array as PropType<Array<Option<OverviewWidgetEditorTimeRange>>>, required: true },
    metricOptions: { type: Array as PropType<Array<Option<OverviewWidgetDisplayMetricKey>>>, required: true },
    comparisonOptions: { type: Array as PropType<Array<Option<OverviewCompareWindow>>>, required: true },
    sizeOptions: { type: Array as PropType<Array<Option<OverviewWidgetSize>>>, required: true },
    visualizationOptions: { type: Array as PropType<Array<Option<OverviewWidgetVisualization>>>, required: true },
    allowSmallSize: { type: Boolean, default: false },
    showTimeSettings: { type: Boolean, default: true },
    showMetricSelector: { type: Boolean, default: true },
    metricSelectorMultiple: { type: Boolean, default: true },
    showComparisonSelector: { type: Boolean, default: true },
    showDisplayOptions: { type: Boolean, default: true },
    showVisualizationOptions: { type: Boolean, default: true },
    settingsSectionTitle: { type: String, default: '专项设置' },
    settingsSectionDescription: { type: String, default: '补充当前卡片专属的数据来源和展示限制。' }
  },
  emits: ['update:show', 'update:draft', 'kind-change', 'confirm'],
  setup(props, { emit, slots }) {
    const layoutRef = ref<HTMLDivElement | null>(null)
    const formWidth = ref(500)
    const viewportWidth = ref(typeof window === 'undefined' ? 1440 : window.innerWidth)
    const activeCompactPanel = ref<'settings' | 'preview'>('settings')
    const isDragging = ref(false)
    const editor = computed(() => props.draft.editor as Required<OverviewWidgetEditorState>)
    const visualizationLabel = computed(
      () =>
        props.visualizationOptions.find((option) => option.value === editor.value.visualization)?.label ||
        editor.value.visualization
    )
    const viewportMode = computed<'split' | 'stacked' | 'compact'>(() => {
      if (viewportWidth.value <= 980) return 'compact'
      if (viewportWidth.value <= 1280) return 'stacked'
      return 'split'
    })
    const drawerWidth = computed<'lg' | 'xl'>(() => (viewportMode.value === 'split' ? 'xl' : 'lg'))
    const previewStateClasses = computed(() => [
      `is-mode-${viewportMode.value}`,
      `is-size-${props.draft.size.toLowerCase()}`,
      `is-visualization-${editor.value.visualization}`
    ])

    const syncViewportWidth = () => {
      viewportWidth.value = window.innerWidth
      if (viewportMode.value !== 'compact') activeCompactPanel.value = 'settings'
    }

    const handleDrawerVisibility = (value: boolean) => {
      emit('update:show', value)
      if (!value) {
        activeCompactPanel.value = 'settings'
        stopDragging()
      }
    }

    const stopDragging = () => {
      isDragging.value = false
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopDragging)
    }

    const handlePointerMove = (event: PointerEvent) => {
      const container = layoutRef.value
      if (!container || viewportMode.value !== 'split') return

      const rect = container.getBoundingClientRect()
      const nextWidth = event.clientX - rect.left
      const minWidth = 460
      const reservedPreviewWidth = 620
      const reservedSplitterWidth = 12
      const reservedGapWidth = 32
      const maxWidth = Math.min(720, rect.width - reservedPreviewWidth - reservedSplitterWidth - reservedGapWidth)
      formWidth.value = Math.min(Math.max(nextWidth, minWidth), maxWidth)
    }

    const startDragging = (event: PointerEvent) => {
      if (viewportMode.value !== 'split') return
      event.preventDefault()
      isDragging.value = true
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', stopDragging)
    }

    onMounted(() => {
      syncViewportWidth()
      window.addEventListener('resize', syncViewportWidth)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('resize', syncViewportWidth)
      stopDragging()
    })

    const updateDraft = (patch: Partial<OverviewPanelWidget>) => {
      emit('update:draft', patch)
    }

    const updateEditor = (patch: Partial<OverviewWidgetEditorState>) => {
      emit('update:draft', {
        editor: {
          ...(props.draft.editor as Required<OverviewWidgetEditorState>),
          ...patch,
          display: {
            ...(props.draft.editor?.display || {}),
            ...(patch.display || {})
          }
        }
      })
    }

    const renderFormColumn = () => (
      <div class="overview-analytics-editor__form-column">
        <NCard bordered={false} class="overview-analytics-editor__section-card">
          <div class="overview-analytics-editor__section-header">
            <div>
              <div class="overview-analytics-editor__section-title">基础信息</div>
              <div class="overview-analytics-editor__section-description">
                保留当前卡片来源类型，同时补齐名称、卡片描述与说明。
              </div>
            </div>
          </div>
          <div class="overview-analytics-editor__field-grid">
            <label class="overview-analytics-editor__field">
              <span class="overview-analytics-editor__label">组件名称</span>
              <NInput
                value={props.draft.title}
                placeholder="请输入组件名称"
                onUpdate:value={(value: string) => updateDraft({ title: value })}
              />
            </label>
            <label class="overview-analytics-editor__field">
              <span class="overview-analytics-editor__label">组件类型</span>
              <NSelect
                value={props.draft.kind}
                options={props.widgetTypeOptions}
                disabled={props.mode === 'update'}
                onUpdateValue={(value: OverviewWidgetKind) => emit('kind-change', value)}
              />
            </label>
          </div>
          <label class="overview-analytics-editor__field overview-analytics-editor__field--full">
            <span class="overview-analytics-editor__label">卡片描述</span>
            <NInput
              type="textarea"
              autosize={{ minRows: 2, maxRows: 4 }}
              value={props.draft.description}
              placeholder="用于展示在卡片头部的描述文案"
              onUpdate:value={(value: string) => updateDraft({ description: value })}
            />
          </label>
          <label class="overview-analytics-editor__field overview-analytics-editor__field--full">
            <span class="overview-analytics-editor__label">备注</span>
            <NInput
              type="textarea"
              autosize={{ minRows: 3, maxRows: 5 }}
              value={editor.value.notes || ''}
              placeholder="用于补充当前卡片的筛选说明或排查提示"
              onUpdate:value={(value: string) => updateEditor({ notes: value })}
            />
          </label>
        </NCard>

        {props.showTimeSettings ? (
          <NCard bordered={false} class="overview-analytics-editor__section-card">
            <div class="overview-analytics-editor__section-header">
              <div>
                <div class="overview-analytics-editor__section-title">时间与数据</div>
                <div class="overview-analytics-editor__section-description">
                  时间粒度决定可选时间范围，显示指标决定预览内容。
                </div>
              </div>
            </div>
            <div class="overview-analytics-editor__field-grid">
              <label class="overview-analytics-editor__field">
                <span class="overview-analytics-editor__label">时间粒度</span>
                <NSelect
                  value={editor.value.timeGranularity}
                  options={props.granularityOptions}
                  onUpdateValue={(value: OverviewWidgetTimeGranularity) => updateEditor({ timeGranularity: value })}
                />
              </label>
              <label class="overview-analytics-editor__field">
                <span class="overview-analytics-editor__label">时间范围</span>
                <NSelect
                  value={editor.value.timeRange}
                  options={props.timeRangeOptions}
                  onUpdateValue={(value: OverviewWidgetEditorTimeRange) => updateEditor({ timeRange: value })}
                />
              </label>
            </div>
            {props.showComparisonSelector ? (
              <label class="overview-analytics-editor__field overview-analytics-editor__field--full">
                <span class="overview-analytics-editor__label">过去时间范围对比</span>
                <NSelect
                  value={editor.value.compareEnabled ? editor.value.compareWindow : null}
                  clearable
                  options={props.comparisonOptions}
                  placeholder="可选，默认不启用对比"
                  onUpdateValue={(value: OverviewCompareWindow | null) =>
                    updateEditor({
                      compareEnabled: Boolean(value),
                      compareWindow: value || 'previous-period'
                    })
                  }
                />
              </label>
            ) : null}
            {props.showMetricSelector ? (
              <label class="overview-analytics-editor__field overview-analytics-editor__field--full">
                <span class="overview-analytics-editor__label">显示指标</span>
                <NSelect
                  value={
                    props.metricSelectorMultiple
                      ? editor.value.displayedMetrics
                      : editor.value.displayedMetrics[0] || null
                  }
                  multiple={props.metricSelectorMultiple}
                  maxTagCount={props.metricSelectorMultiple ? 'responsive' : undefined}
                  options={props.metricOptions}
                  placeholder="选择要展示的指标"
                  onUpdateValue={(value: OverviewWidgetDisplayMetricKey[] | OverviewWidgetDisplayMetricKey | null) =>
                    updateEditor({
                      displayedMetrics: props.metricSelectorMultiple
                        ? (value as OverviewWidgetDisplayMetricKey[]) || []
                        : value
                          ? [value as OverviewWidgetDisplayMetricKey]
                          : []
                    })
                  }
                />
              </label>
            ) : null}
          </NCard>
        ) : null}

        {renderSettingsSection()}

        <NCard bordered={false} class="overview-analytics-editor__section-card">
          <div class="overview-analytics-editor__section-header">
            <div>
              <div class="overview-analytics-editor__section-title">展示设置</div>
              <div class="overview-analytics-editor__section-description">
                紧凑型卡片支持 S 尺寸；内容较密集的列表与状态卡会自动保持至少 M。
              </div>
            </div>
          </div>
          {props.showVisualizationOptions ? (
            <div class="overview-analytics-editor__type-grid">
              {props.visualizationOptions.map((option) => {
                const active = editor.value.visualization === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    class={['overview-analytics-editor__type-card', active ? 'is-active' : '']}
                    onClick={() => updateEditor({ visualization: option.value })}>
                    <div class="overview-analytics-editor__type-card-top">
                      <span class="overview-analytics-editor__type-label">{option.label}</span>
                      {active ? (
                        <NTag size="small" type="success" bordered={false}>
                          当前
                        </NTag>
                      ) : null}
                    </div>
                    {option.description ? (
                      <div class="overview-analytics-editor__type-description">{option.description}</div>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : null}

          <div class="overview-analytics-editor__size-grid">
            {props.sizeOptions.map((option) => {
              const active = props.draft.size === option.value
              const disabled = option.value === 'S' && !props.allowSmallSize
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  class={[
                    'overview-analytics-editor__size-card',
                    active ? 'is-active' : '',
                    disabled ? 'is-disabled' : ''
                  ]}
                  onClick={() => {
                    if (!disabled) updateDraft({ size: option.value })
                  }}>
                  <div
                    class={`overview-analytics-editor__size-visual overview-analytics-editor__size-visual--${option.value.toLowerCase()}`}
                  />
                  <div class="overview-analytics-editor__size-copy">
                    <div class="overview-analytics-editor__size-title">{option.label}</div>
                    <div class="overview-analytics-editor__size-description">
                      {disabled ? '当前卡片内容较密集，最小为 M' : option.description || '适配当前布局'}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {props.showDisplayOptions ? (
            <label class="overview-analytics-editor__field overview-analytics-editor__field--full">
              <span class="overview-analytics-editor__label">同时显示</span>
              <NCheckboxGroup
                value={[
                  ...(editor.value.display.showTotal ? ['showTotal'] : []),
                  ...(editor.value.display.showAverage ? ['showAverage'] : []),
                  ...(editor.value.display.showPreviousPeriod ? ['showPreviousPeriod'] : []),
                  ...(editor.value.display.showSamePeriod ? ['showSamePeriod'] : [])
                ]}
                onUpdateValue={(value) => {
                  const selected = value as string[]
                  updateEditor({
                    display: {
                      showTotal: selected.includes('showTotal'),
                      showAverage: selected.includes('showAverage'),
                      showPreviousPeriod: selected.includes('showPreviousPeriod'),
                      showSamePeriod: selected.includes('showSamePeriod')
                    }
                  })
                }}>
                <div class="overview-analytics-editor__choice-list overview-analytics-editor__choice-list--compact">
                  {[
                    { value: 'showTotal', label: '合计', description: '显示统计总量' },
                    { value: 'showAverage', label: '均值', description: '显示平均水平' },
                    { value: 'showPreviousPeriod', label: '环比上期', description: '显示上一周期对比' },
                    { value: 'showSamePeriod', label: '同比时间范围', description: '显示同类时间窗口对比' }
                  ].map((option) => (
                    <label key={option.value} class="overview-analytics-editor__check-tile">
                      <NCheckbox value={option.value} />
                      <div>
                        <div class="overview-analytics-editor__check-title">{option.label}</div>
                        <div class="overview-analytics-editor__check-description">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </NCheckboxGroup>
            </label>
          ) : null}
        </NCard>
      </div>
    )

    const renderPreviewColumn = () => (
      <div class="overview-analytics-editor__preview-column">
        <NCard bordered={false} class="overview-analytics-editor__preview-card">
          <div class="overview-analytics-editor__preview-header">
            <div>
              <div class="overview-analytics-editor__section-title">实时预览</div>
              <div class="overview-analytics-editor__section-description">
                预览画布会根据当前尺寸与展示方式自动调整，让卡片形态更接近面板中的真实占位。
              </div>
            </div>
            <NTag size="small" bordered={false} type="info">
              {visualizationLabel.value}
            </NTag>
          </div>
          <div class="overview-analytics-editor__preview-meta">
            <span>{props.draft.title || '未命名卡片'}</span>
            <span>{props.draft.size} 卡片</span>
            <span>{editor.value.timeRange}</span>
            <span>{editor.value.displayedMetrics.length || 0} 项指标</span>
          </div>
          <div class="overview-analytics-editor__preview-body">
            <div class={['overview-analytics-editor__preview-canvas', ...previewStateClasses.value]}>
              <div class="overview-analytics-editor__preview-widget">
                <div class="overview-analytics-editor__preview-widget-header">
                  <div class="overview-analytics-editor__preview-widget-main">
                    <div class="overview-analytics-editor__preview-widget-title">
                      {props.draft.title || '未命名卡片'}
                    </div>
                    <div class="overview-analytics-editor__preview-widget-subtitle">
                      {props.draft.description ||
                        `${props.draft.size} 卡片 · ${visualizationLabel.value} · ${editor.value.timeRange}`}
                    </div>
                  </div>
                  <NTag size="small" bordered={false}>
                    {props.draft.size}
                  </NTag>
                </div>
                <div class="overview-analytics-editor__preview-widget-content">{slots.preview?.()}</div>
              </div>
            </div>
          </div>
        </NCard>
      </div>
    )

    const renderSettingsSection = () => {
      const content = slots.settings?.()
      if (!content || (Array.isArray(content) && !content.length)) return null

      return (
        <NCard bordered={false} class="overview-analytics-editor__section-card">
          <div class="overview-analytics-editor__section-header">
            <div>
              <div class="overview-analytics-editor__section-title">{props.settingsSectionTitle}</div>
              <div class="overview-analytics-editor__section-description">{props.settingsSectionDescription}</div>
            </div>
          </div>
          <div class="overview-analytics-editor__custom-settings">{content}</div>
        </NCard>
      )
    }

    return () => (
      <DetailDrawer
        show={props.show}
        title={props.mode === 'create' ? '添加卡片' : '编辑卡片'}
        width={drawerWidth.value}
        onUpdate:show={handleDrawerVisibility}>
        {{
          default: () => (
            <div class="overview-analytics-editor">
              {viewportMode.value === 'compact' ? (
                <div class="overview-analytics-editor__compact-switcher">
                  <button
                    type="button"
                    class={[
                      'overview-analytics-editor__compact-tab',
                      activeCompactPanel.value === 'settings' ? 'is-active' : ''
                    ]}
                    onClick={() => (activeCompactPanel.value = 'settings')}>
                    设置
                  </button>
                  <button
                    type="button"
                    class={[
                      'overview-analytics-editor__compact-tab',
                      activeCompactPanel.value === 'preview' ? 'is-active' : ''
                    ]}
                    onClick={() => (activeCompactPanel.value = 'preview')}>
                    预览
                  </button>
                </div>
              ) : null}

              <div
                ref={layoutRef}
                class={[
                  'overview-analytics-editor__layout',
                  `is-${viewportMode.value}`,
                  isDragging.value ? 'is-dragging' : ''
                ]}
                style={viewportMode.value === 'split' ? { '--editor-form-width': `${formWidth.value}px` } : undefined}>
                {viewportMode.value !== 'compact' || activeCompactPanel.value === 'settings'
                  ? renderFormColumn()
                  : null}
                {viewportMode.value === 'split' ? (
                  <div class="overview-analytics-editor__splitter" onPointerdown={startDragging} />
                ) : null}
                {viewportMode.value !== 'compact' || activeCompactPanel.value === 'preview'
                  ? renderPreviewColumn()
                  : null}
              </div>
            </div>
          ),
          footer: () => (
            <div class="overview-analytics-editor__footer">
              <NButton onClick={() => handleDrawerVisibility(false)}>取消</NButton>
              <NButton type="primary" onClick={() => emit('confirm')}>
                {props.mode === 'create' ? '添加卡片' : '保存配置'}
              </NButton>
            </div>
          )
        }}
      </DetailDrawer>
    )
  }
})
