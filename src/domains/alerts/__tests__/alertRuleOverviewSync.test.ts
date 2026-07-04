import { describe, expect, it } from 'vitest'
import type { OverviewPanelWidget } from '@/domains/overview/panelModel'
import type { AlertRuleItem } from '@/types/monitor'
import {
  removeCustomDashboardWidgetsAlertRule,
  removeOverviewPanelStateAlertRule,
  syncOverviewPanelStateWithAlertRule,
  type PersistedCustomDashboardWidget,
  type PersistedOverviewPanelState
} from '../alertRuleOverviewSync'

const createRule = (overrides: Partial<AlertRuleItem> = {}): AlertRuleItem => ({
  id: 'rule-critical',
  name: 'CPU 严重阈值告警',
  service: 'all',
  metric: 'service.cpu.usage',
  operator: '>=',
  threshold: 98,
  unit: '%',
  duration: 10,
  level: 'critical',
  enabled: true,
  channels: ['InApp'],
  ...overrides
})

const createQueryWidget = (): OverviewPanelWidget<'query-card'> => ({
  id: 'cpu-card',
  title: 'CPU 卡片',
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
      timeRange: '-5m',
      visualizationHint: 'line',
      alert: {
        enabled: true,
        ruleId: 'rule-warning',
        operator: '>',
        threshold: 80,
        unit: '%',
        duration: 5,
        level: 'warning',
        channels: ['Email'],
        rules: [
          {
            ruleId: 'rule-warning',
            level: 'warning',
            operator: '>',
            threshold: 80,
            unit: '%',
            duration: 5,
            channels: ['Email']
          },
          {
            ruleId: 'rule-critical',
            level: 'critical',
            operator: '>',
            threshold: 95,
            unit: '%',
            duration: 3,
            channels: ['Webhook']
          }
        ]
      }
    }
  }
})

const createState = (): PersistedOverviewPanelState => ({
  panels: [
    {
      id: 'panel-1',
      name: '默认面板',
      description: '',
      kind: 'user',
      editable: true,
      widgets: [createQueryWidget()]
    }
  ],
  baselines: {}
})

describe('alert rule overview sync', () => {
  it('syncs an edited alert rule back to the matching overview card rule', () => {
    const result = syncOverviewPanelStateWithAlertRule(createState(), createRule())
    const widget = result.state?.panels[0].widgets[0] as OverviewPanelWidget<'query-card'>
    const alert = widget.config.query.alert

    expect(result.changed).toBe(true)
    expect(alert?.rules?.find((item) => item.ruleId === 'rule-critical')).toMatchObject({
      operator: '>=',
      threshold: 98,
      duration: 10,
      channels: ['InApp']
    })
    expect(alert?.rules?.find((item) => item.ruleId === 'rule-warning')).toMatchObject({
      operator: '>',
      threshold: 80,
      duration: 5,
      channels: ['Email']
    })
    expect(alert).toMatchObject({
      ruleId: 'rule-warning',
      operator: '>',
      threshold: 80,
      duration: 5,
      channels: ['Email']
    })
  })

  it('does not rewrite panel state when the edited rule is not referenced by a card', () => {
    const state = createState()
    const result = syncOverviewPanelStateWithAlertRule(state, createRule({ id: 'rule-unlinked' }))

    expect(result.changed).toBe(false)
    expect(result.state).not.toBe(state)
    const widget = result.state?.panels[0].widgets[0] as OverviewPanelWidget<'query-card'>
    expect(widget.config.query.alert?.rules?.find((item) => item.ruleId === 'rule-critical')).toMatchObject({
      threshold: 95,
      channels: ['Webhook']
    })
  })

  it('syncs rule enabled status to the matching card rule', () => {
    const result = syncOverviewPanelStateWithAlertRule(createState(), createRule({ enabled: false }))
    const widget = result.state?.panels[0].widgets[0] as OverviewPanelWidget<'query-card'>
    const alert = widget.config.query.alert

    expect(result.changed).toBe(true)
    expect(alert?.enabled).toBe(true)
    expect(alert?.rules?.find((item) => item.ruleId === 'rule-critical')).toMatchObject({
      enabled: false,
      threshold: 98
    })
    expect(alert?.rules?.find((item) => item.ruleId === 'rule-warning')?.enabled).not.toBe(false)
  })

  it('removes a deleted rule from the matching card rule list', () => {
    const result = removeOverviewPanelStateAlertRule(createState(), 'rule-critical')
    const widget = result.state?.panels[0].widgets[0] as OverviewPanelWidget<'query-card'>
    const alert = widget.config.query.alert

    expect(result.changed).toBe(true)
    expect(alert?.rules?.map((item) => item.ruleId)).toEqual(['rule-warning'])
    expect(alert).toMatchObject({
      enabled: true,
      ruleId: 'rule-warning',
      threshold: 80
    })
  })

  it('disables card alert when the deleted rule is the only card rule', () => {
    const state = createState()
    const widget = state.panels[0].widgets[0] as OverviewPanelWidget<'query-card'>
    widget.config.query.alert = {
      enabled: true,
      ruleId: 'rule-critical',
      operator: '>',
      threshold: 95,
      unit: '%',
      duration: 3,
      level: 'critical',
      channels: ['Webhook'],
      rules: [
        {
          ruleId: 'rule-critical',
          enabled: true,
          level: 'critical',
          operator: '>',
          threshold: 95,
          unit: '%',
          duration: 3,
          channels: ['Webhook']
        }
      ]
    }

    const result = removeOverviewPanelStateAlertRule(state, 'rule-critical')
    const nextWidget = result.state?.panels[0].widgets[0] as OverviewPanelWidget<'query-card'>

    expect(result.changed).toBe(true)
    expect(nextWidget.config.query.alert).toMatchObject({ enabled: false, rules: [] })
  })

  it('removes deleted rules from default custom dashboard cards', () => {
    const widget = createQueryWidget()
    const customWidgets: PersistedCustomDashboardWidget[] = [
      {
        id: widget.id,
        title: widget.title,
        query: widget.config.query,
        visualization: 'line'
      }
    ]

    const result = removeCustomDashboardWidgetsAlertRule(customWidgets, 'rule-critical')

    expect(result.changed).toBe(true)
    expect(result.widgets[0].query.alert?.rules?.map((item) => item.ruleId)).toEqual(['rule-warning'])
  })
})
