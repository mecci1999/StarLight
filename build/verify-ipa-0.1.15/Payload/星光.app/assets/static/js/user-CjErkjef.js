import { r as e } from './request-BiInMBwl.js'
import { l as t } from './index-DFkcx8xz.js'
const r = (e) => {
    var t
    const r = (null == (t = e.data) ? void 0 : t.content) || e.content || e,
      { user: a, ...s } = r
    return a || s
  },
  a = (r) => e.get(t.getUserInfo, { userId: r }),
  s = (r) => e.post(t.updateUserInfo, r),
  o = (r) => e.post(t.updateUserAvatar, r),
  n = Object.freeze(
    Object.defineProperty(
      { __proto__: null, extractUpdatedUser: r, getUserInfo: a, updateUserAvatar: o, updateUserInfo: s },
      Symbol.toStringTag,
      { value: 'Module' }
    )
  )
export { n as a, o as b, r as e, a as g, s as u }
