import { describe, expect, it } from 'vitest'
import { normalizeOverviewWidget, type OverviewPanelDefinition } from '../panelModel'

describe('restore panel baselines', () => {
  it('keeps persisted baselines separate from edited saved panels across restore', () => {
    const savedPanel: OverviewPanelDefinition = {
      id: 'user-panel',
      name: '我的看板',
      description: '已编辑版本',
      kind: 'user',
      editable: true,
      widgets: [
        {
          id: 'widget-1',
          title: '请求总量（已编辑）',
          kind: 'metric-summary',
          size: 'S',
          capability: 'metrics',
          description: '',
          config: { metricKey: 'total-requests' },
          editor: { displayedMetrics: ['total-requests'], visualization: 'number', timeRange: '1h' }
        } as any
      ]
    }

    const savedBaseline: OverviewPanelDefinition = {
      id: 'user-panel',
      name: '我的看板',
      description: '初始版本',
      kind: 'user',
      editable: true,
      widgets: [
        {
          id: 'widget-1',
          title: '请求总量',
          kind: 'metric-summary',
          size: 'S',
          capability: 'metrics',
          description: '',
          config: { metricKey: 'total-requests' },
          editor: { displayedMetrics: ['total-requests'], visualization: 'number', timeRange: '1h' }
        } as any
      ]
    }

    const sanitizedPanels = [
      {
        ...savedPanel,
        widgets: savedPanel.widgets.map((widget) => normalizeOverviewWidget(widget))
      }
    ]

    const sanitizedBaselines = Object.fromEntries(
      Object.entries({ [savedBaseline.id]: savedBaseline }).map(([panelId, panel]) => [
        panelId,
        {
          ...panel,
          widgets: panel.widgets.map((widget) => normalizeOverviewWidget(widget))
        }
      ])
    ) as Record<string, OverviewPanelDefinition>

    expect(sanitizedPanels[0].description).toBe('已编辑版本')
    expect(sanitizedBaselines['user-panel'].description).toBe('初始版本')
    expect(sanitizedPanels[0].widgets[0].title).toBe('请求总量（已编辑）')
    expect(sanitizedBaselines['user-panel'].widgets[0].title).toBe('请求总量')
  })

  it('heals stale metric-summary config from persisted displayedMetrics during normalize', () => {
    const restored = normalizeOverviewWidget({
      id: 'legacy-summary',
      title: '错误率卡片',
      kind: 'metric-summary',
      size: 'S',
      capability: 'metrics',
      description: '',
      config: { metricKey: 'total-requests' },
      editor: { displayedMetrics: ['error-rate'], visualization: 'number', timeRange: '1h' }
    } as any)

    expect((restored.config as any).metricKey).toBe('error-rate')
    expect(restored.editor?.displayedMetrics).toEqual(['error-rate'])
  })

  it('does not fabricate a baseline when persisted baselines are missing', () => {
    const savedPanel: OverviewPanelDefinition = {
      id: 'user-panel-missing-baseline',
      name: '我的面板',
      description: '仅有已编辑版本',
      kind: 'user',
      editable: true,
      widgets: [
        {
          id: 'widget-1',
          title: '请求总量（已编辑）',
          kind: 'metric-summary',
          size: 'S',
          capability: 'metrics',
          description: '',
          config: { metricKey: 'total-requests' },
          editor: { displayedMetrics: ['total-requests'], visualization: 'number', timeRange: '1h' }
        } as any
      ]
    }

    const sanitizedPanels = [
      {
        ...savedPanel,
        widgets: savedPanel.widgets.map((widget) => normalizeOverviewWidget(widget))
      }
    ]

    const sanitizedBaselines = {}

    expect(sanitizedPanels).toHaveLength(1)
    expect(sanitizedBaselines).toEqual({})
  })
})
