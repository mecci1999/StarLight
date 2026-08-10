const e = new Set(['15m', '1h', '4h', '1d', '2d', '7d']),
  n = (e) => ('string' == typeof e && e.trim() ? e.trim() : void 0),
  i = (e) => {
    if (!e || !/^\d+$/.test(e)) return
    const n = Number(e)
    return Number.isSafeInteger(n) && n > 0 ? n : void 0
  },
  d = (d) => {
    const r = i(n(d.invStart)),
      t = i(n(d.invEnd)),
      v = void 0 !== r && void 0 !== t && r <= t,
      a = n(d.invRange),
      o = n(d.invServiceId),
      s = n(d.invServiceName),
      c = n(d.invKeyword),
      I = n(d.invTab),
      m = n(d.invIncidentId)
    return {
      ...(o ? { serviceId: o } : {}),
      ...(s ? { serviceName: s } : {}),
      ...(v ? { start: r, end: t } : e.has(a) ? { range: a } : {}),
      ...(c ? { keyword: c } : {}),
      ...(I ? { tab: I } : {}),
      ...(m ? { incidentId: m } : {})
    }
  },
  r = (e, n = Date.now()) => {
    if (void 0 !== e.start && void 0 !== e.end) return { start: e.start, end: e.end }
    const i = e.range
      ? { '15m': 9e5, '1h': 36e5, '4h': 144e5, '1d': 864e5, '2d': 1728e5, '7d': 6048e5 }[e.range]
      : void 0
    return i ? { start: n - i, end: n } : void 0
  },
  t = (e) => ({
    ...(e.serviceId ? { invServiceId: e.serviceId } : {}),
    ...(e.serviceName ? { invServiceName: e.serviceName } : {}),
    ...(void 0 !== e.start && void 0 !== e.end ? { invStart: `${e.start}`, invEnd: `${e.end}` } : {}),
    ...(void 0 === e.start && void 0 === e.end && e.range ? { invRange: e.range } : {}),
    ...(e.keyword ? { invKeyword: e.keyword } : {}),
    ...(e.tab ? { invTab: e.tab } : {}),
    ...(e.incidentId ? { invIncidentId: e.incidentId } : {})
  })
export { t as i, d as p, r }
