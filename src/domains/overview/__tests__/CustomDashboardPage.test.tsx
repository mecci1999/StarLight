// @vitest-environment jsdom
import { defineComponent, h, reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CustomDashboardPage from '../pages/CustomDashboardPage'

const apiMocks = vi.hoisted(() => ({
  fetchCatalogServices: vi.fn(),
  fetchMetricsExplorer: vi.fn(),
  fetchMetricsSchema: vi.fn(),
  previewMetricCard: vi.fn(),
  compileMetricQuery: vi.fn(),
  validateMetricQuery: vi.fn(),
  queryMetricCards: vi.fn(),
  getDashboardState: vi.fn(),
  saveDashboardState: vi.fn(),
  fetchOverviewSummary: vi.fn(),
  fetchRealtimeOverview: vi.fn(),
  fetchAlerts: vi.fn(),
  saveAlertRule: vi.fn(),
  updateAlertRule: vi.fn()
}))
const authState = vi.hoisted(() => ({
  user: { isAdmin: false }
}))

const routeState = reactive({
  query: {
    scope: 'system',
    serviceId: 'svc-1',
    prefillTitle: 'CPU 趋势',
    startAdd: '1'
  }
})

vi.mock('@/api', () => ({
  fetchCatalogServices: apiMocks.fetchCatalogServices,
  fetchMetricsExplorer: apiMocks.fetchMetricsExplorer,
  fetchMetricsSchema: apiMocks.fetchMetricsSchema,
  previewMetricCard: apiMocks.previewMetricCard,
  compileMetricQuery: apiMocks.compileMetricQuery,
  validateMetricQuery: apiMocks.validateMetricQuery,
  queryMetricCards: apiMocks.queryMetricCards,
  getDashboardState: apiMocks.getDashboardState,
  saveDashboardState: apiMocks.saveDashboardState,
  fetchOverviewSummary: apiMocks.fetchOverviewSummary,
  fetchRealtimeOverview: apiMocks.fetchRealtimeOverview
}))

vi.mock('@/api/alerts', () => ({
  fetchAlerts: apiMocks.fetchAlerts,
  saveAlertRule: apiMocks.saveAlertRule,
  updateAlertRule: apiMocks.updateAlertRule
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState
}))

vi.mock('@/services/authSession', async () => {
  const actual = await vi.importActual('@/services/authSession')
  return {
    ...actual,
    getPreferredMetricsDatasetScope: vi.fn(() => 'tenant'),
    getStoredUserInfo: vi.fn(() => authState.user)
  }
})

vi.mock('naive-ui', () => {
  const passthrough = (tag: string) =>
    defineComponent({
      name: `Stub${tag}`,
      setup(_, { slots }) {
        return () => h(tag, {}, slots.default?.())
      }
    })

  const tabsLike = defineComponent({
    name: 'StubTabs',
    props: ['value', 'onUpdateValue'],
    emits: ['update:value'],
    setup(props, { emit, slots }) {
      const updateValue = (value: string) => {
        emit('update:value', value)
        props.onUpdateValue?.(value)
      }
      return () =>
        h('div', { 'data-component': 'tabs' }, [
          h(
            'button',
            {
              'data-active': props.value === 'form-builder',
              onClick: () => updateValue('form-builder')
            },
            '表单组装'
          ),
          h(
            'button',
            {
              'data-active': props.value === 'query-statement',
              onClick: () => updateValue('query-statement')
            },
            '查询语句'
          ),
          slots.default?.()
        ])
    }
  })

  const inputLike = defineComponent({
    name: 'StubInput',
    props: ['value', 'placeholder', 'type', 'readonly'],
    emits: ['update:value'],
    setup(props, { emit, slots }) {
      const tag = props.type === 'textarea' ? 'textarea' : 'input'
      return () =>
        h('div', {}, [
          h(tag, {
            value: props.value,
            placeholder: props.placeholder,
            type: props.type || 'text',
            readonly: props.readonly,
            onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value)
          }),
          slots.default?.()
        ])
    }
  })

  const inputNumberLike = defineComponent({
    name: 'StubInputNumber',
    props: ['value', 'placeholder', 'min', 'onUpdateValue'],
    emits: ['update:value'],
    setup(props, { emit }) {
      const updateValue = (nextValue: number | null) => {
        emit('update:value', nextValue)
        props.onUpdateValue?.(nextValue)
      }
      return () =>
        h('input', {
          value: props.value ?? '',
          placeholder: props.placeholder,
          type: 'number',
          min: props.min,
          onInput: (event: Event) => {
            const value = (event.target as HTMLInputElement).value
            updateValue(value === '' ? null : Number(value))
          }
        })
    }
  })

  const switchLike = defineComponent({
    name: 'StubSwitch',
    props: ['value', 'onUpdateValue'],
    emits: ['update:value'],
    setup(props, { emit }) {
      const updateValue = (nextValue: boolean) => {
        emit('update:value', nextValue)
        props.onUpdateValue?.(nextValue)
      }
      return () =>
        h('input', {
          type: 'checkbox',
          checked: Boolean(props.value),
          onChange: (event: Event) => updateValue((event.target as HTMLInputElement).checked)
        })
    }
  })

  const selectLike = defineComponent({
    name: 'StubSelect',
    props: ['value', 'options', 'placeholder', 'disabled', 'tag'],
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        props.tag
          ? h('input', {
              value: props.value,
              placeholder: props.placeholder,
              disabled: props.disabled,
              onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value)
            })
          : h(
              'select',
              {
                value: props.value,
                disabled: props.disabled,
                onChange: (event: Event) => emit('update:value', (event.target as HTMLSelectElement).value)
              },
              (props.options || []).map((option: any) => h('option', { value: option.value }, option.label))
            )
    }
  })

  return {
    NCard: passthrough('div'),
    NGrid: passthrough('div'),
    NGridItem: passthrough('div'),
    NModal: passthrough('div'),
    NForm: passthrough('form'),
    NFormItem: passthrough('div'),
    NStatistic: defineComponent({
      name: 'StubStatistic',
      props: ['label', 'value'],
      setup(props) {
        return () => h('div', { 'data-component': 'statistic' }, `${props.label || ''}:${props.value ?? ''}`)
      }
    }),
    NIcon: passthrough('span'),
    NList: passthrough('div'),
    NListItem: passthrough('div'),
    NThing: passthrough('div'),
    NEmpty: defineComponent({
      name: 'StubEmpty',
      props: ['description'],
      setup(props) {
        return () => h('div', {}, props.description)
      }
    }),
    NSpin: passthrough('div'),
    NSpace: passthrough('div'),
    NTag: defineComponent({
      name: 'StubTag',
      setup(_, { slots }) {
        return () => h('span', {}, slots.default?.())
      }
    }),
    NButton: defineComponent({
      name: 'StubButton',
      props: ['disabled', 'loading', 'type', 'ghost', 'size', 'quaternary'],
      emits: ['click'],
      setup(props, { emit, slots }) {
        return () =>
          h(
            'button',
            {
              disabled: props.disabled,
              onClick: () => emit('click')
            },
            slots.default?.()
          )
      }
    }),
    NTabs: tabsLike,
    NTabPane: defineComponent({
      name: 'StubTabPane',
      props: ['name', 'tab'],
      setup(props, { slots }) {
        return () => h('div', { 'data-tab-name': props.name }, slots.default?.())
      }
    }),
    NInput: inputLike,
    NInputNumber: inputNumberLike,
    NSelect: selectLike,
    NSwitch: switchLike,
    useMessage: () => ({ success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn() })
  }
})

vi.mock('@/components/charts/GaugeChart', () => ({
  default: defineComponent({
    props: ['max', 'unit'],
    setup: (props) => () => h('div', { 'data-component': 'gauge-chart' }, `gauge-chart:${props.max}:${props.unit}`)
  })
}))
vi.mock('@/components/charts/LineChart', () => ({
  default: defineComponent({
    props: ['yAxisMax', 'yAxisUnit', 'thresholdValue', 'thresholdUnit', 'thresholdLines'],
    setup: (props) => () =>
      h(
        'div',
        { 'data-component': 'line-chart' },
        `line-chart:${props.yAxisMax}:${props.yAxisUnit}:${
          (props.thresholdLines || []).map((line: any) => `${line.label}:${line.value}:${line.unit}`).join('|') ||
          `${props.thresholdValue}:${props.thresholdUnit}`
        }`
      )
  })
}))
vi.mock('@/components/charts/BarChart', () => ({
  default: defineComponent({
    props: ['yAxisMax', 'yAxisUnit'],
    setup: (props) => () =>
      h('div', { 'data-component': 'bar-chart' }, `bar-chart:${props.yAxisMax}:${props.yAxisUnit}`)
  })
}))
vi.mock('@/components/charts/PieChart', () => ({
  default: defineComponent({
    setup: () => () => h('div', { 'data-component': 'pie-chart' }, 'pie-chart')
  })
}))
vi.mock('@/shared/components/DetailDrawer', () => ({
  default: defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('div', {}, slots.default?.())
  })
}))
vi.mock('@/shared/layout/PageHeader', () => ({
  default: defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('div', {}, slots.default?.())
  })
}))

describe('CustomDashboardPage route context reactivity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeState.query = {
      scope: 'system',
      serviceId: 'svc-1',
      prefillTitle: 'CPU 趋势',
      startAdd: '1'
    }
    apiMocks.fetchOverviewSummary.mockResolvedValue({ totals: {} })
    apiMocks.fetchMetricsExplorer.mockResolvedValue({ series: {}, qps: [], responseTime: [] })
    apiMocks.fetchCatalogServices.mockResolvedValue({ items: [] })
    apiMocks.fetchAlerts.mockResolvedValue([])
    apiMocks.saveAlertRule.mockResolvedValue({ id: 'rule-1' })
    apiMocks.updateAlertRule.mockResolvedValue({ id: 'rule-1' })
    apiMocks.fetchRealtimeOverview.mockResolvedValue({ summary: {} })
    apiMocks.fetchMetricsSchema.mockResolvedValue({ items: [] })
    apiMocks.queryMetricCards.mockResolvedValue({ items: [] })
    apiMocks.getDashboardState.mockResolvedValue([])
    apiMocks.saveDashboardState.mockResolvedValue({})
    authState.user = { isAdmin: false }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reacts to route query updates for scope, serviceId, and prefill title', async () => {
    const wrapper = mount(CustomDashboardPage)
    await flushPromises()

    expect(apiMocks.fetchMetricsSchema).toHaveBeenCalledWith({ scope: 'system', serviceId: 'svc-1' })
    expect((wrapper.find('input[placeholder*="Gateway P95 延迟"]').element as HTMLInputElement).value).toBe('CPU 趋势')

    routeState.query = {
      scope: 'tenant',
      serviceId: 'svc-2',
      prefillTitle: 'Memory 趋势',
      startAdd: '1'
    }
    await flushPromises()

    expect(apiMocks.fetchMetricsSchema).toHaveBeenLastCalledWith({ scope: 'tenant', serviceId: 'svc-2' })
    expect((wrapper.find('input[placeholder*="Gateway P95 延迟"]').element as HTMLInputElement).value).toBe(
      'Memory 趋势'
    )
  })

  it('reloads catalog with new route context when modal is reopened after being closed', async () => {
    const wrapper = mount(CustomDashboardPage)
    await flushPromises()

    const closeButton = wrapper.findAll('button').find((item) => item.text() === '取消')
    expect(closeButton).toBeTruthy()
    await closeButton!.trigger('click')
    await flushPromises()

    routeState.query = {
      scope: 'tenant',
      serviceId: 'svc-2',
      prefillTitle: 'Memory 趋势',
      startAdd: '0'
    }
    await flushPromises()

    const addButton = wrapper.findAll('button').find((item) => item.text() === '添加组件')
    expect(addButton).toBeTruthy()
    await addButton!.trigger('click')
    await flushPromises()

    expect(apiMocks.fetchMetricsSchema).toHaveBeenLastCalledWith({ scope: 'tenant', serviceId: 'svc-2' })
  })

  it('restores saved custom widgets from dashboard state storage', async () => {
    apiMocks.getDashboardState.mockResolvedValue([
      {
        id: 'saved-query-1',
        title: '已保存 CPU',
        visualization: 'number',
        query: {
          scope: 'tenant',
          sourceKind: 'auto',
          subject: { type: 'system' },
          metricRef: 'service.cpu.usage',
          aggregation: 'avg',
          timeRange: '-1h',
          visualizationHint: 'number'
        }
      }
    ])
    apiMocks.queryMetricCards.mockResolvedValue({
      items: [
        {
          cardId: 'saved-query-1',
          status: 'success',
          data: { kind: 'number', value: 52 }
        }
      ]
    })
    apiMocks.fetchMetricsSchema.mockResolvedValue({ items: [] })

    mount(CustomDashboardPage)
    await flushPromises()

    expect(apiMocks.getDashboardState).toHaveBeenCalledWith('starlight_dashboard_layout', [])
    expect(apiMocks.queryMetricCards).toHaveBeenCalled()
    expect(apiMocks.queryMetricCards).toHaveBeenLastCalledWith(
      expect.objectContaining({
        cards: [
          expect.objectContaining({
            cardId: 'saved-query-1',
            query: expect.objectContaining({ timeRange: '-1h' })
          })
        ]
      })
    )
  })

  it('blocks saving a query card when backend validation rejects it', async () => {
    apiMocks.validateMetricQuery.mockResolvedValue({
      valid: false,
      issues: ['aggregation is unsupported for this metric']
    })

    const wrapper = mount(CustomDashboardPage)
    await flushPromises()
    const saveCallCountBeforeConfirm = apiMocks.saveDashboardState.mock.calls.length

    const saveButton = wrapper.findAll('button').find((item) => item.text() === '确认')
    expect(saveButton).toBeTruthy()
    await saveButton!.trigger('click')
    await flushPromises()

    expect(apiMocks.saveDashboardState).toHaveBeenCalledTimes(saveCallCountBeforeConfirm)
    expect(apiMocks.validateMetricQuery).toHaveBeenCalled()
  })

  it('applies editable QuerySpec JSON back into the add component form', async () => {
    authState.user = { isAdmin: true }
    const wrapper = mount(CustomDashboardPage)
    await flushPromises()

    const advancedButton = wrapper.findAll('button').find((item) => item.text() === '展开高级模式')
    expect(advancedButton).toBeTruthy()
    await advancedButton!.trigger('click')
    await flushPromises()

    const query = {
      scope: 'system',
      sourceKind: 'auto',
      subject: { type: 'system' },
      metricRef: 'service.memory.usage.percent',
      aggregation: 'latest',
      timeRange: '-15m',
      visualizationHint: 'donut'
    }
    const jsonInput = wrapper.find('textarea[placeholder*="QuerySpec"]')
    expect(jsonInput.exists()).toBe(true)
    await jsonInput.setValue(JSON.stringify({ query }))

    const applyButton = wrapper.findAll('button').find((item) => item.text() === '应用 JSON 配置')
    expect(applyButton).toBeTruthy()
    await applyButton!.trigger('click')
    await flushPromises()

    expect(
      wrapper
        .findAll('input')
        .some((input) => (input.element as HTMLInputElement).value === 'service.memory.usage.percent')
    ).toBe(true)
    expect(wrapper.text()).toContain('JSON 配置已应用到表单')
  })

  it('saves raw QuerySpec cards without forcing them through the form editor', async () => {
    apiMocks.validateMetricQuery.mockResolvedValue({ valid: true, issues: [], supported: true })
    const wrapper = mount(CustomDashboardPage)
    await flushPromises()

    const rawModeButton = wrapper.findAll('button').find((item) => item.text().includes('查询语句'))
    expect(rawModeButton).toBeTruthy()
    await rawModeButton!.trigger('click')
    await flushPromises()

    const query = {
      scope: 'system' as const,
      sourceKind: 'auto' as const,
      subject: { type: 'system' as const },
      metricRef: 'service.memory.usage.percent',
      aggregation: 'latest' as const,
      timeRange: '-15m',
      visualizationHint: 'donut' as const
    }
    const rawInput = wrapper.find('textarea[placeholder*="粘贴 QuerySpec"]')
    expect(rawInput.exists()).toBe(true)
    await rawInput.setValue(JSON.stringify({ query }))

    const saveButton = wrapper.findAll('button').find((item) => item.text() === '确认')
    expect(saveButton).toBeTruthy()
    await saveButton!.trigger('click')
    await flushPromises()

    expect(apiMocks.validateMetricQuery).toHaveBeenCalledWith(expect.objectContaining(query), 'system')
    expect(apiMocks.saveDashboardState).toHaveBeenLastCalledWith(
      'starlight_dashboard_layout',
      expect.arrayContaining([
        expect.objectContaining({
          sourceMode: 'query-statement',
          query: expect.objectContaining({ metricRef: 'service.memory.usage.percent' }),
          visualization: 'donut'
        })
      ])
    )
  })

  it('presents the add-card interaction as two clear workflows', async () => {
    const wrapper = mount(CustomDashboardPage)
    await flushPromises()

    expect(wrapper.text()).toContain('Card Builder')
    expect(wrapper.text()).toContain('用表单一步步组装卡片')
    expect(wrapper.text()).toContain('适合：新用户 / 标准监控卡片')
    expect(wrapper.text()).toContain('适合：专业用户 / 复杂查询 / 复制已有配置')

    const rawModeButton = wrapper.findAll('button').find((item) => item.text().includes('查询语句'))
    expect(rawModeButton).toBeTruthy()
    await rawModeButton!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('直接粘贴 QuerySpec 生成卡片')
    expect(wrapper.text()).toContain('必须包含：')
    expect(wrapper.find('textarea[placeholder*="粘贴 QuerySpec"]').exists()).toBe(true)
  })

  it('reopens saved raw QuerySpec cards in query-statement edit mode', async () => {
    authState.user = { isAdmin: false }
    apiMocks.getDashboardState.mockResolvedValue([
      {
        id: 'raw-card-1',
        title: 'Raw Memory',
        sourceMode: 'query-statement',
        visualization: 'donut',
        query: {
          scope: 'tenant',
          sourceKind: 'auto',
          subject: { type: 'system' },
          metricRef: 'service.memory.usage.percent',
          aggregation: 'latest',
          timeRange: '-15m',
          visualizationHint: 'donut'
        }
      }
    ])
    apiMocks.queryMetricCards.mockResolvedValue({
      items: [{ cardId: 'raw-card-1', status: 'success', data: { kind: 'number', value: 48 } }]
    })

    const wrapper = mount(CustomDashboardPage)
    await flushPromises()

    const editModeButton = wrapper.findAll('button').find((item) => item.text() === '编辑布局')
    expect(editModeButton).toBeTruthy()
    await editModeButton!.trigger('click')
    await flushPromises()

    const editButton = wrapper.findAll('button').find((item) => item.text() === '编辑组件')
    expect(editButton).toBeTruthy()
    await editButton!.trigger('click')
    await flushPromises()

    const rawInput = wrapper.find('textarea[placeholder*="粘贴 QuerySpec"]')
    expect(rawInput.exists()).toBe(true)
    expect((rawInput.element as HTMLTextAreaElement).value).toContain('service.memory.usage.percent')
    expect(wrapper.text()).toContain('查询语句')
    expect(wrapper.text()).toContain('不会反向改写表单字段')
  })

  it('renders donut number previews with GaugeChart instead of a statistic card', async () => {
    apiMocks.previewMetricCard.mockResolvedValue({
      data: { kind: 'number', value: 73 },
      supported: true
    })

    const wrapper = mount(CustomDashboardPage)
    await flushPromises()

    const metricRefInput = wrapper.find('input[placeholder*="指标"], input[placeholder="例如 service.cpu.usage"]')
    await metricRefInput.setValue('service.cpu.usage')

    const visualizationSelect = wrapper
      .findAll('select')
      .find((item) => item.findAll('option').some((option) => option.text() === '环图'))
    expect(visualizationSelect).toBeTruthy()
    await visualizationSelect!.setValue('donut')
    await flushPromises()

    const previewButton = wrapper.findAll('button').find((item) => item.text() === '预览查询')
    expect(previewButton).toBeTruthy()
    await previewButton!.trigger('click')
    await flushPromises()

    const previewPanel = wrapper.find('.custom-dashboard-page__preview-panel')
    expect(apiMocks.previewMetricCard).toHaveBeenCalled()
    expect(previewPanel.text()).toContain('gauge-chart')
    expect(previewPanel.text()).not.toContain('service.cpu.usage:73')
  })

  it('passes display max and unit settings to query card charts', async () => {
    apiMocks.getDashboardState.mockResolvedValue([
      {
        id: 'percent-line-card',
        title: 'CPU 百分比',
        visualization: 'line',
        query: {
          scope: 'tenant',
          sourceKind: 'auto',
          subject: { type: 'system' },
          metricRef: 'service.cpu.usage',
          aggregation: 'avg',
          timeRange: '-5m',
          visualizationHint: 'line',
          display: { value: { max: 100, unit: '%' } }
        }
      }
    ])
    apiMocks.queryMetricCards.mockResolvedValue({
      items: [
        {
          cardId: 'percent-line-card',
          status: 'success',
          data: {
            kind: 'timeseries',
            series: [{ name: 'CPU', points: [{ timestamp: Date.now(), value: 64 }] }]
          }
        }
      ]
    })

    const wrapper = mount(CustomDashboardPage)
    await flushPromises()

    expect(wrapper.text()).toContain('line-chart:100:%')
  })

  it('passes alert thresholds to query card line charts as guide lines', async () => {
    apiMocks.getDashboardState.mockResolvedValue([
      {
        id: 'percent-line-card',
        title: 'CPU 百分比',
        visualization: 'line',
        query: {
          scope: 'tenant',
          sourceKind: 'auto',
          subject: { type: 'system' },
          metricRef: 'service.cpu.usage',
          aggregation: 'avg',
          timeRange: '-5m',
          visualizationHint: 'line',
          display: { value: { max: 100, unit: '%' } },
          alert: {
            enabled: true,
            operator: '>',
            threshold: 80,
            unit: '%',
            duration: 5,
            level: 'warning',
            channels: ['Email']
          }
        }
      }
    ])
    apiMocks.queryMetricCards.mockResolvedValue({
      items: [
        {
          cardId: 'percent-line-card',
          status: 'success',
          data: {
            kind: 'timeseries',
            series: [{ name: 'CPU', points: [{ timestamp: Date.now(), value: 64 }] }]
          }
        }
      ]
    })

    const wrapper = mount(CustomDashboardPage)
    await flushPromises()

    expect(wrapper.text()).toContain('line-chart:100:%:警告:80:%')
  })

  it('saves builder display limits and creates alert rules from thresholds', async () => {
    apiMocks.validateMetricQuery.mockResolvedValue({ valid: true, issues: [], supported: true })
    const wrapper = mount(CustomDashboardPage)
    await flushPromises()

    expect(wrapper.text()).toContain('展示与规则')

    const maxInput = wrapper.find('input[placeholder="例如 100"]')
    expect(maxInput.exists()).toBe(true)
    await maxInput.setValue('100')

    const alertSwitch = wrapper.find('input[type="checkbox"]')
    expect(alertSwitch.exists()).toBe(true)
    await alertSwitch.setValue(true)
    await flushPromises()

    const thresholdInput = wrapper.find('input[placeholder="例如 85"]')
    expect(thresholdInput.exists()).toBe(true)
    await thresholdInput.setValue('80')

    const saveButton = wrapper.findAll('button').find((item) => item.text() === '确认')
    expect(saveButton).toBeTruthy()
    await saveButton!.trigger('click')
    await flushPromises()

    expect(apiMocks.validateMetricQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        display: { value: { min: 0, max: 100, unit: '%' } },
        alert: expect.objectContaining({
          enabled: true,
          operator: '>',
          threshold: 80,
          unit: '%',
          rules: expect.arrayContaining([
            expect.objectContaining({ level: 'warning', threshold: 80 }),
            expect.objectContaining({ level: 'critical', threshold: 95 })
          ])
        })
      }),
      'system'
    )
    expect(apiMocks.saveDashboardState).toHaveBeenLastCalledWith(
      'starlight_dashboard_layout',
      expect.arrayContaining([
        expect.objectContaining({
          query: expect.objectContaining({
            display: { value: { min: 0, max: 100, unit: '%' } },
            alert: expect.objectContaining({
              enabled: true,
              threshold: 80,
              rules: expect.arrayContaining([
                expect.objectContaining({ level: 'warning', threshold: 80 }),
                expect.objectContaining({ level: 'critical', threshold: 95 })
              ])
            })
          })
        })
      ])
    )
    expect(apiMocks.saveAlertRule).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'CPU 趋势 警告阈值告警',
        service: 'svc-1',
        metric: 'service.cpu.usage',
        operator: '>',
        threshold: 80,
        unit: '%',
        duration: 5,
        level: 'warning',
        enabled: true,
        channels: ['Email']
      })
    )
    expect(apiMocks.saveAlertRule).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'CPU 趋势 严重阈值告警',
        threshold: 95,
        duration: 3,
        level: 'critical'
      })
    )
    expect(apiMocks.saveDashboardState).toHaveBeenLastCalledWith(
      'starlight_dashboard_layout',
      expect.arrayContaining([
        expect.objectContaining({
          query: expect.objectContaining({
            alert: expect.objectContaining({
              enabled: true,
              threshold: 80,
              ruleId: 'rule-1',
              rules: expect.arrayContaining([
                expect.objectContaining({ level: 'warning', threshold: 80, ruleId: 'rule-1' }),
                expect.objectContaining({ level: 'critical', threshold: 95, ruleId: 'rule-1' })
              ])
            })
          })
        })
      ])
    )
    expect(wrapper.text()).toContain('警告')
    expect(wrapper.text()).toContain('严重')
    expect(wrapper.text()).toContain('> 80%，持续 5 分钟，通知 Email')
  })

  it('lets users add another alert threshold in the card builder', async () => {
    const wrapper = mount(CustomDashboardPage)
    await flushPromises()

    const alertSwitch = wrapper.find('input[type="checkbox"]')
    await alertSwitch.setValue(true)
    await flushPromises()

    expect(wrapper.text()).toContain('添加阈值')
    expect(wrapper.findAll('input[placeholder="例如 85"]')).toHaveLength(1)

    const addThresholdButton = wrapper.findAll('button').find((item) => item.text() === '添加阈值')
    expect(addThresholdButton).toBeTruthy()
    await addThresholdButton!.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('input[placeholder="例如 85"]')).toHaveLength(2)
  })

  it('updates existing alert rules when editing threshold cards', async () => {
    routeState.query = { scope: 'system', serviceId: 'svc-1', prefillTitle: '', startAdd: '0' }
    authState.user = { isAdmin: true }
    apiMocks.getDashboardState.mockResolvedValue([
      {
        id: 'cpu-card',
        title: 'CPU 百分比',
        visualization: 'line',
        sourceMode: 'form-builder',
        query: {
          scope: 'system',
          sourceKind: 'auto',
          subject: { type: 'service', id: 'svc-1' },
          metricRef: 'service.cpu.usage',
          aggregation: 'avg',
          timeRange: '-5m',
          visualizationHint: 'line',
          display: { value: { min: 0, max: 100, unit: '%' } },
          alert: {
            ruleId: 'rule-1',
            enabled: true,
            operator: '>',
            threshold: 75,
            unit: '%',
            duration: 5,
            level: 'warning',
            channels: ['Email']
          }
        }
      }
    ])
    apiMocks.queryMetricCards.mockResolvedValue({ items: [] })
    apiMocks.validateMetricQuery.mockResolvedValue({ valid: true, issues: [], supported: true })

    const wrapper = mount(CustomDashboardPage, { props: { startInEditMode: true } })
    await flushPromises()

    const editButton = wrapper.findAll('button').find((item) => item.text() === '编辑组件')
    expect(editButton).toBeTruthy()
    await editButton!.trigger('click')
    await flushPromises()

    const thresholdInput = wrapper.find('input[placeholder="例如 85"]')
    expect(thresholdInput.exists()).toBe(true)
    await thresholdInput.setValue('85')

    const saveButton = wrapper.findAll('button').find((item) => item.text() === '确认')
    expect(saveButton).toBeTruthy()
    await saveButton!.trigger('click')
    await flushPromises()

    expect(apiMocks.saveAlertRule).not.toHaveBeenCalled()
    expect(apiMocks.updateAlertRule).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'rule-1',
        service: 'svc-1',
        metric: 'service.cpu.usage',
        threshold: 85,
        unit: '%'
      })
    )
  })
})
