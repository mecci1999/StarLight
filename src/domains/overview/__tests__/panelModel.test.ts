import { describe, expect, it } from 'vitest'
import {
  buildShippedOverviewPanels,
  buildOverviewWidgetEditorState,
  buildWidgetDraft,
  canWidgetUseSmallSize,
  createUserPanelDefinition,
  normalizeOverviewWidget,
  getAllowedWidgetVisualizations,
  type OverviewPanelWidget
} from '../panelModel'

describe('overview panel model', () => {
  it('ships system, preset, and widget-based panel definitions', () => {
    const panels = buildShippedOverviewPanels()

    expect(panels.some((panel) => panel.kind === 'system')).toBe(true)
    expect(panels.some((panel) => panel.kind === 'preset')).toBe(true)
    expect(panels[0]?.widgets.length).toBeGreaterThan(0)
    expect(panels[0]?.widgets.every((widget) => typeof widget.id === 'string' && typeof widget.kind === 'string')).toBe(
      true
    )
  })

  it('creates isolated user panels from an existing widget list', () => {
    const sourcePanel = buildShippedOverviewPanels()[0]
    const userPanel = createUserPanelDefinition('我的值班面板', sourcePanel.widgets)

    expect(userPanel.kind).toBe('user')
    expect(userPanel.name).toBe('我的值班面板')
    expect(userPanel.widgets).not.toBe(sourcePanel.widgets)
    expect(userPanel.widgets).toEqual(sourcePanel.widgets)
  })

  it('builds capability-aware widget drafts with typed defaults', () => {
    const draft = buildWidgetDraft('metric-summary', [
      { key: 'metrics', label: 'Metrics', available: true, frontendReady: true },
      { key: 'ingestion', label: 'Ingestion', available: true, frontendReady: true }
    ])
    const queryDraft = buildWidgetDraft('query-card', [
      { key: 'metrics', label: 'Metrics', available: true, frontendReady: true }
    ])
    const darwinDraft = buildWidgetDraft('darwin-infra-summary', [
      { key: 'metrics', label: 'Metrics', available: true, frontendReady: true },
      { key: 'ingestion', label: 'Ingestion', available: true, frontendReady: true }
    ])

    expect(draft.kind).toBe('metric-summary')
    expect(draft.size).toBe('S')
    expect((draft.config as { metricKey: string }).metricKey).toBe('total-requests')
    expect(queryDraft.kind).toBe('query-card')
    expect((queryDraft.config as { query: { metricRef: string } }).query.metricRef).toBe('service.cpu.usage')
    expect(darwinDraft.kind).toBe('darwin-infra-summary')
    expect(darwinDraft.size).toBe('S')
    expect((darwinDraft.config as { metric: string }).metric).toBe('cpu')
    expect(getAllowedWidgetVisualizations('darwin-infra-trend')).toEqual(['line', 'bar'])
    expect(getAllowedWidgetVisualizations('query-card')).toEqual(['number', 'line', 'bar', 'donut', 'table'])
  })

  it('preserves legacy summary metrics in editor state', () => {
    const editor = buildOverviewWidgetEditorState({
      id: 'legacy-summary',
      title: '服务总数',
      kind: 'metric-summary',
      size: 'S',
      capability: 'metrics',
      description: '',
      config: { metricKey: 'service-count' },
      editor: { displayedMetrics: ['service-count'], visualization: 'number', timeRange: '1h' }
    } as any)

    expect(editor.displayedMetrics).toEqual(['service-count'])
  })

  it('keeps query-card editor state and config.query in sync for time range and visualization', () => {
    const restored = buildOverviewWidgetEditorState({
      id: 'query-card-1',
      title: '开放查询卡',
      kind: 'query-card',
      size: 'M',
      capability: 'metrics',
      description: '',
      config: {
        query: {
          scope: 'tenant',
          sourceKind: 'auto',
          subject: { type: 'system' },
          metricRef: 'service.cpu.usage',
          aggregation: 'avg',
          timeRange: '-4h',
          visualizationHint: 'bar'
        }
      }
    } as any)

    expect(restored.timeRange).toBe('4h')
    expect(restored.visualization).toBe('bar')

    const normalized = normalizeOverviewWidget({
      id: 'query-card-2',
      title: '开放查询卡',
      kind: 'query-card',
      size: 'M',
      capability: 'metrics',
      description: '',
      config: {
        query: {
          scope: 'tenant',
          sourceKind: 'auto',
          subject: { type: 'system' },
          metricRef: 'service.cpu.usage',
          aggregation: 'avg',
          timeRange: '-1h',
          visualizationHint: 'line'
        }
      },
      editor: {
        timeGranularity: 'hour',
        timeRange: '7d',
        visualization: 'donut',
        displayedMetrics: [],
        compareEnabled: false,
        compareWindow: 'previous-period',
        display: {
          showTotal: true,
          showAverage: false,
          showPreviousPeriod: true,
          showSamePeriod: false
        },
        notes: ''
      }
    } as any)

    expect((normalized.config as any).query.timeRange).toBe('-7d')
    expect((normalized.config as any).query.visualizationHint).toBe('donut')
  })

  it('preserves query-card alert rules during widget normalization', () => {
    const widget: OverviewPanelWidget<'query-card'> = {
      id: 'query-card-alert',
      title: 'CPU 告警卡片',
      kind: 'query-card',
      size: 'M',
      capability: 'metrics',
      description: '',
      config: {
        query: {
          scope: 'system',
          sourceKind: 'auto',
          subject: { type: 'system' },
          metricRef: 'service.cpu.usage',
          aggregation: 'avg',
          timeRange: '-15m',
          visualizationHint: 'line',
          alert: {
            enabled: true,
            operator: '>',
            threshold: 90,
            unit: '%',
            duration: 5,
            level: 'warning',
            channels: ['InApp'],
            rules: [
              {
                level: 'warning',
                operator: '>',
                threshold: 90,
                unit: '%',
                duration: 5,
                channels: ['InApp']
              }
            ]
          }
        }
      },
      editor: {
        timeRange: '1h',
        visualization: 'bar'
      }
    }

    const normalized = normalizeOverviewWidget(widget)

    expect(normalized.config.query.alert).toEqual(widget.config.query.alert)
    expect(normalized.config.query.timeRange).toBe('-1h')
    expect(normalized.config.query.visualizationHint).toBe('bar')
  })

  it('keeps shared panel controls active for raw QuerySpec cards', () => {
    const normalized = normalizeOverviewWidget({
      id: 'query-card-raw',
      title: '开放查询卡',
      kind: 'query-card',
      size: 'M',
      capability: 'metrics',
      description: '',
      config: {
        query: {
          scope: 'system',
          sourceKind: 'auto',
          subject: { type: 'system' },
          metricRef: 'service.memory.usage.percent',
          aggregation: 'latest',
          timeRange: '-15m',
          visualizationHint: 'donut'
        }
      },
      editor: {
        queryEditMode: 'query-statement',
        timeGranularity: 'hour',
        timeRange: '7d',
        visualization: 'line',
        displayedMetrics: [],
        compareEnabled: false,
        compareWindow: 'previous-period',
        display: {
          showTotal: true,
          showAverage: false,
          showPreviousPeriod: true,
          showSamePeriod: false
        },
        notes: ''
      }
    } as any)

    expect(normalized.editor?.queryEditMode).toBe('query-statement')
    expect((normalized.config as any).query.timeRange).toBe('-7d')
    expect((normalized.config as any).query.visualizationHint).toBe('line')
  })

  it('allows compact widgets to use S while keeping dense widgets excluded', () => {
    expect(
      canWidgetUseSmallSize({
        kind: 'query-card',
        config: {
          query: {
            scope: 'tenant',
            sourceKind: 'auto',
            subject: { type: 'system' },
            metricRef: 'service.cpu.usage',
            aggregation: 'avg',
            visualizationHint: 'table'
          }
        },
        editor: { visualization: 'table' }
      } as any)
    ).toBe(true)

    expect(
      canWidgetUseSmallSize({
        kind: 'trend',
        config: { metric: 'requests', aggregation: 'sum', groupBy: 'overall' },
        editor: { visualization: 'line' }
      } as any)
    ).toBe(true)

    expect(
      canWidgetUseSmallSize({
        kind: 'darwin-infra-trend',
        config: { metric: 'cpu', aggregation: 'avg' },
        editor: { visualization: 'bar' }
      } as any)
    ).toBe(true)

    expect(
      canWidgetUseSmallSize({
        kind: 'risk-service',
        config: { limit: 6 },
        editor: { visualization: 'table' }
      } as any)
    ).toBe(false)

    expect(
      canWidgetUseSmallSize({
        kind: 'quick-pivot',
        config: { links: [{ key: 'services', visible: true }] },
        editor: { visualization: 'table' }
      } as any)
    ).toBe(false)
  })

  it('normalizes S widgets using compact-vs-dense eligibility instead of number-only visualization', () => {
    const compactTrend = normalizeOverviewWidget({
      id: 'trend-compact',
      title: '请求趋势',
      kind: 'trend',
      size: 'S',
      capability: 'metrics',
      description: '',
      config: {
        metric: 'requests',
        aggregation: 'sum',
        groupBy: 'overall',
        compareWindow: 'previous-period'
      },
      editor: {
        timeGranularity: 'hour',
        timeRange: '1h',
        visualization: 'line',
        displayedMetrics: ['requests'],
        compareEnabled: false,
        compareWindow: 'previous-period',
        display: {
          showTotal: true,
          showAverage: false,
          showPreviousPeriod: true,
          showSamePeriod: false
        },
        notes: ''
      }
    } as any)

    const denseRisk = normalizeOverviewWidget({
      id: 'risk-dense',
      title: '风险服务',
      kind: 'risk-service',
      size: 'S',
      capability: 'serviceCatalog',
      description: '',
      config: { limit: 6 },
      editor: {
        timeGranularity: 'hour',
        timeRange: '1h',
        visualization: 'table',
        displayedMetrics: [],
        compareEnabled: false,
        compareWindow: 'previous-period',
        display: {
          showTotal: true,
          showAverage: false,
          showPreviousPeriod: true,
          showSamePeriod: false
        },
        notes: ''
      }
    } as any)

    const compactQueryCard = normalizeOverviewWidget({
      id: 'query-small',
      title: '开放查询卡',
      kind: 'query-card',
      size: 'S',
      capability: 'metrics',
      description: '',
      config: {
        query: {
          scope: 'tenant',
          sourceKind: 'auto',
          subject: { type: 'system' },
          metricRef: 'service.cpu.usage',
          aggregation: 'avg',
          timeRange: '-1h',
          visualizationHint: 'table'
        }
      },
      editor: {
        timeGranularity: 'hour',
        timeRange: '4h',
        visualization: 'table',
        displayedMetrics: [],
        compareEnabled: false,
        compareWindow: 'previous-period',
        display: {
          showTotal: true,
          showAverage: false,
          showPreviousPeriod: true,
          showSamePeriod: false
        },
        notes: ''
      }
    } as any)

    expect(compactTrend.size).toBe('S')
    expect(denseRisk.size).toBe('M')
    expect(compactQueryCard.size).toBe('S')
    expect((compactQueryCard.config as any).query.timeRange).toBe('-4h')
    expect((compactQueryCard.config as any).query.visualizationHint).toBe('table')
  })
})
