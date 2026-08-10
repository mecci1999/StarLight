import { a1 as e, a0 as a, t, V as i, cr as l, cs as n, cy as s } from './invariable-DewVS0br.js'
const r = 'starlight_client_notification_unread_ids_v1',
  c = (e) => {
    'undefined' != typeof localStorage && localStorage.setItem(r, JSON.stringify(e.slice(0, 99)))
  },
  o = a([]),
  d = a(
    (() => {
      if ('undefined' == typeof localStorage) return []
      try {
        const e = localStorage.getItem(r),
          a = e ? JSON.parse(e) : []
        return Array.isArray(a) ? a.filter((e) => 'string' == typeof e) : []
      } catch {
        return []
      }
    })()
  ),
  u = e(() => d.value.length),
  v = () =>
    (async (e) => {
      try {
        if ('windows' === t()) return
        await i('set_badge_count', { count: e > 0 ? e : null })
      } catch (a) {}
    })(u.value),
  y = async () => {
    ;(d.value = []), c([]), await v()
  },
  f = async (e) => {
    ;(o.value = o.value.filter((a) => a.id !== e)),
      await (async (e) => {
        const a = d.value.filter((a) => a !== e)
        a.length !== d.value.length && ((d.value = a), c(a), await v())
      })(e)
  },
  g = (e) => {
    o.value = o.value.filter((a) => a.id !== e)
  },
  m = async (e) => {
    const a = e.createdAt || Date.now(),
      t = e.id || e.dedupeKey || `client-notification-${a}-${Math.random().toString(36).slice(2, 8)}`,
      i = e.dedupeKey || t
    if (o.value.some((e) => (e.dedupeKey || e.id) === i)) return null
    const r = {
      id: t,
      dedupeKey: i,
      source: e.source || 'custom',
      level: e.level || 'info',
      title: e.title,
      body: e.body,
      service: e.service,
      createdAt: a,
      durationMs: e.durationMs ?? 7e3,
      placement: e.placement || 'bottom-right',
      native: e.native ?? !1,
      badge: e.badge ?? !0,
      actions: e.actions,
      metadata: e.metadata
    }
    return (
      (o.value = [r, ...o.value].slice(0, 5)),
      r.badge && !d.value.includes(r.id) && ((d.value = [r.id, ...d.value].slice(0, 99)), c(d.value), await v()),
      await (async (e) => {
        if (e.native)
          try {
            let a = await l()
            a || (a = 'granted' === (await n())), a && s({ title: e.title, body: e.body })
          } catch (a) {}
      })(r),
      r
    )
  }
v()
export { y as a, o as b, u as c, f as d, g as h, m as p, v as s }
