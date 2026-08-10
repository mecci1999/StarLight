import { u as e, B as i } from './BaseChart-FGf3lmW3.js'
import { p as t, a1 as r, w as a } from './invariable-DewVS0br.js'
import { S as n } from './queryModel-CK1Nudco.js'
const s = (e, i) => {
    if (!e) return i
    const t = e.match(/var\((--[^)]+)\)/u)
    return t && 'undefined' != typeof window
      ? getComputedStyle(document.documentElement).getPropertyValue(t[1]).trim() || i
      : e
  },
  o = t({
    name: 'GaugeChart',
    props: {
      title: String,
      value: { type: Number, required: !0 },
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100 },
      unit: { type: String, default: '%' },
      color: { type: String, default: 'var(--color-primary-6)' },
      height: { type: String, default: '200px' },
      loading: Boolean
    },
    setup(t) {
      const { themeOptions: n } = e(),
        o = r(() => s(t.color, s('var(--color-primary-6)', '#165dff'))),
        l = r(() => n.value.title.textStyle.color),
        d = r(() => n.value.legend.textStyle.color),
        c = r(() => s('var(--color-fill-2)', '#f2f3f5')),
        u = r(() =>
          ((e) => {
            if (!e) return 'rgba(0, 0, 0, 0.16)'
            if (e.startsWith('rgba(')) return e.replace(/rgba\(([^)]+),\s*[^,]+\)$/u, 'rgba($1, 0.16)')
            if (e.startsWith('rgb('))
              return `rgba(${e
                .replace('rgb(', '')
                .replace(')', '')
                .split(',')
                .map((e) => e.trim())
                .join(', ')}, 0.16)`
            const i = e.replace('#', ''),
              t = 3 === i.length,
              r = 6 === i.length
            if (!t && !r) return e
            const a = t
              ? i
                  .split('')
                  .map((e) => `${e}${e}`)
                  .join('')
              : i
            return `rgba(${Number.parseInt(a.slice(0, 2), 16)}, ${Number.parseInt(a.slice(2, 4), 16)}, ${Number.parseInt(a.slice(4, 6), 16)}, 0.16)`
          })(o.value)
        ),
        p = r(() => {
          const { min: e, max: i, value: r } = t,
            a = i - e
          return !Number.isFinite(r) || !Number.isFinite(a) || a <= 0 ? 0 : Math.min(Math.max((r - e) / a, 0), 1)
        }),
        g = r(() => ({
          series: [
            {
              type: 'gauge',
              startAngle: 90,
              endAngle: -270,
              min: t.min,
              max: t.max,
              splitNumber: 1,
              center: ['50%', '50%'],
              radius: '92%',
              itemStyle: { color: o.value, shadowColor: u.value, shadowBlur: 6 },
              progress: { show: !0, roundCap: !0, clip: !1, width: 10, overlap: !1, itemStyle: { color: o.value } },
              pointer: { show: !1 },
              axisLine: { lineStyle: { color: [[1, c.value]], width: 10, cap: 'round' } },
              axisTick: { show: !1 },
              splitLine: { show: !1 },
              axisLabel: { show: !1 },
              detail: {
                valueAnimation: !0,
                formatter: () => {
                  return `${((e = t.value), Number.isFinite(e) ? (Number.isInteger(e) ? e.toLocaleString() : Number(e.toFixed(Math.abs(e) >= 10 ? 1 : 2)).toLocaleString()) : '0')}${t.unit}`
                  var e
                },
                color: l.value,
                fontSize: 20,
                fontWeight: 500,
                offsetCenter: [0, '0%']
              },
              title: { show: Boolean(t.title), offsetCenter: [0, '28%'], fontSize: 11, color: d.value },
              data: [{ value: t.min + p.value * (t.max - t.min), name: t.title }]
            }
          ]
        }))
      return () => a(i, { option: g.value, height: t.height, loading: t.loading }, null)
    }
  }),
  l = (e, i) => {
    if (!e) return i
    const t = e.match(/var\((--[^)]+)\)/u)
    return t && 'undefined' != typeof window
      ? getComputedStyle(document.documentElement).getPropertyValue(t[1]).trim() || i
      : e
  },
  d = (e) =>
    Number.isFinite(e)
      ? Number.isInteger(e)
        ? e.toLocaleString()
        : Number(e.toFixed(Math.abs(e) >= 10 ? 1 : 2)).toLocaleString()
      : '0',
  c = t({
    name: 'PieChart',
    props: {
      title: String,
      data: { type: Array, default: () => [] },
      height: { type: String, default: '200px' },
      loading: Boolean,
      colors: {
        type: Array,
        default: () => [
          'var(--color-primary-6)',
          'var(--color-success-6)',
          'var(--color-warning-6)',
          'var(--color-danger-6)',
          'var(--color-link-5)'
        ]
      },
      variant: { type: String, default: 'default' },
      showLegend: { type: Boolean, default: !0 }
    },
    setup(t) {
      const { themeOptions: n } = e(),
        s = r(() => 'monitor' === t.variant),
        o = r(() => {
          const e = ['#165dff', '#16a34a', '#d97706', '#dc2626', '#3b82f6']
          return t.colors.map((i, t) => l(i, e[t % e.length]))
        }),
        c = r(() =>
          o.value.map((e) =>
            ((e, i) => {
              if (!e) return `rgba(0, 0, 0, ${i})`
              if (e.startsWith('rgba(')) return e.replace(/rgba\(([^)]+),\s*[^,]+\)$/u, `rgba($1, ${i})`)
              if (e.startsWith('rgb('))
                return `rgba(${e
                  .replace('rgb(', '')
                  .replace(')', '')
                  .split(',')
                  .map((e) => e.trim())
                  .join(', ')}, ${i})`
              const t = e.replace('#', ''),
                r = 3 === t.length,
                a = 6 === t.length
              if (!r && !a) return e
              const n = r
                ? t
                    .split('')
                    .map((e) => `${e}${e}`)
                    .join('')
                : t
              return `rgba(${Number.parseInt(n.slice(0, 2), 16)}, ${Number.parseInt(n.slice(2, 4), 16)}, ${Number.parseInt(n.slice(4, 6), 16)}, ${i})`
            })(e, s.value ? 0.84 : 0.78)
          )
        ),
        u = r(() =>
          t.data
            .filter((e) => e && Number.isFinite(e.value) && e.value > 0)
            .map((e) => ({ name: e.name, value: Number(e.value) }))
        ),
        p = r(() => u.value.reduce((e, i) => e + i.value, 0)),
        g = r(() => u.value.length > 0 && p.value > 0),
        m = r(() => (g.value ? u.value.map((e) => e.name) : [])),
        v = r(() => (t.showLegend && g.value ? (s.value ? ['33%', '56%'] : ['50%', '44%']) : ['50%', '52%'])),
        y = r(() => d(p.value)),
        f = r(() => (g.value ? (t.title ? `${t.title} 总量` : '总量') : '暂无数据')),
        b = r(() => n.value.title.textStyle.color),
        h = r(() => n.value.legend.textStyle.color),
        w = r(() => l('var(--color-fill-1)', '#f7f8fa')),
        k = r(() => l('var(--color-bg-2)', '#ffffff')),
        S = r(() => ({
          title: {
            text: t.title,
            show: Boolean(t.title),
            left: 0,
            top: 0,
            textStyle: { fontSize: 12, fontWeight: 500, color: b.value }
          },
          tooltip: {
            show: g.value,
            trigger: 'item',
            formatter: (e) => {
              const i = 'number' == typeof e.percent ? `${e.percent.toFixed(e.percent >= 10 ? 0 : 1)}%` : '0%'
              return [
                '<div style="min-width: 132px;">',
                `<div style="margin-bottom: 6px; color: ${b.value}; font-weight: 500;">${e.name}</div>`,
                `<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; color: ${h.value};">`,
                `<span>数值</span><strong style="color: ${b.value}; font-weight: 500;">${d(Number(e.value || 0))}</strong>`,
                '</div>',
                `<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 4px; color: ${h.value};">`,
                `<span>占比</span><strong style="color: ${b.value}; font-weight: 500;">${i}</strong>`,
                '</div>',
                '</div>'
              ].join('')
            }
          },
          legend:
            t.showLegend && g.value
              ? {
                  type: 'scroll',
                  orient: s.value ? 'vertical' : 'horizontal',
                  left: s.value ? '64%' : 'center',
                  right: s.value ? 0 : void 0,
                  top: s.value ? 'middle' : void 0,
                  bottom: s.value ? void 0 : 0,
                  data: m.value,
                  itemGap: s.value ? 10 : 12,
                  textStyle: { color: h.value, fontSize: 11 },
                  formatter: (e) => (e.length > 14 ? `${e.slice(0, 14)}…` : e)
                }
              : void 0,
          graphic: [
            {
              type: 'group',
              left: v.value[0],
              top: v.value[1],
              silent: !0,
              children: [
                {
                  type: 'text',
                  x: 0,
                  y: -18,
                  style: {
                    text: y.value,
                    textAlign: 'center',
                    textVerticalAlign: 'middle',
                    fill: b.value,
                    fontSize: 20,
                    fontWeight: 500
                  }
                },
                {
                  type: 'text',
                  x: 0,
                  y: 8,
                  style: {
                    text: f.value,
                    textAlign: 'center',
                    textVerticalAlign: 'middle',
                    fill: h.value,
                    fontSize: 11,
                    fontWeight: 400
                  }
                }
              ]
            }
          ],
          color: c.value,
          series: [
            {
              name: t.title || 'Access From',
              type: 'pie',
              center: v.value,
              radius: s.value ? ['64%', '76%'] : ['68%', '80%'],
              minAngle: g.value ? 4 : 360,
              startAngle: 92,
              padAngle: 1,
              selectedOffset: 0,
              stillShowZeroSum: !0,
              avoidLabelOverlap: !0,
              silent: !g.value,
              emptyCircleStyle: { color: w.value },
              itemStyle: { borderRadius: 4, borderColor: k.value, borderWidth: 2 },
              label: { show: !1 },
              emphasis: { scale: !1 },
              labelLine: { show: !1 },
              data: g.value
                ? u.value
                : [{ name: '暂无数据', value: 1, itemStyle: { color: w.value }, tooltip: { show: !1 } }]
            }
          ]
        }))
      return () => a(i, { option: S.value, height: t.height, loading: t.loading }, null)
    }
  }),
  u = (e) => {
    if (!Array.isArray(e)) return []
    const i = new Set()
    return e.map((e) => String(e || '').trim()).filter((e) => !(!e || i.has(e) || (i.add(e), 0)))
  },
  p = ['services', 'topology', 'traces', 'logs', 'alerts', 'admin-ingestion'],
  g = { showTotal: !0, showAverage: !1, showPreviousPeriod: !0, showSamePeriod: !1 },
  m = [
    {
      kind: 'query-card',
      label: '开放查询卡',
      capability: 'metrics',
      description: '按查询条件自由选择指标、聚合、分组与展示方式。',
      defaultSize: 'M',
      frontendReady: !0
    },
    {
      kind: 'metric-summary',
      label: '指标摘要',
      capability: 'metrics',
      description: '显示单个指标的当前值、baseline 与阈值提示。',
      defaultSize: 'S',
      frontendReady: !0
    },
    {
      kind: 'risk-service',
      label: '风险服务',
      capability: 'serviceCatalog',
      description: '展示高风险或最近退化的服务列表，并可直接进入服务详情。',
      defaultSize: 'M',
      frontendReady: !0
    },
    {
      kind: 'incident',
      label: '事件列表',
      capability: 'alerts',
      description: '展示最近事件，支持 severity/source 过滤。',
      defaultSize: 'M',
      frontendReady: !0
    },
    {
      kind: 'ingest-status',
      label: '接入状态',
      capability: 'ingestion',
      description: '展示 metrics/logs/traces 采集通道状态。',
      defaultSize: 'M',
      frontendReady: !0
    },
    {
      kind: 'trend',
      label: '趋势图',
      capability: 'metrics',
      description: '展示请求、错误或延迟趋势，并保留 groupBy/compareWindow 配置。',
      defaultSize: 'L',
      frontendReady: !0
    },
    {
      kind: 'quick-pivot',
      label: '快捷入口',
      capability: 'serviceCatalog',
      description: '统一展示服务目录、拓扑、日志、链路和告警跳转入口。',
      defaultSize: 'M',
      frontendReady: !0
    },
    {
      kind: 'darwin-infra-summary',
      label: 'Darwin 资源摘要',
      capability: 'metrics',
      description: '展示 Darwin 系统基础资源当前值，如 CPU、内存。',
      defaultSize: 'S',
      frontendReady: !0
    },
    {
      kind: 'darwin-infra-trend',
      label: 'Darwin 资源趋势',
      capability: 'metrics',
      description: '展示 Darwin 系统基础资源趋势，如 CPU、内存。',
      defaultSize: 'L',
      frontendReady: !0
    },
    {
      kind: 'darwin-instance-table',
      label: 'Darwin 实例资源',
      capability: 'metrics',
      description: '展示 Darwin 服务实例 CPU、内存明细。',
      defaultSize: 'L',
      frontendReady: !0
    }
  ],
  v = (e, i, t) => ({
    id: e,
    title: i,
    kind: 'metric-summary',
    size: 'S',
    capability: 'metrics',
    description: 'KPI 卡片会根据当前时间范围与筛选条件显示 baseline/delta。',
    config: { metricKey: t, compareWindow: 'previous-period', threshold: null }
  }),
  y = (e, i, t, r) => ({
    id: e,
    title: i,
    kind: 'risk-service',
    size: 'M',
    capability: 'serviceCatalog',
    description: 'high-risk' === r ? '优先展示需要立刻排查的服务。' : '展示近期退化服务，帮助发现刚发生的抖动。',
    config: { limit: t, tags: 'high-risk' === r ? ['high-risk'] : ['degraded'] }
  }),
  f = (e, i, t = 5) => ({
    id: e,
    title: i,
    kind: 'incident',
    size: 'M',
    capability: 'alerts',
    description: '保留当前 overview incidents read model 作为默认模板的数据来源。',
    config: { limit: t, severity: ['warning', 'critical'], source: ['metrics', 'alerts'] }
  }),
  b = (e, i) => ({
    id: e,
    title: i,
    kind: 'ingest-status',
    size: 'M',
    capability: 'ingestion',
    description: '采集状态会根据当前 scope 透传到 overview ingest-status 接口。',
    config: { source: ['metrics', 'logs', 'traces'] }
  }),
  h = (e, i, t, r, a = 'L') => ({
    id: e,
    title: i,
    kind: 'trend',
    size: a,
    capability: 'metrics',
    description: '趋势图在当前阶段仍复用 overview trends read model。',
    config: {
      metric: t,
      aggregation: 'latency' === t ? 'p95' : 'errors' === t ? 'rate' : 'sum',
      groupBy: r,
      compareWindow: 'previous-period'
    }
  }),
  w = (e, i, t = p) => ({
    id: e,
    title: i,
    kind: 'quick-pivot',
    size: 'M',
    capability: 'serviceCatalog',
    description: '快捷入口帮助从 overview 进入 service-first 的排查链路。',
    config: { links: t.map((e) => ({ key: e, visible: !0 })) }
  }),
  k = (e, i, t) => ({
    id: e,
    title: i,
    kind: 'darwin-infra-summary',
    size: 'S',
    capability: 'metrics',
    description: `展示 Darwin ${'cpu' === t ? 'CPU' : '内存'} 当前资源状态。`,
    config: { metric: t, aggregation: 'avg' }
  }),
  S = () => [
    {
      id: 'system-overview',
      name: '系统默认模板',
      description: '展示当前接入能力下的完整默认模板，是 `/home/overview` 的默认入口。',
      kind: 'system',
      editable: !1,
      widgets: [
        v('system-service-count', '服务总数', 'service-count'),
        v('system-healthy-services', '健康服务数', 'healthy-services'),
        v('system-active-alerts', '活跃告警', 'active-alerts'),
        v('system-total-requests', '请求总量', 'total-requests'),
        v('system-error-rate', '全局错误率', 'error-rate'),
        v('system-p95-latency', 'P95 延迟', 'p95-latency'),
        k('system-darwin-cpu', 'Darwin CPU', 'cpu'),
        k('system-darwin-memory', 'Darwin 内存', 'memory'),
        y('system-high-risk', '高风险服务', 5, 'high-risk'),
        y('system-degraded', '最近退化服务', 5, 'degraded'),
        h('system-trend', '趋势概览', 'requests', 'overall'),
        {
          id: 'system-darwin-cpu-trend',
          title: 'Darwin CPU 趋势',
          kind: 'darwin-infra-trend',
          size: 'L',
          capability: 'metrics',
          description: '展示 Darwin CPU 趋势。',
          config: { metric: 'cpu', aggregation: 'avg' }
        },
        b('system-ingest', '接入状态'),
        f('system-incidents', '最近事件', 5),
        w('system-quick-pivot', '快捷入口')
      ]
    },
    {
      id: 'preset-service-stability',
      name: '服务稳定性模板',
      description: '聚焦服务健康、风险服务与核心趋势。',
      kind: 'preset',
      editable: !1,
      widgets: [
        v('preset-service-stability-alerts', '活跃告警', 'active-alerts'),
        v('preset-service-stability-error', '全局错误率', 'error-rate'),
        v('preset-service-stability-latency', 'P95 延迟', 'p95-latency'),
        y('preset-service-stability-risk', '高风险服务', 8, 'high-risk'),
        y('preset-service-stability-degraded', '最近退化服务', 8, 'degraded'),
        h('preset-service-stability-trend', '请求与延迟趋势', 'latency', 'team'),
        w('preset-service-stability-quick-pivot', '排查入口', ['services', 'topology', 'logs', 'traces', 'alerts'])
      ]
    },
    {
      id: 'preset-ingestion-health',
      name: '接入健康模板',
      description: '聚焦采集状态、事件和接入排查。',
      kind: 'preset',
      editable: !1,
      widgets: [
        v('preset-ingestion-health-service-count', '服务总数', 'service-count'),
        v('preset-ingestion-health-ingest-success', 'ingest 成功率', 'ingest-success-rate'),
        b('preset-ingestion-health-ingest', '采集状态'),
        f('preset-ingestion-health-incidents', '接入相关事件', 6),
        w('preset-ingestion-health-quick-pivot', '接入排查入口', ['services', 'logs', 'traces', 'admin-ingestion'])
      ]
    },
    {
      id: 'preset-alert-duty',
      name: '告警值班模板',
      description: '聚焦当前活跃告警、关键事件与最近风险服务。',
      kind: 'preset',
      editable: !1,
      widgets: [
        v('preset-alert-duty-active', '活跃告警', 'active-alerts'),
        v('preset-alert-duty-healthy', '健康服务数', 'healthy-services'),
        y('preset-alert-duty-risk', '值班关注服务', 10, 'high-risk'),
        f('preset-alert-duty-incidents', '值班事件流', 8),
        w('preset-alert-duty-quick-pivot', '值班跳转', ['alerts', 'services', 'logs', 'traces'])
      ]
    }
  ],
  $ = (e) => JSON.parse(JSON.stringify(e)),
  z = (e) => {
    switch (e) {
      case 'query-card':
        return ['number', 'line', 'bar', 'donut', 'table']
      case 'metric-summary':
        return ['number', 'bar', 'donut']
      case 'trend':
      case 'darwin-infra-trend':
        return ['line', 'bar']
      case 'darwin-infra-summary':
        return ['number', 'line', 'bar']
      default:
        return ['table']
    }
  },
  x = (e) => {
    var i, t, r, a, n, s, o, l, d, c
    const u = z(e.kind),
      p = ((e) => {
        const [i] = z(e)
        return i || 'table'
      })(e.kind),
      m = 'query-card' === e.kind ? (null == (i = e.config) ? void 0 : i.query) || {} : null,
      v = (null == (t = e.editor) ? void 0 : t.visualization) || (null == m ? void 0 : m.visualizationHint),
      y = v && u.includes(v) ? v : p,
      f = 'metric-summary' === e.kind || 'trend' === e.kind ? e.config.compareWindow : void 0,
      b = ((e, i) => {
        if ('metric-summary' === e) {
          const e = i.metricKey
          return e ? [e] : []
        }
        if ('trend' === e) {
          const e = i.metric
          return e ? [e] : []
        }
        if ('darwin-infra-summary' === e) {
          const e = i.metric
          return e ? [e] : []
        }
        if ('darwin-infra-trend' === e) {
          const e = i.metric
          return e ? [e] : []
        }
        return []
      })(e.kind, e.config),
      h =
        'metric-summary' === e.kind ||
        'trend' === e.kind ||
        'darwin-infra-summary' === e.kind ||
        'darwin-infra-trend' === e.kind
          ? b
          : (null == (r = e.editor) ? void 0 : r.displayedMetrics) && e.editor.displayedMetrics.length
            ? e.editor.displayedMetrics
            : b
    return {
      queryEditMode: (null == (a = e.editor) ? void 0 : a.queryEditMode) || 'form-builder',
      timeGranularity: (null == (n = e.editor) ? void 0 : n.timeGranularity) || 'hour',
      timeRange:
        (null == (s = e.editor) ? void 0 : s.timeRange) ||
        ((null == m ? void 0 : m.timeRange) ? String(m.timeRange).replace(/^-/, '') : '1h'),
      visualization: y,
      displayedMetrics: h,
      compareEnabled: (null == (o = e.editor) ? void 0 : o.compareEnabled) ?? Boolean(f),
      compareWindow: (null == (l = e.editor) ? void 0 : l.compareWindow) || f || 'previous-period',
      display: { ...g, ...((null == (d = e.editor) ? void 0 : d.display) || {}) },
      notes: (null == (c = e.editor) ? void 0 : c.notes) || ''
    }
  },
  q = new Set(['risk-service', 'incident', 'ingest-status', 'quick-pivot', 'darwin-instance-table']),
  R = (e) => !q.has(e.kind),
  N = (e) => {
    const i = (() => {
        var i, t, r, a, n
        const s = null == (t = null == (i = e.editor) ? void 0 : i.displayedMetrics) ? void 0 : t[0]
        if ('query-card' === e.kind) {
          const i = (null == (r = e.config) ? void 0 : r.query) || {}
          return {
            ...e,
            config: {
              query: {
                ...i,
                timeRange: (null == (a = e.editor) ? void 0 : a.timeRange)
                  ? `-${e.editor.timeRange}`
                  : i.timeRange || '-1h',
                visualizationHint: (null == (n = e.editor) ? void 0 : n.visualization) || i.visualizationHint || 'line'
              }
            }
          }
        }
        return 'metric-summary' === e.kind && s
          ? { ...e, config: { ...e.config, metricKey: s } }
          : ('trend' === e.kind && s) ||
              ('darwin-infra-summary' === e.kind && s) ||
              ('darwin-infra-trend' === e.kind && s)
            ? { ...e, config: { ...e.config, metric: s } }
            : e
      })(),
      t = x(i),
      r = 'S' !== e.size || R(i) ? e.size : 'M'
    return { ...i, size: r, tags: u(i.tags), editor: t }
  },
  M = (e, i) => {
    const t = e.trim() || '我的看板'
    return {
      id: `user-${
        t
          .toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'panel'
      }-${Date.now()}`,
      name: t,
      description: '用户自定义面板，当前阶段以本地持久化代替后端 panel CRUD。',
      kind: 'user',
      editable: !0,
      widgets: $(i)
    }
  },
  D = (e, i) => {
    const t = m.find((i) => i.kind === e) || m[0],
      r = (() => {
        switch (t.kind) {
          case 'metric-summary':
            return {
              id: `widget-${t.kind}-${Date.now()}`,
              title: t.label,
              kind: 'metric-summary',
              size: t.defaultSize,
              capability: t.capability,
              description: t.description,
              config: { metricKey: 'total-requests', compareWindow: 'previous-period', threshold: null }
            }
          case 'risk-service':
            return {
              id: `widget-${t.kind}-${Date.now()}`,
              title: t.label,
              kind: 'risk-service',
              size: t.defaultSize,
              capability: t.capability,
              description: t.description,
              config: { limit: 6 }
            }
          case 'incident':
            return {
              id: `widget-${t.kind}-${Date.now()}`,
              title: t.label,
              kind: 'incident',
              size: t.defaultSize,
              capability: t.capability,
              description: t.description,
              config: { limit: 5, severity: ['warning', 'critical'], source: ['metrics', 'alerts'] }
            }
          case 'ingest-status':
            return {
              id: `widget-${t.kind}-${Date.now()}`,
              title: t.label,
              kind: 'ingest-status',
              size: t.defaultSize,
              capability: t.capability,
              description: t.description,
              config: { source: ['metrics', 'logs', 'traces'] }
            }
          case 'trend':
            return {
              id: `widget-${t.kind}-${Date.now()}`,
              title: t.label,
              kind: 'trend',
              size: t.defaultSize,
              capability: t.capability,
              description: t.description,
              config: { metric: 'requests', aggregation: 'sum', groupBy: 'overall', compareWindow: 'previous-period' }
            }
          case 'quick-pivot':
            return {
              id: `widget-${t.kind}-${Date.now()}`,
              title: t.label,
              kind: 'quick-pivot',
              size: t.defaultSize,
              capability: t.capability,
              description: t.description,
              config: { links: p.map((e) => ({ key: e, visible: !0 })) }
            }
          case 'darwin-infra-summary':
            return {
              id: `widget-${t.kind}-${Date.now()}`,
              title: t.label,
              kind: 'darwin-infra-summary',
              size: t.defaultSize,
              capability: t.capability,
              description: t.description,
              config: { metric: 'cpu', aggregation: 'avg' }
            }
          case 'darwin-infra-trend':
            return {
              id: `widget-${t.kind}-${Date.now()}`,
              title: t.label,
              kind: 'darwin-infra-trend',
              size: t.defaultSize,
              capability: t.capability,
              description: t.description,
              config: { metric: 'cpu', aggregation: 'avg' }
            }
          case 'darwin-instance-table':
            return {
              id: `widget-${t.kind}-${Date.now()}`,
              title: t.label,
              kind: 'darwin-instance-table',
              size: t.defaultSize,
              capability: t.capability,
              description: t.description,
              config: { limit: 6, sortBy: 'cpu' }
            }
          case 'query-card':
            return {
              id: `widget-${t.kind}-${Date.now()}`,
              title: t.label,
              kind: 'query-card',
              size: t.defaultSize,
              capability: t.capability,
              description: t.description,
              config: {
                query: {
                  scope: 'tenant',
                  sourceKind: 'auto',
                  subject: { type: 'system' },
                  metricRef: 'service.cpu.usage',
                  aggregation: 'avg',
                  timeRange: '-1h',
                  visualizationHint: 'line'
                }
              }
            }
          default:
            return v(`widget-${Date.now()}`, '指标摘要', 'total-requests')
        }
      })()
    return N(r)
  },
  B = (e) => ('S' === e ? 3 : 'M' === e ? 6 : 12),
  C = (e) => {
    switch (e) {
      case 'services':
        return '服务目录'
      case 'topology':
        return '服务拓扑'
      case 'traces':
        return 'Trace Explorer'
      case 'logs':
        return 'Logs Explorer'
      case 'alerts':
        return 'Alert Inbox'
      case 'admin-ingestion':
        return '接入管理'
      default:
        return e
    }
  },
  j = { requests: 'service.qps', errors: 'service.error.rate', latency: 'service.response.time' },
  L = { 'total-requests': 'service.qps', 'error-rate': 'service.error.rate', 'p95-latency': 'service.response.time' },
  I = (e) => {
    var i
    const t = (null == (i = e.editor) ? void 0 : i.displayedMetrics) || []
    return t.length
      ? t
      : 'metric-summary' === e.kind
        ? [e.config.metricKey]
        : 'trend' === e.kind
          ? [e.config.metric]
          : []
  },
  A = (e, i, t) => e || i,
  P = (e) => {
    var i, t, r, a
    const { widget: s, scope: o, scopedServiceName: l, services: d } = e,
      c = ((e, i) => {
        var t
        if (e) return null == (t = i.find((i) => i.name === e)) ? void 0 : t.id
      })(l, d),
      u = (null == (i = s.editor) ? void 0 : i.timeRange) ? `-${s.editor.timeRange}` : '-1h',
      p = ((e) => {
        var i
        const t = null == (i = e.editor) ? void 0 : i.visualization
        return 'line' === t || 'bar' === t || 'table' === t || 'donut' === t ? t : 'number'
      })(s)
    if ('query-card' === s.kind) {
      const e = null == (t = s.config) ? void 0 : t.query
      return (null == e ? void 0 : e.metricRef)
        ? {
            supported: !0,
            query: {
              ...e,
              scope: e.scope || o,
              timeRange: u,
              visualizationHint: p,
              subject:
                'service' === (null == (r = e.subject) ? void 0 : r.type) &&
                !(null == (a = e.subject) ? void 0 : a.id) &&
                c
                  ? { ...e.subject, id: c }
                  : e.subject
            }
          }
        : { supported: !1, reason: '开放查询卡缺少 metricRef' }
    }
    if ('trend' === s.kind) {
      const e = s.config,
        i = I(s)
      if (1 !== i.length) return { supported: !1, reason: '当前趋势卡仅支持单指标查询预览' }
      if (e.groupBy && 'overall' !== e.groupBy) return { supported: !1, reason: '当前分组趋势卡暂不支持脚本预览' }
      const t = j[i[0]]
      return t
        ? {
            supported: !0,
            query: {
              scope: o,
              sourceKind: 'auto',
              subject: c ? { type: 'service', id: c } : { type: 'system' },
              metricRef: t,
              aggregation: 'rate' === e.aggregation ? 'avg' : e.aggregation || 'avg',
              timeRange: u,
              visualizationHint: p,
              groupBy: e.groupBy && 'overall' !== e.groupBy ? [e.groupBy] : void 0
            }
          }
        : { supported: !1, reason: '当前趋势指标暂不支持查询预览' }
    }
    if ('metric-summary' === s.kind) {
      const e = I(s)
      if (1 !== e.length) return { supported: !1, reason: '当前摘要卡仅支持单指标查询预览' }
      const i = e[0],
        t = i ? L[i] : void 0
      return t
        ? {
            supported: !0,
            query: {
              scope: o,
              sourceKind: 'auto',
              subject: c ? { type: 'service', id: c } : { type: 'system' },
              metricRef: t,
              aggregation: 'p95-latency' === i ? 'p95' : 'number' === p ? 'latest' : 'avg',
              timeRange: u,
              visualizationHint: p
            }
          }
        : { supported: !1, reason: '当前摘要卡片暂不支持脚本预览' }
    }
    if ('darwin-infra-summary' === s.kind) {
      const e = s.config,
        i = 'cpu' === e.metric ? 'service.cpu.usage' : n,
        t = A(e.serviceId, c)
      return {
        supported: !0,
        query: {
          scope: o,
          sourceKind: 'darwin-event',
          subject: t ? { type: 'service', id: t } : { type: 'system' },
          metricRef: i,
          aggregation: e.aggregation || 'avg',
          timeRange: u,
          visualizationHint: p
        }
      }
    }
    if ('darwin-infra-trend' === s.kind) {
      const e = s.config,
        i = 'cpu' === e.metric ? 'service.cpu.usage' : n,
        t = A(e.serviceId, c)
      return {
        supported: !0,
        query: {
          scope: o,
          sourceKind: 'darwin-event',
          subject: t ? { type: 'service', id: t } : { type: 'system' },
          metricRef: i,
          aggregation: 'avg',
          timeRange: u,
          visualizationHint: p
        }
      }
    }
    if ('darwin-instance-table' === s.kind) {
      const e = s.config,
        i = A(e.serviceId, c)
      return i
        ? {
            supported: !0,
            query: {
              scope: o,
              sourceKind: 'darwin-event',
              subject: { type: 'service', id: i },
              metricRef: 'memory' === e.sortBy ? 'instance.memory.usage' : 'instance.cpu.usage',
              aggregation: 'latest',
              timeRange: u,
              visualizationHint: 'table',
              groupBy: ['instanceId'],
              limit: e.limit || 6
            }
          }
        : { supported: !1, reason: '实例资源预览需要先选择目标服务' }
    }
    return { supported: !1, reason: '当前卡片类型暂不支持查询预览' }
  },
  W = (e) => {
    var i
    const t = e.widgets
        .map((i) => ({
          widget: i,
          support: P({ widget: i, scope: e.scope, scopedServiceName: e.scopedServiceName, services: e.services })
        }))
        .filter((e) => e.support.supported && e.support.query)
        .map((e) => ({
          cardId: e.widget.id,
          priority: 'metric-summary' === e.widget.kind || 'darwin-infra-summary' === e.widget.kind ? 'high' : 'normal',
          query: e.support.query
        })),
      r = {
        refreshGenerationId: e.refreshGenerationId || `${Date.now()}`,
        context: {
          scope: e.scope,
          timeRange: (null == (i = t[0]) ? void 0 : i.query.timeRange) || '-1h',
          autoRefresh: Boolean(e.autoRefresh)
        },
        cards: t
      }
    return {
      cards: t,
      request: t.length
        ? r
        : {
            refreshGenerationId: e.refreshGenerationId || `${Date.now()}`,
            context: { scope: e.scope, timeRange: '-1h', autoRefresh: Boolean(e.autoRefresh) },
            cards: []
          },
      requests: t.length ? [r] : []
    }
  },
  F = () => ({
    id: 'user-overview',
    name: '我的看板',
    description: '从空白看板开始，按需新增指标卡片。',
    kind: 'user',
    editable: !0,
    widgets: []
  }),
  K = (e = []) =>
    Object.fromEntries(
      e.filter((e) => 'success' === e.status || 'partial' === e.status).map((e) => [e.cardId, e.data || null])
    ),
  G = (e) => {
    if (!Number.isFinite(e)) return '0'
    const i = Math.abs(e)
    return i >= 1e9
      ? `${Number((e / 1e9).toFixed(i >= 1e10 ? 0 : 1))}B`
      : i >= 1e6
        ? `${Number((e / 1e6).toFixed(i >= 1e7 ? 0 : 1))}M`
        : i >= 1e3
          ? `${Number((e / 1e3).toFixed(i >= 1e4 ? 0 : 1))}K`
          : Number.isInteger(e)
            ? e.toLocaleString()
            : Number(e.toFixed(i >= 10 ? 1 : 2)).toLocaleString()
  },
  H = (e, i = '') => {
    if ('mb' === i.trim().toLowerCase() && Math.abs(e) >= 1024) {
      const i = e / 1024,
        t = Math.abs(i) >= 10 || Number.isInteger(i) ? 0 : 1
      return { value: Number(i.toFixed(t)).toLocaleString(), unit: 'GB' }
    }
    return { value: G(e), unit: i }
  }
export {
  o as G,
  c as P,
  W as a,
  S as b,
  D as c,
  R as d,
  N as e,
  H as f,
  B as g,
  x as h,
  M as i,
  F as j,
  P as k,
  C as l,
  K as m,
  u as n,
  m as o,
  $ as p,
  G as q,
  z as r
}
