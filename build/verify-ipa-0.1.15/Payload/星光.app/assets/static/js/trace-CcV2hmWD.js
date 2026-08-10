import { r as e } from './request-BiInMBwl.js'
import { l as r, A as t, k as n } from './index-DFkcx8xz.js'
const a = (e) =>
  Object.fromEntries(
    Object.entries(e || {}).filter(([, e]) => null != e && '' !== e && 'undefined' !== e && 'null' !== e)
  )
function i(i) {
  return e.get(r.traceSearch, a(i)).then((e) => {
    if (!Array.isArray(e)) throw new t('Trace search returned an invalid response payload', { type: n.Network })
    return e
  })
}
function o(i, o) {
  return e.get(r.traceDetail, a({ traceId: i, ...(o || {}) })).then((e) => {
    if (!Array.isArray(e)) throw new t('Trace detail returned an invalid response payload', { type: n.Network })
    return e
  })
}
export { o as g, i as s }
