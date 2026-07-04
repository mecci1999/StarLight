import type { QueryAlertRule, QuerySpec } from '@/domains/metrics/queryModel'
import type { OverviewPanelDefinition, OverviewPanelWidget } from '@/domains/overview/panelModel'
import type { AlertRuleItem } from '@/types/monitor'

export const OVERVIEW_PANEL_STATE_STORAGE_KEY = 'starlight_overview_panel_state_v5'
export const CUSTOM_DASHBOARD_STORAGE_KEY = 'starlight_dashboard_layout'

export type PersistedOverviewPanelState = {
  panels: OverviewPanelDefinition[]
  baselines: Record<string, OverviewPanelDefinition>
}

type OverviewPanelSyncResult =
  | { changed: false; state: PersistedOverviewPanelState | null }
  | { changed: true; state: PersistedOverviewPanelState }

export type PersistedCustomDashboardWidget = {
  id: string
  title: string
  query: QuerySpec
  visualization: NonNullable<QuerySpec['visualizationHint']>
  sourceMode?: 'form-builder' | 'query-statement'
}

type CustomDashboardSyncResult =
  | { changed: false; widgets: PersistedCustomDashboardWidget[] }
  | { changed: true; widgets: PersistedCustomDashboardWidget[] }

const cloneValue = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const buildQueryAlertRuleFromAlertRule = (rule: AlertRuleItem, previous?: QueryAlertRule): QueryAlertRule => ({
  ...previous,
  ruleId: rule.id,
  enabled: rule.enabled,
  level: rule.level,
  operator: rule.operator,
  threshold: rule.threshold,
  unit: rule.unit,
  duration: rule.duration,
  channels: rule.channels?.length ? rule.channels : previous?.channels || ['Email']
})

const pickPrimaryRule = (rules: QueryAlertRule[], preferredRuleId?: string) => {
  const enabledRules = rules.filter((rule) => rule.enabled !== false)
  return (
    enabledRules.find((rule) => rule.ruleId === preferredRuleId) ||
    enabledRules.find((rule) => rule.level === 'warning') ||
    enabledRules[0] ||
    rules[0]
  )
}

const applyRulesToQueryAlert = (query: QuerySpec, rules: QueryAlertRule[]) => {
  const alert = query.alert
  if (!alert) return
  const primaryRule = pickPrimaryRule(rules, alert.ruleId)
  const enabled = rules.some((rule) => rule.enabled !== false)

  query.alert = {
    ...alert,
    enabled,
    ruleId: primaryRule?.ruleId,
    operator: primaryRule?.operator || alert.operator || '>',
    threshold: primaryRule?.threshold ?? alert.threshold ?? 0,
    unit: primaryRule?.unit ?? alert.unit,
    duration: primaryRule?.duration || alert.duration,
    level: primaryRule?.level || alert.level,
    channels: primaryRule?.channels?.length ? primaryRule.channels : alert.channels,
    rules
  }
}

const syncQueryAlertWithRule = (query: QuerySpec, rule: AlertRuleItem) => {
  const alert = query.alert
  if (!alert) return false

  const rawRules = Array.isArray(alert.rules) ? alert.rules : []
  const hasRuleListMatch = rawRules.some((item) => item.ruleId === rule.id)
  const hasLegacyMatch = alert.ruleId === rule.id
  if (!hasRuleListMatch && !hasLegacyMatch) return false

  const nextRules = rawRules.length
    ? rawRules.map((item) => (item.ruleId === rule.id ? buildQueryAlertRuleFromAlertRule(rule, item) : item))
    : [buildQueryAlertRuleFromAlertRule(rule)]
  applyRulesToQueryAlert(query, nextRules)
  const nextAlert = query.alert
  if (nextAlert) {
    if (nextAlert.ruleId === undefined && nextRules.length) nextAlert.ruleId = rule.id
    if (!rawRules.length) nextAlert.enabled = rule.enabled
  }
  return true
}

const removeQueryAlertRule = (query: QuerySpec, ruleId: string) => {
  const alert = query.alert
  if (!alert) return false

  const rawRules = Array.isArray(alert.rules) ? alert.rules : []
  const hasRuleListMatch = rawRules.some((item) => item.ruleId === ruleId)
  const hasLegacyMatch = alert.ruleId === ruleId
  if (!hasRuleListMatch && !hasLegacyMatch) return false

  if (rawRules.length) {
    applyRulesToQueryAlert(
      query,
      rawRules.filter((item) => item.ruleId !== ruleId)
    )
    return true
  }

  query.alert = {
    ...alert,
    enabled: false,
    ruleId: undefined,
    rules: []
  }
  return true
}

const syncWidgetAlertWithRule = (widget: OverviewPanelWidget, rule: AlertRuleItem) => {
  if (widget.kind !== 'query-card') return false
  const query = (widget.config as { query?: QuerySpec }).query
  if (!query) return false
  return syncQueryAlertWithRule(query, rule)
}

const removeWidgetAlertRule = (widget: OverviewPanelWidget, ruleId: string) => {
  if (widget.kind !== 'query-card') return false
  const query = (widget.config as { query?: QuerySpec }).query
  if (!query) return false
  return removeQueryAlertRule(query, ruleId)
}

const syncCustomDashboardWidgetAlertWithRule = (widget: PersistedCustomDashboardWidget, rule: AlertRuleItem) =>
  syncQueryAlertWithRule(widget.query, rule)

const removeCustomDashboardWidgetAlertRule = (widget: PersistedCustomDashboardWidget, ruleId: string) =>
  removeQueryAlertRule(widget.query, ruleId)

export const syncOverviewPanelStateWithAlertRule = (
  state: PersistedOverviewPanelState | null,
  rule: AlertRuleItem
): OverviewPanelSyncResult => {
  if (!state?.panels?.length) return { changed: false, state }

  let changed = false
  const panels = state.panels.map((panel) => ({
    ...panel,
    widgets: (panel.widgets || []).map((widget) => {
      const nextWidget = cloneValue(widget) as OverviewPanelWidget
      if (syncWidgetAlertWithRule(nextWidget, rule)) changed = true
      return nextWidget
    })
  }))
  const baselines = Object.fromEntries(
    Object.entries(state.baselines || {}).map(([panelId, panel]) => [
      panelId,
      {
        ...panel,
        widgets: (panel.widgets || []).map((widget) => {
          const nextWidget = cloneValue(widget) as OverviewPanelWidget
          if (syncWidgetAlertWithRule(nextWidget, rule)) changed = true
          return nextWidget
        })
      }
    ])
  ) as Record<string, OverviewPanelDefinition>

  if (!changed) return { changed: false, state: { panels, baselines } }
  return { changed: true, state: { panels, baselines } }
}

export const removeOverviewPanelStateAlertRule = (
  state: PersistedOverviewPanelState | null,
  ruleId: string
): OverviewPanelSyncResult => {
  if (!state?.panels?.length) return { changed: false, state }

  let changed = false
  const panels = state.panels.map((panel) => ({
    ...panel,
    widgets: (panel.widgets || []).map((widget) => {
      const nextWidget = cloneValue(widget) as OverviewPanelWidget
      if (removeWidgetAlertRule(nextWidget, ruleId)) changed = true
      return nextWidget
    })
  }))
  const baselines = Object.fromEntries(
    Object.entries(state.baselines || {}).map(([panelId, panel]) => [
      panelId,
      {
        ...panel,
        widgets: (panel.widgets || []).map((widget) => {
          const nextWidget = cloneValue(widget) as OverviewPanelWidget
          if (removeWidgetAlertRule(nextWidget, ruleId)) changed = true
          return nextWidget
        })
      }
    ])
  ) as Record<string, OverviewPanelDefinition>

  if (!changed) return { changed: false, state: { panels, baselines } }
  return { changed: true, state: { panels, baselines } }
}

export const syncCustomDashboardWidgetsWithAlertRule = (
  widgets: PersistedCustomDashboardWidget[],
  rule: AlertRuleItem
): CustomDashboardSyncResult => {
  let changed = false
  const nextWidgets = widgets.map((widget) => {
    const nextWidget = cloneValue(widget)
    if (syncCustomDashboardWidgetAlertWithRule(nextWidget, rule)) changed = true
    return nextWidget
  })

  if (!changed) return { changed: false, widgets: nextWidgets }
  return { changed: true, widgets: nextWidgets }
}

export const removeCustomDashboardWidgetsAlertRule = (
  widgets: PersistedCustomDashboardWidget[],
  ruleId: string
): CustomDashboardSyncResult => {
  let changed = false
  const nextWidgets = widgets.map((widget) => {
    const nextWidget = cloneValue(widget)
    if (removeCustomDashboardWidgetAlertRule(nextWidget, ruleId)) changed = true
    return nextWidget
  })

  if (!changed) return { changed: false, widgets: nextWidgets }
  return { changed: true, widgets: nextWidgets }
}
