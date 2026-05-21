import { describe, expect, it } from 'vitest'
import { normalizeOverviewWidget, type OverviewPanelDefinition } from '../panelModel'

describe('restore panel state behavior', () => {
  it('preserves mixed query and non-query widgets during restore normalization', () => {
    const savedPanel: OverviewPanelDefinition = {
      id: 'user-panel-1',
      name: '混合面板',
      description: '包含 query 与非 query 卡片',
      kind: 'user',
      editable: true,
      widgets: [
        {
          id: 'w-query',
          title: '请求总量',
          kind: 'metric-summary',
          size: 'S',
          capability: 'metrics',
          description: '',
          config: { metricKey: 'total-requests' },
          editor: { displayedMetrics: ['total-requests'], timeRange: '1h', visualization: 'number' }
        } as any,
        {
          id: 'w-non-query',
          title: '风险服务',
          kind: 'risk-service',
          size: 'M',
          capability: 'serviceCatalog',
          description: '',
          config: { limit: 6 },
          editor: { timeRange: '1h', visualization: 'table' }
        } as any
      ]
    }

    const restored = {
      ...savedPanel,
      widgets: savedPanel.widgets.map((widget) => normalizeOverviewWidget(widget))
    }

    expect(restored.widgets.map((widget) => widget.id)).toEqual(['w-query', 'w-non-query'])
  })

  it('preserves panels containing only non-query widgets during restore normalization', () => {
    const savedPanel: OverviewPanelDefinition = {
      id: 'user-panel-2',
      name: '非查询面板',
      description: '仅包含非 query 卡片',
      kind: 'user',
      editable: true,
      widgets: [
        {
          id: 'w-risk',
          title: '风险服务',
          kind: 'risk-service',
          size: 'M',
          capability: 'serviceCatalog',
          description: '',
          config: { limit: 6 },
          editor: { timeRange: '1h', visualization: 'table' }
        } as any
      ]
    }

    const restored = {
      ...savedPanel,
      widgets: savedPanel.widgets.map((widget) => normalizeOverviewWidget(widget))
    }

    expect(restored.widgets).toHaveLength(1)
    expect(restored.widgets[0].kind).toBe('risk-service')
  })

  it('keeps non-query widgets visible after restore normalization input remains intact', () => {
    const savedPanel: OverviewPanelDefinition = {
      id: 'user-panel-3',
      name: '事件与入口',
      description: '非查询卡片仍应可见',
      kind: 'user',
      editable: true,
      widgets: [
        {
          id: 'w-incident',
          title: '事件列表',
          kind: 'incident',
          size: 'M',
          capability: 'alerts',
          description: '',
          config: { limit: 5, severity: ['warning'], source: ['metrics'] },
          editor: { timeRange: '1h', visualization: 'table' }
        } as any,
        {
          id: 'w-pivot',
          title: '快捷入口',
          kind: 'quick-pivot',
          size: 'M',
          capability: 'serviceCatalog',
          description: '',
          config: { links: [{ key: 'services', visible: true }] },
          editor: { timeRange: '1h', visualization: 'table' }
        } as any
      ]
    }

    const restored = {
      ...savedPanel,
      widgets: savedPanel.widgets.map((widget) => normalizeOverviewWidget(widget))
    }

    expect(restored.widgets.map((widget) => widget.kind)).toEqual(['incident', 'quick-pivot'])
  })

  it('preserves ingestion cards during restore normalization', () => {
    const savedPanel: OverviewPanelDefinition = {
      id: 'user-panel-4',
      name: '接入面板',
      description: '接入状态卡片仍应保留',
      kind: 'user',
      editable: true,
      widgets: [
        {
          id: 'w-ingest',
          title: '接入状态',
          kind: 'ingest-status',
          size: 'M',
          capability: 'ingestion',
          description: '',
          config: { source: ['metrics', 'logs'] },
          editor: { timeRange: '1h', visualization: 'table' }
        } as any
      ]
    }

    const restored = {
      ...savedPanel,
      widgets: savedPanel.widgets.map((widget) => normalizeOverviewWidget(widget))
    }

    expect(restored.widgets).toHaveLength(1)
    expect(restored.widgets[0].kind).toBe('ingest-status')
  })
})
