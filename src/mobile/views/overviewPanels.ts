import { buildShippedOverviewPanels, type OverviewPanelDefinition } from '@/domains/overview/panelModel'

export const resolveMobileOverviewPanels = (
  restoredPanels?: OverviewPanelDefinition[] | null
): OverviewPanelDefinition[] => {
  if (restoredPanels?.some((panel) => panel.widgets.length > 0)) return restoredPanels

  const [defaultPanel] = buildShippedOverviewPanels()
  return defaultPanel ? [defaultPanel] : []
}
