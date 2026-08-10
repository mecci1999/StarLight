import { r as t } from './request-BiInMBwl.js'
import { l as r } from './index-DFkcx8xz.js'
function e() {
  return t.get(r.subscriptionPlans, {})
}
function n() {
  return t.get(r.userSubscription, {})
}
function i() {
  return t.get(r.subscriptionCurrentDetail, {})
}
function s() {
  return t.get(r.subscriptionUsage, {})
}
function u() {
  return t.get(r.subscriptionUsageSummary, {})
}
function o(e) {
  return t.get(r.subscriptionQuotaHistory, e || {})
}
function a(e) {
  return t.get(r.billingHistory, e || {})
}
function c() {
  return t.get(r.billingAnalytics, {})
}
function g() {
  return t.get(r.paymentMethods, {})
}
function p(e) {
  return t.post(r.createPaymentOrder, e)
}
function b(e) {
  return t.get(r.queryPaymentOrder, e)
}
function l(e) {
  return t.post(r.subscribe, e)
}
function f(e) {
  return t.post(r.upgradeSubscription, e)
}
function y(e) {
  return t.post(r.cancelSubscription, e || {})
}
function m() {
  return t.post(r.resumeSubscription, {})
}
function S(e) {
  return t.get(r.subscriptionHistory, e || {})
}
const d = Object.freeze(
  Object.defineProperty(
    {
      __proto__: null,
      cancelSubscription: y,
      createPaymentOrder: p,
      getBillingAnalytics: c,
      getBillingHistory: a,
      getPaymentMethods: g,
      getPlans: e,
      getQuotaHistory: o,
      getSubscriptionCurrentDetail: i,
      getSubscriptionHistory: S,
      getUsageStatistics: s,
      getUsageSummary: u,
      getUserSubscription: n,
      queryPaymentOrder: b,
      resumeSubscription: m,
      subscribe: l,
      upgradeSubscription: f
    },
    Symbol.toStringTag,
    { value: 'Module' }
  )
)
export {
  e as a,
  a as b,
  c,
  u as d,
  o as e,
  S as f,
  i as g,
  g as h,
  y as i,
  d as j,
  n as k,
  s as l,
  p as m,
  b as q,
  m as r,
  l as s,
  f as u
}
