import { describe, expect, it } from 'vitest'
import { SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF } from '@/domains/metrics/queryModel'
import {
  buildCustomDashboardPreviewRequest,
  buildCustomDashboardQuerySpec,
  createCustomDashboardDraftFromQuerySpec,
  createDefaultCustomDashboardWidgetDraft,
  createLocalCompiledScript,
  extractPreviewCardData,
  parseQuerySpecJson,
  resolveLegacyMetricRef,
  validateCustomDashboardDraft,
  type CustomDashboardWidgetDraft
} from '../customDashboardPreviewModel'

describe('customDashboardPreviewModel', () => {
  const baseDraft: CustomDashboardWidgetDraft = {
    title: 'CPU 趋势',
    visualization: 'line',
    metricRef: 'service.cpu.usage',
    aggregation: 'avg',
    sourceKind: 'auto',
    subjectType: 'system',
    serviceId: '',
    groupBy: [],
    limit: null,
    type: 'trend',
    metric: 'cpu'
  }

  it('builds a query spec for supported widget drafts', () => {
    const query = buildCustomDashboardQuerySpec(baseDraft, 'system')
    expect(query).toMatchObject({
      scope: 'system',
      metricRef: 'service.cpu.usage',
      aggregation: 'avg',
      visualizationHint: 'line',
      display: { value: { unit: '%' } }
    })
  })

  it('maps builder display and alert controls into QuerySpec', () => {
    const query = buildCustomDashboardQuerySpec(
      {
        ...baseDraft,
        displayMin: 0,
        displayMax: 100,
        displayUnit: '%',
        alertEnabled: true,
        alertOperator: '>',
        alertThreshold: 80,
        alertDuration: 5,
        alertLevel: 'warning',
        alertChannels: ['Email', 'Webhook']
      },
      'tenant'
    )

    expect(query?.display?.value).toEqual({ min: 0, max: 100, unit: '%' })
    expect(query?.alert).toEqual({
      enabled: true,
      operator: '>',
      threshold: 80,
      unit: '%',
      duration: 5,
      level: 'warning',
      channels: ['Email', 'Webhook'],
      rules: [
        {
          level: 'warning',
          operator: '>',
          threshold: 80,
          unit: '%',
          duration: 5,
          channels: ['Email', 'Webhook']
        }
      ]
    })
  })

  it('maps multi-level alert rules into QuerySpec while keeping legacy fields', () => {
    const query = buildCustomDashboardQuerySpec(
      {
        ...baseDraft,
        displayUnit: '%',
        alertEnabled: true,
        alertRules: [
          { level: 'warning', operator: '>', threshold: 85, duration: 5, channels: ['Email'] },
          { level: 'critical', operator: '>', threshold: 95, duration: 3, channels: ['Email', 'Webhook'] }
        ]
      },
      'tenant'
    )

    expect(query?.alert?.threshold).toBe(85)
    expect(query?.alert?.level).toBe('warning')
    expect(query?.alert?.rules).toEqual([
      { level: 'warning', operator: '>', threshold: 85, unit: '%', duration: 5, channels: ['Email'] },
      { level: 'critical', operator: '>', threshold: 95, unit: '%', duration: 3, channels: ['Email', 'Webhook'] }
    ])
  })

  it('returns null for alerts preview queries', () => {
    expect(buildCustomDashboardQuerySpec({ ...baseDraft, type: 'alerts' }, 'tenant')).toBeNull()
  })

  it('creates a default open draft with optional service scope', () => {
    expect(createDefaultCustomDashboardWidgetDraft('svc-1', 'system')).toMatchObject({
      scope: 'system',
      metricRef: 'service.cpu.usage',
      subjectType: 'service',
      serviceId: 'svc-1'
    })
  })

  it('resolves legacy metric presets into metric refs', () => {
    expect(resolveLegacyMetricRef('memory')).toBe(SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF)
  })

  it('builds a one-card preview request', () => {
    const request = buildCustomDashboardPreviewRequest(baseDraft, 'tenant', 'refresh-1')
    expect(request?.refreshGenerationId).toBe('refresh-1')
    expect(request?.cards[0].cardId).toBe('custom-dashboard-preview')
  })

  it('validates missing title and unsupported alerts preview', () => {
    expect(validateCustomDashboardDraft({ ...baseDraft, title: '' }).valid).toBe(false)
    expect(validateCustomDashboardDraft({ ...baseDraft, type: 'alerts' }).issues).toContain('告警列表暂不支持脚本预览')
  })

  it('requires service selection when the draft targets a service subject', () => {
    expect(validateCustomDashboardDraft({ ...baseDraft, subjectType: 'service', serviceId: '' }).issues).toContain(
      '请选择目标服务'
    )
  })

  it('rejects instance-scoped drafts until real instance support exists', () => {
    expect(validateCustomDashboardDraft({ ...baseDraft, subjectType: 'instance' }).issues).toContain(
      '实例维度查询暂未开放，请先使用服务维度'
    )
    expect(buildCustomDashboardQuerySpec({ ...baseDraft, subjectType: 'instance' }, 'tenant')).toBeNull()
  })

  it('creates a readable local compiled script fallback', () => {
    expect(createLocalCompiledScript(baseDraft, 'system')).toContain('service.cpu.usage')
  })

  it('parses QuerySpec JSON envelopes and converts them back to a dashboard draft', () => {
    const query = {
      scope: 'system' as const,
      sourceKind: 'auto' as const,
      subject: { type: 'service' as const, id: 'gateway' },
      metricRef: SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF,
      aggregation: 'latest' as const,
      timeRange: '-15m',
      visualizationHint: 'donut' as const,
      groupBy: ['service']
    }
    const result = parseQuerySpecJson(JSON.stringify({ config: { query } }))

    expect(result.issues).toEqual([])
    expect(result.query).toEqual(query)
    expect(createCustomDashboardDraftFromQuerySpec(query, baseDraft)).toMatchObject({
      scope: 'system',
      subjectType: 'service',
      serviceId: 'gateway',
      metricRef: SERVICE_MEMORY_USAGE_PERCENT_METRIC_REF,
      aggregation: 'latest',
      visualization: 'donut',
      timeRange: '-15m',
      groupBy: ['service'],
      alertEnabled: false
    })
  })

  it('validates alert threshold drafts before saving', () => {
    expect(
      validateCustomDashboardDraft({ ...baseDraft, alertEnabled: true, alertThreshold: null, alertRules: [] }).issues
    ).toContain('启用告警时需要填写触发阈值')
  })

  it('accepts structured ratio calculations in pasted QuerySpec JSON', () => {
    const query = {
      scope: 'system' as const,
      sourceKind: 'auto' as const,
      subject: { type: 'system' as const },
      metricRef: 'custom.memory.usage.percent',
      aggregation: 'latest' as const,
      timeRange: '-15m',
      visualizationHint: 'donut' as const,
      calculation: {
        type: 'ratio' as const,
        numerator: { metricRef: 'process.memory.rss', aggregation: 'latest' as const },
        denominator: { metricRef: 'os.memory.total', aggregation: 'latest' as const },
        scale: 100,
        unit: '%'
      }
    }

    const result = parseQuerySpecJson(JSON.stringify(query))

    expect(result.issues).toEqual([])
    expect(result.query?.calculation).toEqual(query.calculation)
  })

  it('accepts display value settings in pasted QuerySpec JSON', () => {
    const query = {
      scope: 'tenant' as const,
      sourceKind: 'auto' as const,
      subject: { type: 'system' as const },
      metricRef: 'service.cpu.usage',
      aggregation: 'avg' as const,
      timeRange: '-5m',
      visualizationHint: 'line' as const,
      display: {
        value: {
          max: 100,
          unit: '%'
        },
        yAxis: {
          max: 100,
          unit: '%'
        }
      }
    }

    const result = parseQuerySpecJson(JSON.stringify({ type: 'queryspec', version: 1, query }))

    expect(result.issues).toEqual([])
    expect(result.query?.display?.value).toEqual({ max: 100, unit: '%' })
    expect(result.query?.display?.yAxis).toEqual({ max: 100, unit: '%' })
  })

  it('accepts queryspec wrapper objects from pasted QuerySpec JSON', () => {
    const query = {
      scope: 'tenant' as const,
      sourceKind: 'auto' as const,
      subject: { type: 'system' as const },
      metricRef: 'service.qps',
      aggregation: 'sum' as const,
      timeRange: '-1h',
      visualizationHint: 'line' as const,
      display: {
        value: {
          min: 0,
          unit: 'count/s'
        }
      }
    }

    const result = parseQuerySpecJson(JSON.stringify({ queryspec: { type: 'queryspec', version: 1, query } }))

    expect(result.issues).toEqual([])
    expect(result.query).toEqual(query)
  })

  it('returns readable issues for invalid QuerySpec JSON', () => {
    expect(parseQuerySpecJson('{').issues[0]).toContain('JSON 格式不正确')
    expect(parseQuerySpecJson(JSON.stringify({ metricRef: 'service.cpu.usage' })).issues[0]).toContain(
      '未找到有效的 QuerySpec'
    )
  })

  it('extracts preview card data from success and partial responses', () => {
    expect(
      extractPreviewCardData({
        items: [{ cardId: 'custom-dashboard-preview', status: 'success', data: { kind: 'number', value: 12 } } as any]
      })
    ).toEqual({ kind: 'number', value: 12 })
    expect(
      extractPreviewCardData({
        items: [{ cardId: 'custom-dashboard-preview', status: 'partial', data: { kind: 'number', value: 6 } } as any]
      })
    ).toEqual({ kind: 'number', value: 6 })
  })
})
