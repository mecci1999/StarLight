import { describe, expect, it } from 'vitest'
import { buildOverviewWidgetEditorState } from '../panelModel'
import type { OverviewPanelWidget } from '../panelModel'

const validateWidgetDraftBeforeSave = (draft: OverviewPanelWidget) => {
  if (!draft.title.trim()) return '请输入组件标题'

  if (['metric-summary', 'trend', 'darwin-infra-summary', 'darwin-infra-trend'].includes(draft.kind)) {
    if (!draft.editor?.displayedMetrics?.[0]) {
      return '请先选择一个指标'
    }
  }

  if (draft.kind === 'darwin-instance-table' && !(draft.config as { serviceId?: string }).serviceId) {
    return '请先选择目标服务'
  }

  return ''
}

describe('overview editor validation', () => {
  it('requires target service before saving darwin instance table', () => {
    const widget = {
      id: 'darwin-instance',
      title: '实例资源',
      kind: 'darwin-instance-table',
      size: 'L',
      capability: 'metrics',
      description: '',
      config: { limit: 6, sortBy: 'cpu' },
      editor: buildOverviewWidgetEditorState({
        id: 'darwin-instance',
        title: '实例资源',
        kind: 'darwin-instance-table',
        size: 'L',
        capability: 'metrics',
        description: '',
        config: { limit: 6, sortBy: 'cpu' }
      } as any)
    } as unknown as OverviewPanelWidget

    expect(validateWidgetDraftBeforeSave(widget)).toBe('请先选择目标服务')
  })
})
