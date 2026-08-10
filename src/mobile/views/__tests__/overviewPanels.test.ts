import { describe, expect, it } from 'vitest'
import { buildShippedOverviewPanels, type OverviewPanelDefinition } from '@/domains/overview/panelModel'
import { resolveMobileOverviewPanels } from '../overviewPanels'

describe('mobile overview panel restoration', () => {
  it('keeps a restored panel set when it supplies widgets', () => {
    const restoredPanels = buildShippedOverviewPanels().slice(1, 2)

    expect(resolveMobileOverviewPanels(restoredPanels)).toBe(restoredPanels)
  })

  it.each<[OverviewPanelDefinition[] | null | undefined]>([[[]], [null], [undefined]])(
    'falls back to the shipped system panel when restoration supplies no panels',
    (restoredPanels) => {
      const panels = resolveMobileOverviewPanels(restoredPanels)

      expect(panels).toHaveLength(1)
      expect(panels[0]).toMatchObject({ id: 'system-overview', kind: 'system' })
      expect(panels[0]?.widgets.length).toBeGreaterThan(0)
    }
  )

  it('falls back when persisted panels have zero widgets', () => {
    const restoredPanels: OverviewPanelDefinition[] = [
      {
        id: 'user-overview',
        name: '我的看板',
        description: '空白看板',
        kind: 'user',
        editable: true,
        widgets: []
      }
    ]

    expect(resolveMobileOverviewPanels(restoredPanels)[0]?.id).toBe('system-overview')
  })
})
