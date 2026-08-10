function e(e) {
  return !0 === e || (!(!e || 'object' != typeof e) && !0 === e.success)
}
function n(e) {
  return 'number' == typeof e ? e + 1 : 1
}
function t(e, n) {
  return 'number' == typeof n ? n : 'number' == typeof e && e > 0 ? e - 1 : (n ?? 0)
}
export { e as d, n as g, t as r }
