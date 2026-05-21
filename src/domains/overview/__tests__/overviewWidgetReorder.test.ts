import { describe, expect, it } from 'vitest'
import { applyVisibleOrderToPanelWidgets, reorderVisibleWidgetIds } from '../overviewWidgetReorder'
import type { OverviewPanelWidget } from '../panelModel'

const buildWidget = (id: string): OverviewPanelWidget => ({
  id,
  title: id,
  kind: 'metric-summary',
  size: 'S',
  capability: 'metrics',
  description: id,
  config: { metricKey: 'service-count' }
})

describe('overview widget reorder helpers', () => {
  it('reorders visible widget ids before a target', () => {
    expect(reorderVisibleWidgetIds(['a', 'b', 'c'], 'c', 'a', 'before')).toEqual(['c', 'a', 'b'])
  })

  it('reorders visible widget ids after a target', () => {
    expect(reorderVisibleWidgetIds(['a', 'b', 'c'], 'a', 'b', 'after')).toEqual(['b', 'a', 'c'])
  })

  it('keeps ids unchanged for invalid or self-target reorder', () => {
    expect(reorderVisibleWidgetIds(['a', 'b'], 'a', 'a', 'before')).toEqual(['a', 'b'])
    expect(reorderVisibleWidgetIds(['a', 'b'], 'a', 'missing', 'before')).toEqual(['a', 'b'])
  })

  it('applies visible order back into full widget list without moving hidden widgets', () => {
    const panelWidgets = [
      buildWidget('a'),
      buildWidget('hidden-1'),
      buildWidget('b'),
      buildWidget('c'),
      buildWidget('hidden-2')
    ]

    const nextWidgets = applyVisibleOrderToPanelWidgets(panelWidgets, ['c', 'a', 'b'])

    expect(nextWidgets.map((widget) => widget.id)).toEqual(['c', 'hidden-1', 'a', 'b', 'hidden-2'])
  })
})
