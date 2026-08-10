import { c6 as s, c7 as e, c8 as o, c9 as r, ca as c, cb as n } from './invariable-DewVS0br.js'
const a = {
    success: (s) => n(s),
    error: (e) => s(e),
    warning: (s) => c('string' == typeof s ? { message: s, type: 'text' } : s),
    info: (s) => c('string' == typeof s ? { message: s, type: 'text' } : s),
    loading: (s = '加载中...') => r(s),
    close: () => o(),
    confirm: (s) => e(s)
  },
  { success: i, error: t, warning: g, info: f, loading: m, close: l, confirm: p } = a,
  { success: y, error: d, warning: u, info: w, loading: x, close: b, confirm: j } = a
export { a as m }
