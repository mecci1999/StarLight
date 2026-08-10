const e = (e = []) => {
    const r = new Map()
    return (
      e.forEach((e) => {
        const n = (null == e ? void 0 : e.labels) || {}
        Object.entries(n).forEach(([e, n]) => {
          r.has(e) || r.set(e, new Set()), r.get(e).add(String(n))
        })
      }),
      Object.fromEntries(Array.from(r.entries()).map(([e, r]) => [e, Array.from(r).slice(0, 5)]))
    )
  },
  r = (r) => {
    const n = String((null == r ? void 0 : r.name) || '').trim()
    if (!n) return null
    const t = Array.isArray(null == r ? void 0 : r.values) ? r.values : [],
      i = t.map((e) => Number(null == e ? void 0 : e.timestamp)).filter((e) => Number.isFinite(e)),
      s = i.length ? Math.max(...i) : null,
      l = {
        name: n,
        description: String((null == r ? void 0 : r.description) || '').trim() || '暂无描述',
        type: String((null == r ? void 0 : r.type) || 'unknown').trim() || 'unknown',
        unit: String((null == r ? void 0 : r.unit) || '').trim(),
        scope: Array.isArray(null == r ? void 0 : r.scope)
          ? r.scope.filter((e) => 'tenant' === e || 'system' === e)
          : ['tenant'],
        sourceKind:
          'sdk' === (null == r ? void 0 : r.sourceKind) ||
          'darwin-event' === (null == r ? void 0 : r.sourceKind) ||
          'mixed' === (null == r ? void 0 : r.sourceKind)
            ? r.sourceKind
            : 'auto',
        subjectKinds: Array.isArray(null == r ? void 0 : r.subjectKinds)
          ? r.subjectKinds.filter((e) => 'system' === e || 'service' === e || 'instance' === e)
          : ['system'],
        allowedAggregations: Array.isArray(null == r ? void 0 : r.allowedAggregations)
          ? r.allowedAggregations.filter(
              (e) => 'latest' === e || 'avg' === e || 'sum' === e || 'max' === e || 'p95' === e
            )
          : ['latest', 'avg'],
        recommendedVisualizations: Array.isArray(null == r ? void 0 : r.recommendedVisualizations)
          ? r.recommendedVisualizations.filter(
              (e) => 'number' === e || 'line' === e || 'bar' === e || 'table' === e || 'donut' === e
            )
          : [],
        labelNames: Array.isArray(null == r ? void 0 : r.labelNames) ? r.labelNames.map((e) => String(e)) : [],
        sampleLabels: e(t),
        sampleCount: t.length,
        lastSeenAt: s,
        sourceServices: Array.isArray(null == r ? void 0 : r.sourceServices)
          ? r.sourceServices.map((e) => String(e))
          : Array.isArray(null == r ? void 0 : r.services)
            ? r.services.map((e) => String(e))
            : [],
        recommendation: 'number'
      }
    return (
      (l.recommendation = ((e, r) => {
        const n = Array.isArray(r) ? r.map((e) => String(e).toLowerCase()) : []
        if (n.includes('table')) return 'table'
        if (n.includes('line')) return 'line'
        if (n.includes('bar')) return 'bar'
        if (n.includes('number') || n.includes('donut')) return 'number'
        const t = e.name.toLowerCase()
        return 'info' === e.type
          ? 'table'
          : t.includes('latency') ||
              t.includes('duration') ||
              t.includes('response') ||
              t.includes('cpu') ||
              t.includes('memory') ||
              t.includes('load')
            ? 'line'
            : t.includes('status') || t.includes('state')
              ? 'number'
              : e.labelNames.length > 0
                ? 'bar'
                : 'number'
      })(l, l.recommendedVisualizations)),
      l
    )
  },
  n = (e) => {
    var r, n
    return Array.isArray(e)
      ? e
      : Array.isArray(null == e ? void 0 : e.content)
        ? e.content
        : Array.isArray(null == (r = null == e ? void 0 : e.data) ? void 0 : r.content)
          ? e.data.content
          : Array.isArray(null == e ? void 0 : e.items)
            ? e.items
            : Array.isArray(null == (n = null == e ? void 0 : e.data) ? void 0 : n.items)
              ? e.data.items
              : null
  },
  t = (e) => {
    if (!n(e)) return null == e ? { items: [], source: 'empty' } : { items: [], source: 'unsupported' }
    const t = (n(e) || []).map(r).filter((e) => Boolean(e))
    return t.length ? { items: t, source: 'schema' } : { items: [], source: 'empty' }
  },
  i = (e, r) => {
    const n = r.keyword.trim().toLowerCase()
    return e.filter(
      (e) =>
        (!r.type || e.type === r.type) &&
        (!r.unit || e.unit === r.unit) &&
        (!r.hasLabels || 0 !== e.labelNames.length) &&
        !(r.serviceId && e.sourceServices.length > 0 && !e.sourceServices.includes(r.serviceId)) &&
        (!n ||
          [e.name, e.description, e.type, e.unit, ...e.labelNames, ...Object.keys(e.sampleLabels)]
            .join(' ')
            .toLowerCase()
            .includes(n))
    )
  },
  s = (e) => Array.from(new Set(e.map((e) => e.type).filter(Boolean))).sort(),
  l = (e) => Array.from(new Set(e.map((e) => e.unit).filter(Boolean))).sort(),
  a = [
    { includes: ['cpu'], metric: 'cpu' },
    { includes: ['memory', 'mem'], metric: 'memory' },
    { includes: ['response', 'latency', 'duration'], metric: 'response-time' },
    { includes: ['error'], metric: 'error-rate' },
    { includes: ['connection'], metric: 'connections' },
    { includes: ['qps', 'throughput', 'request.total', 'request.count'], metric: 'qps' }
  ],
  o = (e) => {
    const r = e.name.toLowerCase(),
      n = e.description.toLowerCase()
    if (
      r.includes('response') ||
      r.includes('latency') ||
      r.includes('duration') ||
      ((r.includes('time') || n.includes('耗时') || n.includes('延迟')) &&
        ((e) => {
          const r = e.toLowerCase()
          return ['millisecond', 'milliseconds', 'ms', 'second', 'seconds', 's'].includes(r)
        })(e.unit))
    )
      return { metric: 'response-time', type: 'line' === e.recommendation ? 'trend' : 'stat' }
    const t = a.find((e) => e.includes.some((e) => r.includes(e) || n.includes(e)))
    return t ? { metric: t.metric, type: 'line' === e.recommendation ? 'trend' : 'stat' } : null
  }
export { l as a, s as c, i as f, t as l, o as m }
