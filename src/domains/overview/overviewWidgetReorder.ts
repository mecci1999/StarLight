import type { OverviewPanelWidget } from './panelModel'

export type OverviewReorderPlacement = 'before' | 'after'

export function reorderVisibleWidgetIds(
  widgetIds: string[],
  dragId: string,
  targetId: string,
  placement: OverviewReorderPlacement
) {
  if (!dragId || !targetId || dragId === targetId) return widgetIds

  const nextIds = [...widgetIds]
  const fromIndex = nextIds.indexOf(dragId)
  const targetIndex = nextIds.indexOf(targetId)
  if (fromIndex === -1 || targetIndex === -1) return widgetIds

  const [moved] = nextIds.splice(fromIndex, 1)
  const rawInsertIndex = placement === 'before' ? targetIndex : targetIndex + 1
  const insertIndex = fromIndex < rawInsertIndex ? rawInsertIndex - 1 : rawInsertIndex
  nextIds.splice(insertIndex, 0, moved)
  return nextIds
}

export function applyVisibleOrderToPanelWidgets(panelWidgets: OverviewPanelWidget[], visibleOrderIds: string[]) {
  if (!visibleOrderIds.length) return panelWidgets

  const visibleWidgetMap = new Map(panelWidgets.map((widget) => [widget.id, widget]))
  const nextVisibleWidgets = visibleOrderIds
    .map((widgetId) => visibleWidgetMap.get(widgetId))
    .filter((widget): widget is OverviewPanelWidget => Boolean(widget))

  let visibleIndex = 0
  return panelWidgets.map((widget) => {
    if (!visibleOrderIds.includes(widget.id)) return widget
    const nextWidget = nextVisibleWidgets[visibleIndex]
    visibleIndex += 1
    return nextWidget || widget
  })
}
