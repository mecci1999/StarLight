import { H as e, A as s, k as t, l as o, m as n } from './index-DFkcx8xz.js'
import { a1 as l } from './invariable-DewVS0br.js'
l(() => {
  let e = ''
  return {
    get() {
      if (e) return e
      const s = n('ACCESS_TOKEN')
      return s && (e = s), e
    },
    clear() {
      e = ''
    }
  }
})
const a = async (n, l, a, r, i, u, d) => {
    var c, v, m, y, p, g
    let E = { method: l, noRetry: u, ...(d || {}) }
    if ('GET' === l) E = { ...E, query: a }
    else {
      const e = new URLSearchParams(a).toString()
      e && (n = `${n}?${e}`), (E = { ...E, body: r })
    }
    try {
      const l = await e(n, E, !0, i),
        a = await l.data,
        r = (null == a ? void 0 : a.status) ?? (null == (c = null == a ? void 0 : a.data) ? void 0 : c.status),
        u = (null == a ? void 0 : a.code) ?? (null == (v = null == a ? void 0 : a.data) ? void 0 : v.code),
        S = (null == (m = null == a ? void 0 : a.data) ? void 0 : m.success) ?? (null == a ? void 0 : a.success)
      let f = !1
      if (
        ((f =
          'boolean' == typeof S
            ? S
            : 'number' == typeof u
              ? 0 === u || 200 === u
              : 'number' == typeof r && r >= 200 && r < 300),
        !f)
      ) {
        const e = (null == (y = null == a ? void 0 : a.data) ? void 0 : y.message) || (null == a ? void 0 : a.message)
        return Promise.reject(new s(e, { type: t.Server, showError: !0 }))
      }
      const T = (null == (p = null == a ? void 0 : a.data) ? void 0 : p.message) || (null == a ? void 0 : a.message)
      !T ||
        (null == d ? void 0 : d.suppressSuccessMessage) ||
        n.includes('/qrcode') ||
        n === o.metricsStats ||
        window.$message.success(T)
      const b = (null == (g = null == a ? void 0 : a.data) ? void 0 : g.content) ?? (null == a ? void 0 : a.content)
      return Promise.resolve(b)
    } catch (S) {
      return Promise.reject(S)
    }
  },
  r = {
    get: async (e, s, t, o) => a(e, 'GET', s, {}, t, o),
    getWithOptions: async (e, s, t) =>
      a(e, 'GET', s, {}, null == t ? void 0 : t.abort, null == t ? void 0 : t.noRetry, t),
    post: async (e, s, t, o) => a(e, 'POST', {}, s, t, o),
    postWithOptions: async (e, s, t) =>
      a(e, 'POST', {}, s, null == t ? void 0 : t.abort, null == t ? void 0 : t.noRetry, t),
    put: async (e, s, t, o) => a(e, 'PUT', {}, s, t, o),
    delete: async (e, s, t, o) => a(e, 'DELETE', {}, s, t, o)
  }
export { r }
