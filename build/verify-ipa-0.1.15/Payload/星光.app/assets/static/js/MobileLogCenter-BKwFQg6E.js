const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      'static/js/metrics-uVJcD6zf.js',
      'static/js/request-BiInMBwl.js',
      'static/js/index-DFkcx8xz.js',
      'static/js/invariable-DewVS0br.js',
      'static/css/invariable-iNbeqmVx.css',
      'static/css/index-CHJV-hXo.css',
      'static/js/index-BRz3eDUI.js',
      'static/js/logs-CT6hSV3d.js',
      'static/js/alerts-CIHfuoAx.js',
      'static/js/subscription-C610hAN0.js',
      'static/js/auth-CpdnJA9r.js',
      'static/js/user-CjErkjef.js',
      'static/js/microApps-BJHOuFrl.js'
    ])
) => i.map((i) => d[i])
import { b as e, _ as l, d as a } from './index-DFkcx8xz.js'
import {
  p as t,
  a0 as i,
  a1 as s,
  aP as o,
  a2 as r,
  aQ as n,
  Z as c,
  w as v,
  ac as u,
  aR as m,
  bp as d,
  aV as g,
  bx as _,
  aZ as b,
  aS as p,
  by as y,
  bs as f,
  aW as h,
  bz as w,
  b2 as k,
  ba as z,
  ai as N
} from './invariable-DewVS0br.js'
import { M as S } from './MobileButton-BKhxhz5A.js'
import { M as x } from './MobileCard-BxmuYclQ.js'
import { M } from './MobileTag-ByR2jSPf.js'
import { M as T } from './MobileEmpty-BimvXy70.js'
import { M as j } from './MobileLoading-DlB38x7T.js'
import { M as R } from './MobileInput-OCuvcoNh.js'
import './MobileToast-CIN42EDh.js'
import { M as C } from './MobileSwitch-DjTHu5Qy.js'
import { M as $ } from './MobileProgress-CIjA5IVj.js'
import { M as A } from './MobileSelect-BOALIWQn.js'
import { M as O } from './MobileTabs-CAdXTbXB.js'
import { M as I } from './MobileGrid-sIXQCLxa.js'
import { f as D } from './metrics-uVJcD6zf.js'
import { s as E, a as B, g as V, b as L } from './logs-CT6hSV3d.js'
import './request-BiInMBwl.js'
import { L as F } from './logs-DZkPx9D6.js'
import { p as U, r as P } from './investigationContext-7xMjfbkf.js'
function H(e) {
  return 'function' == typeof e || ('[object Object]' === Object.prototype.toString.call(e) && !N(e))
}
const W = [
    { key: F.ERROR, label: 'ERROR' },
    { key: F.WARN, label: 'WARN' },
    { key: F.INFO, label: 'INFO' },
    { key: F.DEBUG, label: 'DEBUG' }
  ],
  q = [
    { key: '15m', label: '15分钟' },
    { key: '1h', label: '1小时' },
    { key: '4h', label: '4小时' },
    { key: '1d', label: '1天' }
  ],
  K = { '15m': 0.25, '1h': 1, '4h': 4, '1d': 24 },
  G = { ERROR: 'danger', WARN: 'warning', INFO: 'info', DEBUG: 'default' },
  Z = t({
    name: 'MobileLogCenter',
    setup() {
      var t
      const N = z(),
        Z = i('overview'),
        Q = Boolean(null == (t = e()) ? void 0 : t.isAdmin),
        X = i(!1),
        Y = i(!1),
        J = async (e) => {
          Y.value = !0
          try {
            await E({ enabled: e, durationMs: 6e5, reason: 'mobile toggle' }), (X.value = e)
          } catch {
          } finally {
            Y.value = !1
          }
        },
        ee = i(null),
        le = i(!1),
        ae = i(!1),
        te = i([]),
        ie = i(0),
        se = i(1),
        oe = i(!1),
        re = i(!1),
        ne = i(null),
        ce = i(''),
        ve = i([]),
        ue = i(Q ? 'darwin-app' : 'microservice'),
        me = i('1h'),
        de = i(null),
        ge = i(!1),
        _e = i(!1),
        be = i(!1),
        pe = i(null)
      let ye = 0,
        fe = !1
      const he = i([]),
        we = i(0),
        ke = i(!1),
        ze = i(!1),
        Ne = i([]),
        Se = i(!1),
        xe = i(!1),
        Me = i(!1),
        Te = i(!1),
        je = i(!1),
        Re = i([]),
        Ce = i(null),
        $e = i([]),
        Ae = i(0),
        Oe = i(1),
        Ie = i(!1),
        De = i(!1),
        Ee = i(!1),
        Be = i({ total: 0, critical: 0, services: 0, types: 0 }),
        Ve = [
          ...(Q ? [{ label: 'Darwin 服务日志', value: 'darwin-app' }] : []),
          { label: '用户微服务日志', value: 'microservice' }
        ],
        Le = (e) => {
          if (e instanceof Date) {
            const l = e.getTime()
            return Number.isFinite(l) ? l : 0
          }
          if ('number' == typeof e) return Number.isFinite(e) ? e : 0
          if ('string' != typeof e || !e.trim()) return 0
          const l = e.trim(),
            a = Number(l)
          if (Number.isFinite(a)) return a
          const t = l.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2}):(\d{1,3})$/)
          if (t) {
            const [, e, l, a, i, s, o, r] = t
            return new Date(
              Number(e),
              Number(l) - 1,
              Number(a),
              Number(i),
              Number(s),
              Number(o),
              Number(r.padEnd(3, '0'))
            ).getTime()
          }
          const i = l
              .replace(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/, '$1-$2-$3')
              .replace(/(\d{2}:\d{2}:\d{2}):(\d{1,3})$/, '$1.$2'),
            s = new Date(i).getTime()
          return Number.isFinite(s) ? s : 0
        },
        Fe = (e) => {
          const l = e,
            a = [l.timestamp, l['@timestamp'], l.receivedAt, l.createdAt, l.updatedAt, l.time, l.datetime, l.date]
          for (const t of a) {
            const e = Le(t)
            if (e > 0) return e
          }
          return 0
        },
        Ue = (e) => [...e].sort((e, l) => Fe(l) - Fe(e)),
        Pe = (e) => String(e.id || e.key || `${e.timestamp}-${e.service}-${e.message}`),
        He = (e, l) => {
          const a = new Set(e.map(Pe)),
            t = l.filter((e) => !a.has(Pe(e)))
          return Ue([...e, ...t])
        },
        We = (e = 1) => {
          const l = U(N.query),
            a = P(l),
            t = a ? y(a.end) : y(),
            i = K[me.value] ?? K['1h'],
            s = {
              page: e,
              pageSize: 30,
              sortBy: 'timestamp',
              sortOrder: 'desc',
              originType: ue.value,
              startTime: (a ? y(a.start) : t.subtract(i, 'hour')).toISOString(),
              endTime: t.toISOString()
            }
          return (
            ce.value.trim() && (s.keyword = ce.value.trim()),
            l.serviceName && (s.service = l.serviceName),
            ve.value.length > 0 && (s.levels = ve.value),
            'darwin-app' === ue.value && ((s.excludeServices = ['logs']), (s.excludeNodeIDs = ['logs-development'])),
            s
          )
        },
        qe = async (e = 1) => {
          var l
          ;(le.value = !0), (ae.value = !1)
          try {
            const a = We(e),
              t = await B(a)
            ;(te.value = Ue((null == t ? void 0 : t.logs) || [])),
              (ie.value = Number(
                (null == t ? void 0 : t.total) || (null == (l = null == t ? void 0 : t.logs) ? void 0 : l.length) || 0
              )),
              (se.value = e),
              (re.value = te.value.length < ie.value),
              Ye()
          } catch {
            ae.value = !0
          } finally {
            le.value = !1
          }
        },
        Ke = (e) => {
          const l = e.currentTarget
          l &&
            l.scrollHeight - l.scrollTop - l.clientHeight <= 80 &&
            (async () => {
              var e
              if (!oe.value && re.value) {
                oe.value = !0
                try {
                  const l = se.value + 1,
                    a = We(l),
                    t = await B(a),
                    i = (null == t ? void 0 : t.logs) || [],
                    s = Number(
                      (null == t ? void 0 : t.total) ||
                        (null == (e = null == t ? void 0 : t.logs) ? void 0 : e.length) ||
                        0
                    )
                  ;(te.value = He(te.value, i)), (ie.value = s), (se.value = l), (re.value = te.value.length < s)
                } catch (l) {
                } finally {
                  oe.value = !1
                }
              }
            })()
        },
        Ge = s(() => {
          const e = ie.value,
            l = te.value.filter((e) => {
              const l = new Date(e.timestamp),
                a = new Date()
              return l.toDateString() === a.toDateString()
            }).length,
            a = te.value.filter((e) => e.level === F.ERROR || e.level === F.FATAL).length
          return {
            total: e,
            today: l,
            errorRate: e > 0 ? Math.round((a / e) * 100) : 0,
            topServices: Ze.value,
            levelDistribution: Qe.value
          }
        }),
        Ze = i([]),
        Qe = i([]),
        Xe = i(!1),
        Ye = async () => {
          Xe.value = !0
          try {
            const e = await V({ timeRange: `-${me.value}`, originType: ue.value }),
              l = Number((null == e ? void 0 : e.totalLogs) || 0)
            Array.isArray(null == e ? void 0 : e.topServices) &&
              (Ze.value = e.topServices
                .slice(0, 5)
                .map((e) => ({
                  service: e.service,
                  count: Number(e.count ?? e.logCount ?? 0),
                  percentage: l > 0 ? (Number(e.count ?? e.logCount ?? 0) / l) * 100 : 0,
                  errorRate: Number(e.errorRate ?? 0)
                })))
            const a = Object.entries((null == e ? void 0 : e.levelStats) || {})
            Qe.value = a
              .sort(([, e], [, l]) => l - e)
              .map(([e, a]) => ({ level: e, count: a, percentage: l > 0 ? (a / l) * 100 : 0 }))
          } catch {
            ;(Ze.value = []), (Qe.value = [])
          } finally {
            Xe.value = !1
          }
        },
        Je = s(() => {
          const e = ce.value.trim().toLowerCase()
          return e
            ? te.value.filter((l) =>
                `${l.message || ''} ${l.service || ''} ${l.hostname || ''} ${l.level || ''}`.toLowerCase().includes(e)
              )
            : te.value
        }),
        el = async () => {
          const e = ++ye
          ;(fe = !0), (ge.value = !0), (_e.value = !1)
          try {
            const l = { page: 1, pageSize: 50, sortBy: 'timestamp', sortOrder: 'desc', originType: ue.value },
              a = await B(l)
            if (e !== ye || !fe || 'stream' !== Z.value) return
            ;(he.value = (null == a ? void 0 : a.logs) || []),
              (we.value = Number((null == a ? void 0 : a.total) || he.value.length))
          } catch (l) {
            return void (e === ye && 'stream' === Z.value && (_e.value = !0))
          } finally {
            e === ye && (ge.value = !1)
          }
          e === ye &&
            fe &&
            'stream' === Z.value &&
            null === pe.value &&
            (pe.value = window.setInterval(async () => {
              if (!be.value)
                try {
                  const l = { page: 1, pageSize: 50, sortBy: 'timestamp', sortOrder: 'desc', originType: ue.value },
                    a = await B(l)
                  if (e !== ye || !fe || 'stream' !== Z.value) return
                  ;(he.value = (null == a ? void 0 : a.logs) || []),
                    (we.value = Number((null == a ? void 0 : a.total) || he.value.length))
                } catch {
                  e === ye && 'stream' === Z.value && (_e.value = !0)
                }
            }, 5e3))
        },
        ll = () => {
          ;(ye += 1),
            (fe = !1),
            null !== pe.value && (window.clearInterval(pe.value), (pe.value = null)),
            (be.value = !1)
        },
        al = () => {
          be.value = !be.value
        },
        tl = async () => {
          ;(ke.value = !0), (ze.value = !1)
          try {
            const { getAppKeys: e, getIngestionStatus: a } = await l(
                async () => {
                  const { getAppKeys: e, getIngestionStatus: l } = await import('./metrics-uVJcD6zf.js').then(
                    (e) => e.A
                  )
                  return { getAppKeys: e, getIngestionStatus: l }
                },
                __vite__mapDeps([0, 1, 2, 3, 4, 5])
              ),
              [t] = await Promise.all([e(), a()])
            Ne.value = Array.isArray(t) ? t : []
          } catch {
            ze.value = !0
          } finally {
            ke.value = !1
          }
        },
        il = s(() => Ne.value.filter((e) => !1 !== e.isActive)),
        sl = s(() => {
          const e = Ne.value.length,
            l = il.value.length
          return { total: e, active: l, expired: e - l }
        }),
        ol = async () => {
          ;(Se.value = !0), (xe.value = !1)
          try {
            const e = await D({ page: 1, pageSize: 200, scope: a() }),
              l = (null == e ? void 0 : e.items) || []
            Re.value = l.map((e) => {
              var l, a, t
              return {
                label: (null == (l = e.identity) ? void 0 : l.name) || (null == (a = e.identity) ? void 0 : a.id),
                value: (null == (t = e.identity) ? void 0 : t.name) || ''
              }
            })
          } catch (e) {
            ;(Re.value = []), (xe.value = !0)
          } finally {
            Se.value = !1
          }
        },
        rl = async () => {
          if (Ce.value) {
            ;(Se.value = !0), (Me.value = !1), (je.value = !1)
            try {
              const e = {
                  page: 1,
                  pageSize: 30,
                  sortBy: 'timestamp',
                  sortOrder: 'desc',
                  service: Ce.value,
                  originType: ue.value
                },
                l = await B(e)
              ;($e.value = (null == l ? void 0 : l.logs) || []),
                (Ae.value = Number((null == l ? void 0 : l.total) || $e.value.length)),
                (Oe.value = 1),
                (Ie.value = Boolean(null == l ? void 0 : l.hasMore))
            } catch (e) {
              ;($e.value = []), (Ae.value = 0), (Ie.value = !1), (Me.value = !0)
            } finally {
              Se.value = !1
            }
          }
        },
        nl = async () => {
          if (Ce.value && !Te.value && Ie.value) {
            ;(Te.value = !0), (je.value = !1)
            try {
              const e = Oe.value + 1,
                l = await B({
                  page: e,
                  pageSize: 30,
                  sortBy: 'timestamp',
                  sortOrder: 'desc',
                  service: Ce.value,
                  originType: ue.value
                })
              ;($e.value = He($e.value, (null == l ? void 0 : l.logs) || [])),
                (Ae.value = Number((null == l ? void 0 : l.total) || $e.value.length)),
                (Oe.value = e),
                (Ie.value = Boolean(null == l ? void 0 : l.hasMore))
            } catch (e) {
              je.value = !0
            } finally {
              Te.value = !1
            }
          }
        },
        cl = async () => {
          ;(De.value = !0), (Ee.value = !1)
          try {
            const { default: e } = await l(
                async () => {
                  const { default: e } = await import('./index-BRz3eDUI.js')
                  return { default: e }
                },
                __vite__mapDeps([6, 0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12])
              ),
              a = await e.logs.listExceptions({ page: 1, pageSize: 20, timeRange: '24h' }),
              t = (null == a ? void 0 : a.items) || [],
              i = t.reduce((e, l) => e + Number(l.count || 0), 0),
              s = t.filter((e) => e.count >= 100).length,
              o = new Set(t.map((e) => e.service)).size
            Be.value = { total: i, critical: s, services: o, types: t.length }
          } catch {
            Ee.value = !0
          } finally {
            De.value = !1
          }
        },
        vl = () => {
          'overview' === Z.value
            ? qe(1)
            : 'ingest' === Z.value
              ? tl()
              : 'exception' === Z.value
                ? cl()
                : 'service' === Z.value
                  ? rl()
                  : 'stream' === Z.value && el()
        },
        ul = (e) => {
          e !== Z.value &&
            (ll(),
            (Z.value = e),
            'overview' === e && 0 === te.value.length && qe(1),
            'ingest' === e && tl(),
            'service' === e && ol(),
            'exception' === e && cl())
        }
      o(() => {
        const e = U(N.query)
        e.tab && (Z.value = e.tab),
          void 0 !== e.keyword && (ce.value = e.keyword),
          e.serviceName && (Ce.value = e.serviceName),
          e.range && K[e.range] && (me.value = e.range),
          qe(1),
          Q &&
            (async () => {
              var e
              try {
                X.value = Boolean(null == (e = await L()) ? void 0 : e.enabled)
              } catch {}
            })(),
          ee.value && window.clearInterval(ee.value),
          (ee.value = window.setInterval(() => {
            'overview' === Z.value && qe(1)
          }, 3e4)),
          'stream' === Z.value && el()
      }),
        r(
          () => N.query,
          () => {
            const e = U(N.query)
            void 0 !== e.tab && (Z.value = e.tab),
              void 0 !== e.keyword && (ce.value = e.keyword),
              void 0 !== e.serviceName && (Ce.value = e.serviceName),
              e.range && K[e.range] && (me.value = e.range),
              (void 0 === e.tab &&
                void 0 === e.keyword &&
                void 0 === e.serviceName &&
                void 0 === e.range &&
                void 0 === e.start) ||
                vl()
          }
        )
      const ml = () => {
        ee.value && (window.clearInterval(ee.value), (ee.value = null))
      }
      n(() => {
        ll(), ml()
      }),
        c(() => {
          ll(), ml()
        })
      const dl = (e, l) => {
        const a = e.id || e.key || `${e.timestamp}-${l}`,
          t = de.value === a
        return v(
          'div',
          {
            key: a,
            class: 'mobile-log-center__list-card-wrapper',
            onClick: () => {
              return (e = a), void (de.value = de.value === e ? null : e)
              var e
            }
          },
          [
            v(
              x,
              { size: 'small', bordered: !1, class: 'mobile-log-center__list-card' },
              {
                default: () => [
                  v('div', { class: 'mobile-log-center__log-header' }, [
                    v('span', { class: 'mobile-log-center__log-time' }, [
                      e.timestamp ? y(e.timestamp).format('MM-DD HH:mm:ss') : '-'
                    ]),
                    v(M, { size: 'small', type: G[e.level] || 'default' }, { default: () => [e.level] })
                  ]),
                  v('div', { class: 'mobile-log-center__log-service' }, [e.service || '-']),
                  v('div', { class: 'mobile-log-center__log-message' }, [
                    t
                      ? e.message || '-'
                      : (e.message || '').length > 120
                        ? (e.message || '').slice(0, 120) + '...'
                        : e.message || '-'
                  ]),
                  t &&
                    v('div', { class: 'mobile-log-center__log-detail' }, [
                      e.hostname &&
                        v('div', { class: 'mobile-log-center__log-meta-row' }, [
                          v('span', { class: 'mobile-log-center__log-meta-label' }, [u('Host')]),
                          v('span', { class: 'mobile-log-center__log-meta-value' }, [e.hostname])
                        ]),
                      e.containerId &&
                        v('div', { class: 'mobile-log-center__log-meta-row' }, [
                          v('span', { class: 'mobile-log-center__log-meta-label' }, [u('Container')]),
                          v('span', { class: 'mobile-log-center__log-meta-value' }, [e.containerId])
                        ]),
                      e.thread &&
                        v('div', { class: 'mobile-log-center__log-meta-row' }, [
                          v('span', { class: 'mobile-log-center__log-meta-label' }, [u('Thread')]),
                          v('span', { class: 'mobile-log-center__log-meta-value' }, [e.thread])
                        ]),
                      e.originType &&
                        v('div', { class: 'mobile-log-center__log-meta-row' }, [
                          v('span', { class: 'mobile-log-center__log-meta-label' }, [u('Origin')]),
                          v('span', { class: 'mobile-log-center__log-meta-value' }, [e.originType])
                        ]),
                      e.stackTrace &&
                        v('div', { class: 'mobile-log-center__log-stack' }, [
                          v('div', { class: 'mobile-log-center__log-meta-label' }, [u('Stack')]),
                          v('pre', { class: 'mobile-log-center__log-stack-code' }, [e.stackTrace])
                        ])
                    ])
                ]
              }
            )
          ]
        )
      }
      return () => {
        let e, l, a, t, i
        return v('div', { class: 'mobile-log-center' }, [
          v('div', { class: 'mobile-log-center__header' }, [
            v('div', null, [v('h2', { class: 'mobile-log-center__title' }, [u('日志中心')])]),
            v(
              S,
              {
                size: 'small',
                type: 'primary',
                onClick: vl,
                'aria-label': '刷新日志数据',
                icon: () => m(k, { size: 16 })
              },
              null
            )
          ]),
          v(
            O,
            { active: Z.value, type: 'line', animated: !0, class: 'mobile-log-center__tabs', 'onUpdate:active': ul },
            {
              default: () => [
                v(
                  d,
                  { name: 'overview', title: '概览' },
                  H(
                    (e = v('div', { class: 'mobile-log-center__tab-content' }, [
                      v('div', { class: 'mobile-log-center__stats' }, [
                        v(
                          I,
                          { cols: 3, gap: '8px' },
                          {
                            default: () => [
                              v('div', null, [
                                v('div', { class: 'mobile-log-center__stat-card' }, [
                                  v(
                                    'div',
                                    { class: 'mobile-log-center__stat-icon mobile-log-center__stat-icon--total' },
                                    [v(g, { size: 16 }, null)]
                                  ),
                                  v('div', { class: 'mobile-log-center__stat-value' }, [Ge.value.total]),
                                  v('div', { class: 'mobile-log-center__stat-label' }, [u('总日志')])
                                ])
                              ]),
                              v('div', null, [
                                v('div', { class: 'mobile-log-center__stat-card' }, [
                                  v(
                                    'div',
                                    { class: 'mobile-log-center__stat-icon mobile-log-center__stat-icon--today' },
                                    [v(_, { size: 16 }, null)]
                                  ),
                                  v('div', { class: 'mobile-log-center__stat-value' }, [Ge.value.today]),
                                  v('div', { class: 'mobile-log-center__stat-label' }, [u('今日')])
                                ])
                              ]),
                              v('div', null, [
                                v('div', { class: 'mobile-log-center__stat-card' }, [
                                  v(
                                    'div',
                                    { class: 'mobile-log-center__stat-icon mobile-log-center__stat-icon--error-rate' },
                                    [v(b, { size: 16 }, null)]
                                  ),
                                  v('div', { class: 'mobile-log-center__stat-value' }, [Ge.value.errorRate, u('%')]),
                                  v('div', { class: 'mobile-log-center__stat-label' }, [u('错误率')])
                                ])
                              ])
                            ]
                          }
                        )
                      ]),
                      v(
                        I,
                        { cols: 2, gap: '8px', class: 'mobile-log-center__analytics' },
                        {
                          default: () => [
                            v('div', null, [
                              v(
                                x,
                                {
                                  size: 'small',
                                  title: 'Top 5 服务',
                                  bordered: !1,
                                  class: 'mobile-log-center__analytic-card'
                                },
                                {
                                  default: () => [
                                    Ze.value.length > 0
                                      ? v('div', { class: 'mobile-log-center__service-list' }, [
                                          Ze.value.map((e, l) =>
                                            v('div', { key: l, class: 'mobile-log-center__service-item' }, [
                                              v('div', { class: 'mobile-log-center__service-name' }, [
                                                v('span', { class: 'mobile-log-center__service-dot' }, null),
                                                v('span', null, [e.service])
                                              ]),
                                              v('div', { class: 'mobile-log-center__service-meta' }, [
                                                v('span', null, [e.count.toLocaleString(), u(' 条')]),
                                                v(
                                                  'span',
                                                  { class: e.errorRate > 0 ? 'mobile-log-center__text-danger' : '' },
                                                  [e.errorRate.toFixed(1), u('% 错误')]
                                                )
                                              ]),
                                              v(
                                                $,
                                                {
                                                  percentage: e.percentage,
                                                  showPivot: !1,
                                                  strokeWidth: 4,
                                                  color: 'var(--color-primary-6)'
                                                },
                                                null
                                              )
                                            ])
                                          )
                                        ])
                                      : v(T, { description: '暂无数据' }, null)
                                  ]
                                }
                              )
                            ]),
                            v('div', null, [
                              v(
                                x,
                                {
                                  size: 'small',
                                  title: '日志级别',
                                  bordered: !1,
                                  class: 'mobile-log-center__analytic-card'
                                },
                                {
                                  default: () => [
                                    Qe.value.length > 0
                                      ? v('div', { class: 'mobile-log-center__service-list' }, [
                                          Qe.value.map((e, l) => {
                                            return v('div', { key: l, class: 'mobile-log-center__service-item' }, [
                                              v('div', { class: 'mobile-log-center__service-name' }, [
                                                v(
                                                  'span',
                                                  {
                                                    class: [
                                                      'mobile-log-center__level-dot',
                                                      `mobile-log-center__level-dot--${e.level}`
                                                    ]
                                                  },
                                                  null
                                                ),
                                                v('span', null, [e.level.toUpperCase()])
                                              ]),
                                              v('div', { class: 'mobile-log-center__service-meta' }, [
                                                v('span', null, [e.count.toLocaleString(), u(' 条')]),
                                                v('span', null, [e.percentage.toFixed(1), u('%')])
                                              ]),
                                              v(
                                                $,
                                                {
                                                  percentage: e.percentage,
                                                  showPivot: !1,
                                                  strokeWidth: 4,
                                                  color:
                                                    ((a = e.level),
                                                    {
                                                      error: 'var(--color-danger-6)',
                                                      fatal: 'var(--color-danger-6)',
                                                      warn: 'var(--color-warning-6)',
                                                      warning: 'var(--color-warning-6)',
                                                      info: 'var(--color-primary-6)',
                                                      debug: 'var(--color-text-3)',
                                                      trace: 'var(--color-text-3)'
                                                    }[a] || 'var(--color-text-3)')
                                                },
                                                null
                                              )
                                            ])
                                            var a
                                          })
                                        ])
                                      : v(T, { description: '暂无数据' }, null)
                                  ]
                                }
                              )
                            ])
                          ]
                        }
                      ),
                      v('div', { class: 'mobile-log-center__time-chips' }, [
                        q.map((e) =>
                          v(
                            S,
                            {
                              key: e.key,
                              size: 'small',
                              type: me.value === e.key ? 'primary' : 'default',
                              onClick: () => {
                                return (l = e.key), (me.value = l), void qe(1)
                                var l
                              }
                            },
                            { default: () => [e.label] }
                          )
                        )
                      ]),
                      Q &&
                        v('div', { class: 'mobile-log-center__debug-toggle' }, [
                          v('div', { class: 'mobile-log-center__debug-info' }, [
                            v('span', { class: 'mobile-log-center__debug-title' }, [u('调试日志收集')]),
                            v('span', { class: 'mobile-log-center__debug-status' }, [X.value ? '已开启' : '已关闭'])
                          ]),
                          v(C, { modelValue: X.value, loading: Y.value, 'onUpdate:modelValue': J }, null)
                        ]),
                      Q &&
                        v('div', { class: 'mobile-log-center__origin-select' }, [
                          v(
                            A,
                            {
                              modelValue: ue.value,
                              options: Ve,
                              'onUpdate:modelValue': (e) => {
                                ;(ue.value = e), qe(1)
                              }
                            },
                            null
                          )
                        ]),
                      v('div', { class: 'mobile-log-center__search' }, [
                        v(
                          R,
                          {
                            modelValue: ce.value,
                            'onUpdate:modelValue': (e) => (ce.value = e),
                            placeholder: '搜索日志关键词...',
                            clearable: !0,
                            onEnter: () => qe(1)
                          },
                          null
                        )
                      ]),
                      v('div', { class: 'mobile-log-center__level-filters' }, [
                        W.map((e) =>
                          v(
                            'div',
                            {
                              key: e.key,
                              onClick: () =>
                                ((e) => {
                                  const l = ve.value.indexOf(e)
                                  l >= 0 ? ve.value.splice(l, 1) : ve.value.push(e), qe(1)
                                })(e.key),
                              class: 'mobile-log-center__level-chip-wrapper'
                            },
                            [
                              v(
                                M,
                                {
                                  size: 'small',
                                  type: ve.value.includes(e.key) ? G[e.key] : 'default',
                                  class: [
                                    'mobile-log-center__level-chip',
                                    `mobile-log-center__level-chip--${e.key}`,
                                    ve.value.includes(e.key) && 'mobile-log-center__level-chip--active'
                                  ]
                                },
                                { default: () => [e.label] }
                              )
                            ]
                          )
                        )
                      ]),
                      le.value
                        ? v('div', { class: 'mobile-log-center__loading' }, [v(j, { loading: !0, size: '24px' }, null)])
                        : ae.value
                          ? v('div', { class: 'mobile-log-center__error' }, [
                              v(
                                T,
                                { description: '数据加载失败，请检查网络连接后重试' },
                                {
                                  default: () => [
                                    v(
                                      S,
                                      { type: 'primary', size: 'small', onClick: () => qe(1) },
                                      { default: () => [u('重新加载')] }
                                    )
                                  ]
                                }
                              )
                            ])
                          : 0 === Je.value.length
                            ? v('div', { class: 'mobile-log-center__empty-state' }, [
                                v(T, { description: ce.value.trim() ? '没有匹配的日志' : '暂无日志数据' }, null)
                              ])
                            : v('div', { ref: ne, class: 'mobile-log-center__list', onScroll: Ke }, [
                                Je.value.map((e, l) => dl(e, l)),
                                v('div', { class: 'mobile-log-center__load-more' }, [
                                  oe.value ? '加载中…' : re.value ? '上滑加载更多' : '已加载全部日志'
                                ])
                              ])
                    ]))
                  )
                    ? e
                    : { default: () => [e] }
                ),
                v(
                  d,
                  { name: 'stream', title: '实时流' },
                  H(
                    (l = v('div', { class: 'mobile-log-center__tab-content' }, [
                      v('div', { class: 'mobile-log-center__stream-actions' }, [
                        null === pe.value
                          ? v(
                              S,
                              {
                                type: 'primary',
                                size: 'small',
                                onClick: el,
                                loading: ge.value,
                                icon: () => m(k, { size: 16 })
                              },
                              { default: () => [u('开始')] }
                            )
                          : v(p, null, [
                              v(
                                S,
                                { size: 'small', type: be.value ? 'primary' : 'default', onClick: al },
                                { default: () => [be.value ? '恢复' : '暂停'] }
                              ),
                              v(S, { size: 'small', onClick: ll }, { default: () => [u('停止')] })
                            ]),
                        v('span', { class: 'mobile-log-center__stream-hint' }, [
                          null === pe.value ? '点击开始接收实时日志' : be.value ? '已暂停' : `实时中 · ${we.value} 条`
                        ])
                      ]),
                      ge.value
                        ? v('div', { class: 'mobile-log-center__loading' }, [v(j, { loading: !0, size: '24px' }, null)])
                        : _e.value && 0 === he.value.length
                          ? v('div', { class: 'mobile-log-center__error' }, [
                              v(
                                T,
                                { description: '实时日志加载失败，请检查网络后重试' },
                                {
                                  default: () => [
                                    v(
                                      S,
                                      { type: 'primary', size: 'small', onClick: el },
                                      { default: () => [u('重新开始')] }
                                    )
                                  ]
                                }
                              )
                            ])
                          : 0 === he.value.length
                            ? v('div', { class: 'mobile-log-center__empty-state' }, [
                                v(T, { description: '暂无日志' }, null)
                              ])
                            : v('div', { class: 'mobile-log-center__stream-list' }, [
                                he.value.map((e, l) =>
                                  v('div', { key: e.id || e.key || l, class: 'mobile-log-center__stream-line' }, [
                                    v('span', { class: 'mobile-log-center__stream-line-time' }, [
                                      e.timestamp ? y(e.timestamp).format('HH:mm:ss') : '-'
                                    ]),
                                    v(
                                      M,
                                      {
                                        size: 'small',
                                        type: G[e.level] || 'default',
                                        class: [
                                          'mobile-log-center__stream-level',
                                          `mobile-log-center__stream-level--${e.level}`
                                        ]
                                      },
                                      { default: () => [e.level] }
                                    ),
                                    v('span', { class: 'mobile-log-center__stream-line-service' }, [e.service || '-']),
                                    v('span', { class: 'mobile-log-center__stream-line-msg' }, [e.message])
                                  ])
                                )
                              ])
                    ]))
                  )
                    ? l
                    : { default: () => [l] }
                ),
                v(
                  d,
                  { name: 'service', title: '服务' },
                  H(
                    (a = v('div', { class: 'mobile-log-center__tab-content' }, [
                      v('div', { class: 'mobile-log-center__origin-select' }, [
                        v(
                          A,
                          {
                            modelValue: Ce.value ?? '',
                            options: Re.value,
                            placeholder: Se.value ? '加载中…' : '选择服务',
                            clearable: !0,
                            'onUpdate:modelValue': (e) => {
                              ;(Ce.value = e), e && rl()
                            }
                          },
                          null
                        ),
                        xe.value &&
                          v('div', { class: 'mobile-log-center__selector-error', role: 'alert' }, [
                            v('span', null, [u('服务列表加载失败')]),
                            v(S, { size: 'small', type: 'ghost', onClick: ol }, { default: () => [u('重试')] })
                          ])
                      ]),
                      Se.value
                        ? v('div', { class: 'mobile-log-center__loading' }, [v(j, { loading: !0, size: '24px' }, null)])
                        : xe.value
                          ? v('div', { class: 'mobile-log-center__error' }, [
                              v(T, { description: '服务列表加载失败，请重试' }, null)
                            ])
                          : Ce.value
                            ? Me.value
                              ? v('div', { class: 'mobile-log-center__error' }, [
                                  v(
                                    T,
                                    { description: '服务日志加载失败，请检查网络后重试' },
                                    {
                                      default: () => [
                                        v(
                                          S,
                                          { type: 'primary', size: 'small', onClick: rl },
                                          { default: () => [u('重新加载')] }
                                        )
                                      ]
                                    }
                                  )
                                ])
                              : 0 === $e.value.length
                                ? v('div', { class: 'mobile-log-center__empty-state' }, [
                                    v(T, { description: `${Ce.value} 暂无日志` }, null)
                                  ])
                                : v('div', { class: 'mobile-log-center__list' }, [
                                    $e.value.map((e, l) => dl(e, l)),
                                    Ie.value &&
                                      v('div', { class: 'mobile-log-center__load-more' }, [
                                        v(
                                          S,
                                          { size: 'small', type: 'primary', loading: Te.value, onClick: nl },
                                          {
                                            default: () => [u('加载更多 ('), $e.value.length, u('/'), Ae.value, u(')')]
                                          }
                                        ),
                                        je.value &&
                                          v('p', { class: 'mobile-log-center__load-more-error' }, [
                                            u('加载更多日志失败，请重试。')
                                          ])
                                      ])
                                  ])
                            : v('div', { class: 'mobile-log-center__empty-state' }, [
                                v(T, { description: '请选择一个服务' }, null)
                              ])
                    ]))
                  )
                    ? a
                    : { default: () => [a] }
                ),
                v(
                  d,
                  { name: 'ingest', title: '接入' },
                  H(
                    (t = v('div', { class: 'mobile-log-center__tab-content' }, [
                      Q
                        ? ke.value
                          ? v('div', { class: 'mobile-log-center__loading' }, [
                              v(j, { loading: !0, size: '24px' }, null)
                            ])
                          : ze.value
                            ? v('div', { class: 'mobile-log-center__error' }, [
                                v(
                                  T,
                                  { description: '数据加载失败，请检查网络连接后重试' },
                                  {
                                    default: () => [
                                      v(
                                        S,
                                        { type: 'primary', size: 'small', onClick: tl },
                                        { default: () => [u('重新加载')] }
                                      )
                                    ]
                                  }
                                )
                              ])
                            : 0 === Ne.value.length
                              ? v('div', { class: 'mobile-log-center__empty-state' }, [
                                  v(T, { description: '暂无接入 Key' }, null)
                                ])
                              : v(p, null, [
                                  v('div', { class: 'mobile-log-center__ingest-stats' }, [
                                    v(
                                      I,
                                      { cols: 3, gap: '8px' },
                                      {
                                        default: () => [
                                          v('div', null, [
                                            v('div', { class: 'mobile-log-center__stat-card' }, [
                                              v(
                                                'div',
                                                {
                                                  class:
                                                    'mobile-log-center__stat-icon mobile-log-center__stat-icon--total'
                                                },
                                                [v(f, { size: 16 }, null)]
                                              ),
                                              v('div', { class: 'mobile-log-center__stat-value' }, [sl.value.total]),
                                              v('div', { class: 'mobile-log-center__stat-label' }, [u('总计')])
                                            ])
                                          ]),
                                          v('div', null, [
                                            v('div', { class: 'mobile-log-center__stat-card' }, [
                                              v(
                                                'div',
                                                {
                                                  class:
                                                    'mobile-log-center__stat-icon mobile-log-center__stat-icon--today'
                                                },
                                                [v(h, { size: 16 }, null)]
                                              ),
                                              v('div', { class: 'mobile-log-center__stat-value' }, [sl.value.active]),
                                              v('div', { class: 'mobile-log-center__stat-label' }, [u('活跃')])
                                            ])
                                          ]),
                                          v('div', null, [
                                            v('div', { class: 'mobile-log-center__stat-card' }, [
                                              v(
                                                'div',
                                                {
                                                  class:
                                                    'mobile-log-center__stat-icon mobile-log-center__stat-icon--error-rate'
                                                },
                                                [v(b, { size: 16 }, null)]
                                              ),
                                              v('div', { class: 'mobile-log-center__stat-value' }, [sl.value.expired]),
                                              v('div', { class: 'mobile-log-center__stat-label' }, [u('过期')])
                                            ])
                                          ])
                                        ]
                                      }
                                    )
                                  ]),
                                  v('div', { class: 'mobile-log-center__list' }, [
                                    Ne.value.map((e, l) =>
                                      v(
                                        x,
                                        {
                                          key: e.id || l,
                                          size: 'small',
                                          bordered: !1,
                                          class: 'mobile-log-center__list-card'
                                        },
                                        {
                                          default: () => [
                                            v('div', { class: 'mobile-log-center__log-header' }, [
                                              v('span', { class: 'mobile-log-center__log-service' }, [
                                                e.name || e.appKey || '-'
                                              ]),
                                              v(
                                                M,
                                                { size: 'small', type: !1 !== e.isActive ? 'success' : 'default' },
                                                { default: () => [!1 !== e.isActive ? '活跃' : '过期'] }
                                              )
                                            ])
                                          ]
                                        }
                                      )
                                    )
                                  ])
                                ])
                        : v('div', { class: 'mobile-log-center__empty-state' }, [
                            v(T, { description: '仅管理员可查看接入配置' }, null)
                          ])
                    ]))
                  )
                    ? t
                    : { default: () => [t] }
                ),
                v(
                  d,
                  { name: 'exception', title: '异常' },
                  H(
                    (i = v('div', { class: 'mobile-log-center__tab-content' }, [
                      De.value
                        ? v('div', { class: 'mobile-log-center__loading' }, [v(j, { loading: !0, size: '24px' }, null)])
                        : Ee.value
                          ? v('div', { class: 'mobile-log-center__error' }, [
                              v(
                                T,
                                { description: '数据加载失败，请检查网络连接后重试' },
                                {
                                  default: () => [
                                    v(
                                      S,
                                      { type: 'primary', size: 'small', onClick: cl },
                                      { default: () => [u('重新加载')] }
                                    )
                                  ]
                                }
                              )
                            ])
                          : 0 === Be.value.total
                            ? v('div', { class: 'mobile-log-center__empty-state' }, [
                                v(T, { description: '暂无异常数据' }, null)
                              ])
                            : v(p, null, [
                                v('div', { class: 'mobile-log-center__stats' }, [
                                  v(
                                    I,
                                    { cols: 2, gap: '8px' },
                                    {
                                      default: () => [
                                        v('div', null, [
                                          v('div', { class: 'mobile-log-center__stat-card' }, [
                                            v(
                                              'div',
                                              {
                                                class:
                                                  'mobile-log-center__stat-icon mobile-log-center__stat-icon--error-rate'
                                              },
                                              [v(w, { size: 16 }, null)]
                                            ),
                                            v('div', { class: 'mobile-log-center__stat-value' }, [Be.value.total]),
                                            v('div', { class: 'mobile-log-center__stat-label' }, [u('异常总数')])
                                          ])
                                        ]),
                                        v('div', null, [
                                          v('div', { class: 'mobile-log-center__stat-card' }, [
                                            v(
                                              'div',
                                              {
                                                class:
                                                  'mobile-log-center__stat-icon mobile-log-center__stat-icon--total'
                                              },
                                              [v(b, { size: 16 }, null)]
                                            ),
                                            v('div', { class: 'mobile-log-center__stat-value' }, [Be.value.critical]),
                                            v('div', { class: 'mobile-log-center__stat-label' }, [u('严重异常')])
                                          ])
                                        ])
                                      ]
                                    }
                                  )
                                ])
                              ])
                    ]))
                  )
                    ? i
                    : { default: () => [i] }
                )
              ]
            }
          )
        ])
      }
    }
  })
export { Z as default }
