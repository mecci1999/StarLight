import { r as e } from './request-BiInMBwl.js'
import { l as s } from './index-DFkcx8xz.js'
const o = (o) => e.postWithOptions(s.login, o, { noRetry: !0, suppressSuccessMessage: !0, timeoutMs: 15e3 }),
  t = (o, t) =>
    e.postWithOptions(s.emailVerifyCode, o, {
      noRetry: !0,
      suppressErrorLog: !0,
      suppressSuccessMessage: null == t ? void 0 : t.suppressSuccessMessage,
      timeoutMs: 6e4
    }),
  r = (o) => e.post(s.registerUser, o),
  a = (o) => e.post(s.forgetPassword, o),
  p = (o) => e.post(s.updatePassword, o),
  c = (o) => e.post(s.refreshToken, o),
  g = () => e.post(s.logout, {}),
  d = () => e.get(s.getRSAKey, {}),
  i = (o) => e.post(s.saveRSAKey, o),
  u = () => e.get(s.getQRCodeKey, {}),
  n = (o) => e.get(s.getQRCodeStatus, o),
  l = (o) => e.post(s.scanQRcode, o),
  R = (o) => e.post(s.confirmQRcode, o),
  f = (o) => e.post(s.cancelQRcode, o),
  y = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        cancelQRcode: f,
        confirmQRcode: R,
        forgetPassword: a,
        getQRCodeKey: u,
        getQRCodeStatus: n,
        getRSAKey: d,
        login: o,
        logout: g,
        refreshToken: c,
        registerUser: r,
        saveRSAKey: i,
        scanQRcode: l,
        updatePassword: p,
        verifyCode: t
      },
      Symbol.toStringTag,
      { value: 'Module' }
    )
  )
export {
  n as a,
  f as b,
  R as c,
  g as d,
  y as e,
  a as f,
  u as g,
  c as h,
  d as i,
  i as j,
  o as l,
  r,
  l as s,
  p as u,
  t as v
}
