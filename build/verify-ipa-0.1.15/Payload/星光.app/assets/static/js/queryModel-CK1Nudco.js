const e = 'service.memory.usage.percent',
  r = { critical: 3, warning: 2, info: 1 },
  t = (e, t) => {
    var s
    if (!(null == e ? void 0 : e.enabled)) return []
    const i = e.unit || '',
      a = e.duration || 5,
      n = (null == (s = e.channels) ? void 0 : s.length) ? e.channels : ['Email'],
      l = (Array.isArray(e.rules) ? e.rules : [])
        .filter((e) => 'number' == typeof e.threshold && Number.isFinite(e.threshold))
        .map((r) => {
          var t
          return {
            ...r,
            enabled: r.enabled ?? !0,
            operator: r.operator || e.operator || '>',
            unit: r.unit ?? i,
            duration: r.duration || a,
            channels: (null == (t = r.channels) ? void 0 : t.length) ? r.channels : n,
            level: r.level || 'warning'
          }
        })
        .filter((e) => (null == t ? void 0 : t.includeDisabled) || !1 !== e.enabled)
    return (
      !l.length &&
        'number' == typeof e.threshold &&
        Number.isFinite(e.threshold) &&
        l.push({
          ruleId: e.ruleId,
          enabled: e.enabled,
          level: e.level || 'warning',
          operator: e.operator || '>',
          threshold: e.threshold,
          unit: i,
          duration: a,
          channels: n
        }),
      l.sort((e, t) => {
        const s = r[t.level] - r[e.level]
        return 0 !== s ? s : t.threshold - e.threshold
      })
    )
  },
  s = {
    cpu: 'explorer-cpu',
    memory: 'explorer-memory',
    qps: 'explorer-qps',
    responseTime: 'explorer-response-time',
    requestStats: 'explorer-request-stats'
  },
  i = (e) => {
    if (!e) return null
    const r = e.toLowerCase()
    return r.includes('cpu')
      ? 'cpu'
      : r.includes('memory') || r.includes('mem')
        ? 'memory'
        : r.includes('response') || r.includes('latency') || r.includes('duration')
          ? 'responseTime'
          : r.includes('request.stats') || r.includes('status.code') || r.includes('distribution')
            ? 'requestStats'
            : r.includes('qps') ||
                r.includes('throughput') ||
                r.includes('request.total') ||
                r.includes('request.count')
              ? 'qps'
              : null
  },
  a = (e) => Boolean(i(e)),
  n = { value: { min: 0, max: 100, unit: '%' } },
  l = (r) => {
    const t = r.serviceId ? { type: 'service', id: r.serviceId } : { type: 'system' },
      a = { scope: r.scope, sourceKind: 'auto', subject: t, timeRange: r.timeRange },
      l = [
        {
          cardId: s.cpu,
          priority: 'high',
          query: { ...a, metricRef: 'service.cpu.usage', aggregation: 'avg', visualizationHint: 'line', display: n }
        },
        {
          cardId: s.memory,
          priority: 'high',
          query: { ...a, metricRef: e, aggregation: 'avg', visualizationHint: 'line', display: n }
        },
        {
          cardId: s.qps,
          priority: 'high',
          query: { ...a, metricRef: 'service.qps', aggregation: 'avg', visualizationHint: 'line' }
        },
        {
          cardId: s.responseTime,
          priority: 'high',
          query: { ...a, metricRef: 'service.response.time', aggregation: 'avg', visualizationHint: 'line' }
        },
        {
          cardId: s.requestStats,
          priority: 'normal',
          query: {
            ...a,
            metricRef: 'service.request.stats',
            aggregation: 'sum',
            groupBy: ['metric'],
            visualizationHint: 'bar'
          }
        }
      ],
      o = i(r.metricRef)
    return {
      refreshGenerationId: r.refreshGenerationId || `${Date.now()}`,
      context: { scope: r.scope, timeRange: r.timeRange },
      cards: o ? l.filter((e) => e.cardId === s[o]) : l
    }
  },
  o = (e, r) =>
    e && 'timeseries' === e.kind ? e.series.map((e) => ({ name: e.name || r, data: e.points || [] })) : [],
  u = (e, r) => {
    var t
    return null ==
      (t =
        null == e ? void 0 : e.items.find((e) => e.cardId === r && ('success' === e.status || 'partial' === e.status)))
      ? void 0
      : t.data
  },
  d = (e) => {
    const r = u(e, s.requestStats)
    return {
      series: {
        cpu: o(u(e, s.cpu), 'CPU'),
        memory: o(u(e, s.memory), '内存'),
        qps: o(u(e, s.qps), 'QPS'),
        responseTime: o(u(e, s.responseTime), '响应时间')
      },
      requestStats: r && 'distribution' === r.kind ? r.items.map((e) => ({ name: e.name, value: e.value })) : [],
      services: []
    }
  },
  c = (e) => {
    var r
    return (
      !!(null == (r = null == e ? void 0 : e.items) ? void 0 : r.length) &&
      e.items.some(
        (e) =>
          !(('success' !== e.status && 'partial' !== e.status) || !e.data) &&
          ('timeseries' === e.data.kind
            ? e.data.series.some((e) => Array.isArray(e.points) && e.points.length > 0)
            : 'distribution' === e.data.kind
              ? Array.isArray(e.data.items) && e.data.items.length > 0
              : 'table' === e.data.kind
                ? Array.isArray(e.data.rows) && e.data.rows.length > 0
                : 'number' === e.data.kind && null !== e.data.value)
      )
    )
  }
export { n as P, e as S, d as a, l as b, c as h, a as i, t as n, i as r }
