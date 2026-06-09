import type { MetricsDatasetScope } from '@/api/metrics'
import type { CardData } from '@/domains/metrics/queryModel'
import { buildOverviewWidgetQueryPreviewSpec } from '@/domains/overview/overviewWidgetQueryPreviewModel'
import type { OverviewPanelWidget, OverviewWidgetKind } from '@/domains/overview/panelModel'
import type { ServiceItem } from '@/types/monitor'

export const QUERY_DRIVEN_OVERVIEW_WIDGET_KINDS: OverviewWidgetKind[] = [
  'query-card',
  'metric-summary',
  'trend',
  'darwin-infra-summary',
  'darwin-infra-trend',
  'darwin-instance-table'
]

export const isOverviewWidgetKindQueryDriven = (kind: OverviewWidgetKind) =>
  QUERY_DRIVEN_OVERVIEW_WIDGET_KINDS.includes(kind)

export const isOverviewWidgetQueryDriven = (widget: OverviewPanelWidget) => {
  if (!isOverviewWidgetKindQueryDriven(widget.kind)) return false
  const support = buildOverviewWidgetQueryPreviewSpec({
    widget,
    scope: 'system',
    scopedServiceName: null,
    services: []
  })
  return support.supported
}

export const buildOverviewCardsQueryRequest = (params: {
  widgets: OverviewPanelWidget[]
  scope: MetricsDatasetScope
  scopedServiceName: string | null
  services: ServiceItem[]
  refreshGenerationId?: string
  autoRefresh?: boolean
}) => {
  const cards = params.widgets
    .map((widget) => ({
      widget,
      support: buildOverviewWidgetQueryPreviewSpec({
        widget,
        scope: params.scope,
        scopedServiceName: params.scopedServiceName,
        services: params.services
      })
    }))
    .filter((entry) => entry.support.supported && entry.support.query)
    .map((entry) => ({
      cardId: entry.widget.id,
      priority:
        entry.widget.kind === 'metric-summary' || entry.widget.kind === 'darwin-infra-summary'
          ? ('high' as const)
          : ('normal' as const),
      query: entry.support.query!
    }))

  const request = {
    refreshGenerationId: params.refreshGenerationId || `${Date.now()}`,
    context: {
      scope: params.scope,
      timeRange: cards[0]?.query.timeRange || '-1h',
      autoRefresh: Boolean(params.autoRefresh)
    },
    cards
  }

  return {
    cards,
    request: cards.length
      ? request
      : {
          refreshGenerationId: params.refreshGenerationId || `${Date.now()}`,
          context: {
            scope: params.scope,
            timeRange: '-1h',
            autoRefresh: Boolean(params.autoRefresh)
          },
          cards: []
        },
    requests: cards.length ? [request] : []
  }
}

export const createEmptyOverviewPanel = (): {
  id: string
  name: string
  description: string
  kind: 'user'
  editable: true
  widgets: OverviewPanelWidget[]
} => ({
  id: 'user-overview',
  name: '我的看板',
  description: '从空白看板开始，按需新增指标卡片。',
  kind: 'user',
  editable: true,
  widgets: []
})

export const mapQueryResultsByWidgetId = (items: Array<{ cardId: string; data?: CardData; status: string }> = []) =>
  Object.fromEntries(
    items
      .filter((item) => item.status === 'success' || item.status === 'partial')
      .map((item) => [item.cardId, item.data || null])
  ) as Record<string, CardData | null>
