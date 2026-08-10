import {
  p as e,
  a0 as l,
  a1 as a,
  w as i,
  aJ as r,
  aK as t,
  aL as s,
  aM as o,
  aN as v,
  aO as n,
  $ as u,
  aP as c,
  aQ as d,
  Z as m,
  a2 as b,
  ac as p,
  aR as _,
  aS as y,
  aT as w,
  aU as g,
  aV as h,
  aW as f,
  aX as k,
  aY as x,
  aZ as S,
  a_ as z,
  a$ as C,
  b0 as q,
  b1 as M,
  b2 as A,
  b3 as j,
  b4 as R,
  b5 as L,
  b6 as T,
  b7 as $,
  ai as I
} from './invariable-DewVS0br.js'
import { M as D } from './MobileButton-BKhxhz5A.js'
import { M as P } from './MobileCard-BxmuYclQ.js'
import { M as E } from './MobileTag-ByR2jSPf.js'
import { M as O } from './MobileEmpty-BimvXy70.js'
import { M as N } from './MobileLoading-DlB38x7T.js'
import { M as U } from './MobileInput-OCuvcoNh.js'
import './MobileToast-CIN42EDh.js'
import { M as V } from './MobileGrid-sIXQCLxa.js'
import { f as B, a as K, b as F, c as G, d as Y, e as H, q as J, h as W } from './metrics-uVJcD6zf.js'
import './request-BiInMBwl.js'
import { b as Z, d as Q } from './index-DFkcx8xz.js'
import { u as X } from './useTimeStore-CVw7RN2Q.js'
import { b as ee, G as le, a as ae, m as ie, f as re, P as te, n as se } from './queryNumberDisplay-tHOniZKI.js'
import { L as oe } from './LineChart-gPgXHJ75.js'
import { B as ve } from './BarChart-BD7y_EJr.js'
import { n as ne } from './queryModel-CK1Nudco.js'
import { S as ue } from './ServiceHealthBadge-b4ePBNa-.js'
import { c as ce } from './clientNotifications-CmKa3qCA.js'
import { useDrawerToggle as de } from './MobileLayout-Cm40AytQ.js'
import './BaseChart-FGf3lmW3.js'
import './alerts-CIHfuoAx.js'
import './MobileVantProvider-BmQB5FA8.js'
const me = e({
    name: 'MobileHeaderToolbar',
    setup() {
      const e = u(),
        c = de(),
        d = l(''),
        m = l(Z() || {}),
        b = a(() => m.value.nickName || m.value.email || '星光用户'),
        p = a(() => m.value.avatar || ''),
        _ = a(() => b.value.charAt(0)),
        y = (l) => {
          'Enter' === l.key &&
            (() => {
              const l = d.value.trim()
              if (!l) return
              const a = l.toLowerCase()
              ;/trace|span|链路/.test(a)
                ? e.push({ path: '/mobile/trace-explorer', query: { keyword: l } })
                : /log|error|日志|错误/.test(a)
                  ? e.push({ path: '/mobile/log-center', query: { keyword: l } })
                  : /alert|告警|通知/.test(a)
                    ? e.push({ path: '/mobile/alerts-inbox', query: { keyword: l } })
                    : /metric|cpu|memory|指标|内存/.test(a)
                      ? e.push({ path: '/mobile/metrics-explorer', query: { keyword: l } })
                      : e.push({ path: '/mobile/services-v2', query: { keyword: l } })
            })()
        },
        w = () => {
          e.push('/mobile/scan-login')
        },
        g = () => {
          e.push('/mobile/notifications')
        }
      return () =>
        i('div', { class: 'mobile-header-toolbar' }, [
          i(
            'button',
            { type: 'button', class: 'mobile-header-toolbar__avatar-btn', onClick: c, 'aria-label': '打开个人中心' },
            [
              p.value
                ? i(r, { width: '32', height: '32', fit: 'cover', src: p.value, round: !0, alt: '用户头像' }, null)
                : i('span', { class: 'mobile-header-toolbar__avatar-fallback', 'aria-hidden': 'true' }, [_.value])
            ]
          ),
          i('div', { class: 'mobile-header-toolbar__search' }, [
            i(
              t,
              {
                modelValue: d.value,
                placeholder: '搜索服务、日志…',
                clearable: !0,
                'onUpdate:modelValue': (e) => (d.value = String(e)),
                onKeypress: y,
                'aria-label': '搜索服务、日志'
              },
              { leftIcon: () => i(s, { size: 16, 'aria-hidden': 'true' }, null) }
            )
          ]),
          i('div', { class: 'mobile-header-toolbar__actions' }, [
            i(
              'button',
              {
                type: 'button',
                class: 'mobile-header-toolbar__action',
                onClick: g,
                'aria-label': ce.value > 0 ? `消息通知，有${ce.value}条未读` : '消息通知'
              },
              [
                i(
                  o,
                  { content: ce.value || void 0, max: 99, dot: ce.value > 0 },
                  { default: () => [i(v, { size: 20, 'aria-hidden': 'true' }, null)] }
                )
              ]
            ),
            i(
              'button',
              { type: 'button', class: 'mobile-header-toolbar__action', onClick: w, 'aria-label': '扫一扫' },
              [i(n, { size: 20, 'aria-hidden': 'true' }, null)]
            )
          ])
        ])
    }
  }),
  be = (e) => {
    if (null == e ? void 0 : e.some((e) => e.widgets.length > 0)) return e
    const [l] = ee()
    return l ? [l] : []
  }
function pe(e) {
  return 'function' == typeof e || ('[object Object]' === Object.prototype.toString.call(e) && !I(e))
}
const _e = 'starlight_overview_mobile_auto_refresh_v1',
  ye = [
    { label: '关闭', value: 'off' },
    { label: '自动', value: 'auto' },
    { label: '15 秒', value: '15s' },
    { label: '30 秒', value: '30s' },
    { label: '1 分钟', value: '1m' },
    { label: '5 分钟', value: '5m' }
  ],
  we = {
    'query-card': ['自定义查询', '指标'],
    'metric-summary': ['指标', '摘要', '总览'],
    'risk-service': ['服务', '风险', '健康', '稳定性', '异常排查'],
    incident: ['告警', '事件', '稳定性', '异常排查'],
    'ingest-status': ['接入', '状态', '采集', '健康'],
    trend: ['指标', '趋势', '流量', '性能'],
    'quick-pivot': ['导航', '服务', '快捷入口'],
    'darwin-infra-summary': ['资源', '摘要', '资源水位', '容量'],
    'darwin-infra-trend': ['资源', '趋势', '资源水位', '容量'],
    'darwin-instance-table': ['资源', '实例', '资源水位', '容量']
  },
  ge = {
    requests: ['流量', '吞吐'],
    errors: ['稳定性', '错误', '异常排查'],
    latency: ['性能', '延迟'],
    'service-count': ['服务', '总览'],
    'healthy-services': ['健康', '服务'],
    'active-alerts': ['告警', '稳定性', '异常排查'],
    'total-requests': ['流量', '吞吐'],
    'error-rate': ['稳定性', '错误', '异常排查'],
    'p95-latency': ['性能', '延迟'],
    'ingest-success-rate': ['采集', '健康'],
    cpu: ['资源水位', 'CPU', '容量'],
    memory: ['资源水位', '内存', '容量']
  },
  he = { metrics: '指标', logs: '日志', traces: '链路', alerts: '告警', serviceCatalog: '服务', ingestion: '接入' },
  fe = {
    'query-card': '自定义指标',
    'metric-summary': '指标摘要',
    'risk-service': '风险服务',
    incident: '活跃事件',
    'ingest-status': '接入状态',
    trend: '趋势',
    'quick-pivot': '快捷入口',
    'darwin-infra-summary': '资源摘要',
    'darwin-infra-trend': '资源趋势',
    'darwin-instance-table': '实例资源'
  },
  ke = (e) => {
    var l
    const a = null == (l = e.editor) ? void 0 : l.displayedMetrics
    return a && a.length
      ? a
      : 'metric-summary' === e.kind
        ? [e.config.metricKey]
        : 'trend' === e.kind || 'darwin-infra-summary' === e.kind || 'darwin-infra-trend' === e.kind
          ? [e.config.metric]
          : 'darwin-instance-table' === e.kind
            ? ['cpu', 'memory']
            : 'ingest-status' === e.kind
              ? ['ingest-success-rate']
              : 'incident' === e.kind
                ? ['active-alerts']
                : 'risk-service' === e.kind
                  ? ['healthy-services', 'error-rate', 'p95-latency']
                  : []
  },
  xe = (e) => se([...(we[e.kind] || []), ...ke(e).flatMap((e) => ge[e] || []), he[e.capability], ...(e.tags || [])]),
  Se = { '15m': '15分钟', '1h': '1小时', '4h': '4小时', '1d': '1天', '2d': '2天', '7d': '7天', custom: '自定义' },
  ze = e({
    name: 'MobileOverviewV2',
    setup() {
      const e = u(),
        r = X(),
        t = l(!0),
        o = l(!1),
        n = l(!1),
        I = l(''),
        Z = l(0),
        ee = l(!1)
      let se = 0,
        ce = !1
      const de = l(null),
        we = l(r.timeRange),
        ge = l(r.isLive),
        he = l(''),
        ke = l(''),
        ze = l(''),
        Ce = l(!1),
        qe = l(Q()),
        Me = l([]),
        Ae = l('user-overview'),
        je = l([]),
        Re = l({}),
        Le = l({ overall: { requests: [], errors: [], latency: [] } }),
        Te = l({ highRiskServices: [], recentDegradedServices: [] }),
        $e = l(null),
        Ie = l([]),
        De = l({}),
        Pe = l('off'),
        Ee = l(null),
        Oe = l(0)
      let Ne = 0,
        Ue = null,
        Ve = null,
        Be = !1,
        Ke = null
      const Fe = (e, l = '') => {
          return 'number' == typeof e
            ? `${((a = e), a >= 1e8 ? `${(a / 1e8).toFixed(1)}亿` : a >= 1e4 ? `${(a / 1e4).toFixed(1)}万` : a.toLocaleString())}${l}`
            : '--'
          var a
        },
        Ge = () => {
          const e = Date.now() - (Ye || Date.now())
          return e < 6e4
            ? '刚刚更新'
            : e < 36e5
              ? `${Math.floor(e / 6e4)}分钟前更新`
              : `${Math.floor(e / 36e5)}小时前更新`
        }
      let Ye = 0,
        He = null
      const Je = a(() => Me.value.find((e) => e.id === Ae.value) || Me.value[0]),
        We = a(() => {
          var e
          return (null == (e = Je.value) ? void 0 : e.widgets) || []
        }),
        Ze = a(() => {
          const e = {
            'metric-summary': 30,
            'risk-service': 10,
            incident: 10,
            trend: 40,
            'ingest-status': 50,
            'darwin-infra-summary': 50,
            'darwin-infra-trend': 40,
            'darwin-instance-table': 50,
            'query-card': 60,
            'quick-pivot': 70
          }
          return [...ll.value].sort((l, a) => (e[l.kind] || 60) - (e[a.kind] || 60))
        }),
        Qe = a(() => Ze.value.filter((e) => 'risk-service' === e.kind || 'incident' === e.kind)),
        Xe = a(() => Ze.value.filter((e) => 'risk-service' !== e.kind && 'incident' !== e.kind)),
        el = a(() => {
          const e = new Map()
          return (
            We.value.forEach((l) => {
              xe(l).forEach((l) => {
                e.set(l, (e.get(l) || 0) + 1)
              })
            }),
            Array.from(e.entries())
              .sort(([e, l], [a, i]) => i - l || e.localeCompare(a))
              .map(([e, l]) => ({ tag: e, count: l }))
          )
        }),
        ll = a(() => {
          let e = We.value
          return ze.value && (e = e.filter((e) => xe(e).includes(ze.value))), e
        }),
        al = () =>
          je.value.length > 0 ||
          Object.values(Re.value).some((e) => null !== e) ||
          Object.values(Le.value).some((e) => Object.values(e).some((e) => e.length > 0)) ||
          Te.value.highRiskServices.length > 0 ||
          Te.value.recentDegradedServices.length > 0 ||
          null !== $e.value ||
          Ie.value.length > 0 ||
          Object.values(De.value).some((e) => null !== e),
        il = async (e = 'manual') => {
          const l = ++Ne,
            a = 'custom' === (i = r.timeRange) ? void 0 : `-${i}`
          var i
          ;(t.value = !al()), (o.value = !1)
          const s = (async () => {
            var i, r, s, v
            try {
              if ((Ve || (Ve = rl()), await Ve, l !== Ne)) return
              const t = ll.value,
                n = t.some((e) => 'trend' === e.kind || 'metric-summary' === e.kind),
                u = t.some((e) => 'risk-service' === e.kind),
                c = t.some((e) => 'ingest-status' === e.kind),
                d = t.some((e) => 'incident' === e.kind),
                m = await Promise.allSettled([
                  B({ page: 1, pageSize: 100, scope: qe.value }),
                  K({ timeRange: a, scope: qe.value }),
                  n ? F({ timeRange: a, groupBy: 'overall', scope: qe.value }) : Promise.resolve(null),
                  u ? G({ scope: qe.value }) : Promise.resolve(null),
                  c ? Y({ scope: qe.value }) : Promise.resolve(null),
                  d ? H({ timeRange: a, scope: qe.value }) : Promise.resolve([])
                ])
              if (l !== Ne) return
              let b = m.filter((e, l) => l < 2 || [n, u, c, d][l - 2]).some((e) => 'fulfilled' === e.status)
              const [p, _, y, w, g, h] = m,
                f = 'fulfilled' === p.status ? p.value : null,
                k = 'fulfilled' === _.status ? _.value : null,
                x = 'fulfilled' === y.status ? y.value : null,
                S = 'fulfilled' === w.status ? w.value : null,
                z = 'fulfilled' === g.status ? g.value : null,
                C = 'fulfilled' === h.status ? h.value : []
              if (
                ('fulfilled' === p.status &&
                  (je.value = ((null == f ? void 0 : f.items) || []).map((e) => {
                    var l, a, i, r, t, s
                    return {
                      id: null == (l = e.identity) ? void 0 : l.id,
                      name: null == (a = e.identity) ? void 0 : a.name,
                      owner: null == (i = e.identity) ? void 0 : i.owner,
                      region: null == (r = e.identity) ? void 0 : r.region,
                      tags: (null == (t = e.identity) ? void 0 : t.tags) || [],
                      health: null == (s = e.identity) ? void 0 : s.healthStatus,
                      qps: e.qps,
                      latency: e.p95Latency,
                      errorRate: e.errorRate,
                      instances: e.instanceCount
                    }
                  })),
                'fulfilled' === _.status)
              ) {
                const e = (null == k ? void 0 : k.totals) || {}
                Re.value = {
                  serviceCount: e.serviceCount ?? null,
                  healthyServices: e.healthyServices ?? null,
                  activeAlerts: e.activeIncidents ?? null,
                  totalRequests: e.totalRequests ?? null,
                  errorRate: e.errorRate ?? null,
                  p95Latency: e.p95Latency ?? null,
                  darwinCpu: e.darwinCpu ?? null,
                  darwinMemory: e.darwinMemory ?? null
                }
              }
              'fulfilled' === y.status &&
                x &&
                (Le.value = {
                  overall:
                    ((v = x),
                    {
                      requests: Array.isArray(null == v ? void 0 : v.requests)
                        ? v.requests
                        : Array.isArray(null == (i = null == v ? void 0 : v.series) ? void 0 : i.requests)
                          ? v.series.requests
                          : [],
                      errors: Array.isArray(null == v ? void 0 : v.errors)
                        ? v.errors
                        : Array.isArray(null == (r = null == v ? void 0 : v.series) ? void 0 : r.errors)
                          ? v.series.errors
                          : [],
                      latency: Array.isArray(null == v ? void 0 : v.latency)
                        ? v.latency
                        : Array.isArray(null == (s = null == v ? void 0 : v.series) ? void 0 : s.latency)
                          ? v.series.latency
                          : []
                    })
                }),
                'fulfilled' === w.status &&
                  S &&
                  (Te.value = {
                    highRiskServices: Array.isArray(S.highRiskServices) ? S.highRiskServices : [],
                    recentDegradedServices: Array.isArray(S.recentDegradedServices) ? S.recentDegradedServices : []
                  }),
                'fulfilled' === g.status && ($e.value = z),
                'fulfilled' === h.status && (Ie.value = Array.isArray(C) ? C : (null == C ? void 0 : C.items) || [])
              const { requests: q, cards: M } = ae({
                widgets: t,
                scope: qe.value,
                scopedServiceName: ke.value || null,
                services: je.value,
                refreshGenerationId: `${l}`,
                autoRefresh: 'interval' === e
              })
              if (l !== Ne) return
              if (((De.value = Object.fromEntries(M.map((e) => [e.cardId, null]))), M.length)) {
                const e = await Promise.allSettled(q.map((e) => J(e)))
                if (l !== Ne) return
                const a = e
                  .filter((e) => 'fulfilled' === e.status)
                  .flatMap((e) => {
                    var l
                    return (null == (l = e.value) ? void 0 : l.items) || []
                  })
                b || (b = e.some((e) => 'fulfilled' === e.status)), a.length && (De.value = { ...De.value, ...ie(a) })
              }
              if (l !== Ne) return
              if (!b) return (Oe.value += 1), Oe.value >= 3 && tl(), void (o.value = !al())
              ;(Ye = Date.now()), (I.value = Ge()), (Oe.value = 0), (o.value = !al())
            } catch {
              if (l !== Ne) return
              ;(Oe.value += 1), Oe.value >= 3 && tl(), (o.value = !al())
            } finally {
              if (l !== Ne) return
              ;(t.value = !1), (n.value = !1)
            }
          })()
          Ue = s
          try {
            await s
          } finally {
            Ue === s && (Ue = null)
          }
        },
        rl = async () => {
          try {
            const e = await W('starlight_overview_panel_state_v5', { panels: [] })
            Me.value = be(null == e ? void 0 : e.panels)
          } catch {
            Me.value = be(void 0)
          }
        },
        tl = () => {
          Ee.value && (clearInterval(Ee.value), (Ee.value = null))
        },
        sl = () => {
          if ((tl(), !ge.value)) return
          const e = (() => {
            if (Oe.value >= 3) return null
            switch (Pe.value) {
              case 'off':
              default:
                return null
              case '15s':
                return 15e3
              case '30s':
                return 3e4
              case '1m':
                return 6e4
              case '5m':
              case 'auto':
                return 3e5
            }
          })()
          e &&
            (Ee.value = setInterval(() => {
              ge.value && !Ue && ((Ke = 'interval'), r.refreshTime())
            }, e))
        },
        ol = () => {
          ;(ge.value = !ge.value), (r.isLive = ge.value), ge.value ? sl() : tl()
        },
        vl = () => {
          ;(ke.value = he.value.trim()), (n.value = !0), il()
        },
        nl = () => {
          ;(he.value = ''), (ke.value = ''), (n.value = !0), il()
        },
        ul = (e) => {
          ze.value = e
        },
        cl = (l, a) => {
          ;('Enter' !== l.key && ' ' !== l.key) || (l.preventDefault(), e.push(a))
        }
      c(() => {
        ;(() => {
          try {
            const e = localStorage.getItem(_e)
            if (e) {
              const l = JSON.parse(e)
              ye.some((e) => e.value === l.autoRefresh) && (Pe.value = l.autoRefresh)
            }
          } catch {}
        })(),
          il(),
          He && clearInterval(He),
          (He = setInterval(() => {
            I.value = Ge()
          }, 3e4)),
          sl()
      }),
        d(() => {
          He && (clearInterval(He), (He = null)), tl()
        }),
        m(() => {
          He && (clearInterval(He), (He = null)), tl()
        }),
        b(
          () => [r.startTime, r.endTime],
          () => {
            if (((we.value = r.timeRange), (ge.value = r.isLive), Be)) return void (Be = !1)
            if (Ue) return
            n.value = !0
            const e = Ke || 'time-range'
            ;(Ke = null), il(e)
          }
        )
      const dl = (e) => {
          var l
          const a = e.target instanceof Element ? e.target : null
          if (null == a ? void 0 : a.closest('button, input, textarea, select, a, [role="button"]')) return
          const i = null == (l = de.value) ? void 0 : l.closest('.mobile-layout__content')
          ;(null == i ? void 0 : i.scrollTop) || ((se = e.touches[0].clientY), (ce = !0))
        },
        ml = (e) => {
          if (!ce || ee.value) return
          const l = e.touches[0].clientY - se
          l > 0 && (Z.value = Math.min(0.5 * l, 80))
        },
        bl = async () => {
          ce &&
            ((ce = !1),
            Z.value >= 60 && ((ee.value = !0), (Z.value = 60), (n.value = !0), await il('pull'), (ee.value = !1)),
            (Z.value = 0))
        },
        pl = {
          critical: { label: '严重', tagType: 'error', color: 'var(--color-danger-6)' },
          warning: { label: '警告', tagType: 'warning', color: 'var(--color-warning-6)' },
          info: { label: '提示', tagType: 'info', color: 'var(--color-primary-6)' }
        },
        _l = { critical: 3, warning: 2, info: 1 },
        yl = (e) => {
          if (!e || 'object' != typeof e || Array.isArray(e)) return 0
          const l = e.percent
          return 'number' == typeof l ? l : 0
        },
        wl = (e) => 'query-card' === e.kind,
        gl = (e) => {
          if (!wl(e)) return null
          const l = e.config.query,
            a = ne(null == l ? void 0 : l.alert)
          return a.length
            ? i('div', { class: 'mobile-overview-v2__alert-summary' }, [
                a.map((e) => {
                  var a, r, t, s, o
                  const v = pl[e.level],
                    n = (null == (a = e.channels) ? void 0 : a.length) ? e.channels.join('、') : 'Email'
                  return i('span', { class: 'mobile-overview-v2__alert-rule', key: `${e.level}-${e.threshold}` }, [
                    i(
                      E,
                      {
                        size: 'small',
                        type:
                          'error' === (null == v ? void 0 : v.tagType)
                            ? 'danger'
                            : (null == v ? void 0 : v.tagType) || 'warning'
                      },
                      { default: () => [(null == v ? void 0 : v.label) || e.level] }
                    ),
                    i('span', null, [
                      e.operator,
                      p(' '),
                      e.threshold,
                      e.unit ||
                        (null == (t = null == (r = null == l ? void 0 : l.display) ? void 0 : r.value)
                          ? void 0
                          : t.unit) ||
                        (null == (o = null == (s = null == l ? void 0 : l.display) ? void 0 : s.yAxis)
                          ? void 0
                          : o.unit) ||
                        '',
                      p('，持续'),
                      ' ',
                      e.duration || 5,
                      p(' 分钟，通知 '),
                      n
                    ])
                  ])
                })
              ])
            : null
        },
        hl = (e) => {
          switch (e.kind) {
            case 'metric-summary':
              return kl(e)
            case 'risk-service':
              return xl()
            case 'incident':
              return Sl()
            case 'ingest-status':
              return zl()
            case 'trend':
              return Cl(e)
            case 'quick-pivot':
              return ql(e)
            case 'query-card':
            case 'darwin-infra-summary':
            case 'darwin-infra-trend':
            case 'darwin-instance-table':
              return fl(e)
            default:
              return i(O, { description: '暂不支持的卡片类型', class: 'mobile-overview-v2__empty-state' }, null)
          }
        },
        fl = (e) => {
          var l, a, r, s, o
          const v = De.value[e.id],
            n = wl(e) ? e.config.query : null,
            u = ne(null == (d = n) ? void 0 : d.alert).map((e) => {
              var l, a, i, r, t, s
              return {
                value: e.threshold,
                label: (null == (l = pl[e.level]) ? void 0 : l.label) || '阈值',
                unit:
                  e.unit ||
                  (null == (i = null == (a = null == d ? void 0 : d.display) ? void 0 : a.value) ? void 0 : i.unit) ||
                  (null == (t = null == (r = null == d ? void 0 : d.display) ? void 0 : r.yAxis) ? void 0 : t.unit) ||
                  '',
                level: e.level,
                color: null == (s = pl[e.level]) ? void 0 : s.color
              }
            }),
            c = (l) => i('div', { class: 'mobile-overview-v2__query-card-body' }, [gl(e), l])
          var d
          if (!v) return c(i(O, { description: '暂无查询结果', class: 'mobile-overview-v2__empty-state' }, null))
          if ('number' === v.kind) {
            const a = ((e, l) => {
                if ('number' != typeof l || !Number.isFinite(l)) return null
                const a = ne(null == e ? void 0 : e.alert).filter(
                  (e) =>
                    !!Number.isFinite(e.threshold) &&
                    ('>' === e.operator
                      ? l > e.threshold
                      : '>=' === e.operator
                        ? l >= e.threshold
                        : '<' === e.operator
                          ? l < e.threshold
                          : '<=' === e.operator
                            ? l <= e.threshold
                            : l === e.threshold)
                )
                return a.length ? a.sort((e, l) => _l[l.level] - _l[e.level])[0].level : null
              })(n, v.value),
              r = (null == (l = e.editor) ? void 0 : l.visualization) || 'number',
              s = 'number' == typeof v.value ? re(v.value, v.unit || '') : null
            return c(
              'donut' === r
                ? i(
                    le,
                    {
                      value: 'number' == typeof v.value ? v.value : 0,
                      min: 0,
                      max: 100,
                      unit: v.unit || '%',
                      color: 'var(--color-primary-6)',
                      height: '180px',
                      loading: t.value
                    },
                    null
                  )
                : i('div', { class: 'mobile-overview-v2__number-card' }, [
                    i(
                      'div',
                      { class: ['mobile-overview-v2__number-glow', a ? `mobile-overview-v2__number-glow--${a}` : ''] },
                      null
                    ),
                    i('div', { class: 'mobile-overview-v2__number-header' }, [
                      i('span', { class: 'mobile-overview-v2__number-title' }, [e.title])
                    ]),
                    i('div', { class: 'mobile-overview-v2__number-body' }, [
                      i(
                        'div',
                        {
                          class: [
                            'mobile-overview-v2__number-accent',
                            a ? `mobile-overview-v2__number-accent--${a}` : ''
                          ]
                        },
                        null
                      ),
                      i('div', { class: 'mobile-overview-v2__number-content' }, [
                        i(
                          'strong',
                          {
                            class: [
                              'mobile-overview-v2__number-value',
                              a ? `mobile-overview-v2__number-value--${a}` : ''
                            ]
                          },
                          [
                            (null == s ? void 0 : s.value) ??
                              ('number' == typeof v.value ? re(v.value, '').value : '--')
                          ]
                        ),
                        (null == s ? void 0 : s.unit) || v.unit
                          ? i('span', { class: 'mobile-overview-v2__number-unit' }, [
                              (null == s ? void 0 : s.unit) || v.unit
                            ])
                          : null
                      ]),
                      v.compare
                        ? i(
                            'div',
                            {
                              class: [
                                'mobile-overview-v2__number-trend',
                                `mobile-overview-v2__number-trend--${v.compare.direction}`
                              ]
                            },
                            [
                              i(
                                'svg',
                                {
                                  class: 'mobile-overview-v2__number-trend-icon',
                                  viewBox: '0 0 12 12',
                                  'aria-hidden': 'true'
                                },
                                [
                                  i(
                                    'path',
                                    { d: 'up' === v.compare.direction ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4' },
                                    null
                                  )
                                ]
                              ),
                              i('span', null, [Math.abs(yl(v.compare)).toFixed(1), p('%')])
                            ]
                          )
                        : null
                    ]),
                    i('div', { class: 'mobile-overview-v2__number-meta' }, [
                      i('span', null, [fe[e.kind] || '自定义组件'])
                    ])
                  ])
            )
          }
          if ('timeseries' === v.kind) {
            const l = (null == (a = e.editor) ? void 0 : a.visualization) || 'line'
            return c(
              'bar' === l
                ? i(
                    ve,
                    {
                      data: ((null == (s = null == (r = v.series) ? void 0 : r[0]) ? void 0 : s.points) || []).map(
                        (e) => ({
                          name: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          value: e.value
                        })
                      ),
                      height: '200px',
                      variant: 'monitor',
                      loading: t.value
                    },
                    null
                  )
                : i(
                    oe,
                    {
                      series: (v.series || []).map((e) => ({ name: e.name, data: e.points })),
                      height: '200px',
                      variant: 'monitor',
                      showLegend: !0,
                      area: 'line' === l,
                      thresholdLines: u,
                      loading: t.value
                    },
                    null
                  )
            )
          }
          return 'distribution' === v.kind
            ? c(
                'donut' === (null == (o = e.editor) ? void 0 : o.visualization)
                  ? i(te, { data: v.items || [], height: '200px', variant: 'monitor' }, null)
                  : i(ve, { data: v.items || [], height: '200px', variant: 'monitor', loading: t.value }, null)
              )
            : 'table' === v.kind
              ? c(
                  i('div', { class: 'mobile-overview-v2__table-wrap' }, [
                    i('table', { class: 'mobile-overview-v2__table' }, [
                      i('thead', null, [
                        i('tr', null, [(v.columns || []).map((e) => i('th', { key: e.key }, [e.label]))])
                      ]),
                      i('tbody', null, [
                        (v.rows || []).map((e, l) =>
                          i('tr', { key: l }, [
                            (v.columns || []).map((l) => i('td', { key: l.key }, [e[l.key] ?? '--']))
                          ])
                        )
                      ])
                    ])
                  ])
                )
              : c(i(O, { description: '暂不支持的数据类型', class: 'mobile-overview-v2__empty-state' }, null))
        },
        kl = (e) => {
          const l = e.config.metricKey,
            a = {
              'service-count': f,
              'healthy-services': M,
              'active-alerts': k,
              'total-requests': x,
              'error-rate': S,
              'p95-latency': z,
              'ingest-success-rate': q
            },
            r = {
              'service-count': 'var(--color-primary-6)',
              'healthy-services': 'var(--color-success-6)',
              'active-alerts': 'var(--color-warning-6)',
              'total-requests': 'var(--color-primary-6)',
              'error-rate': 'var(--color-danger-6)',
              'p95-latency': 'var(--color-warning-6)',
              'ingest-success-rate': 'var(--color-success-6)'
            },
            t = Re.value[l] ?? null
          return i(
            'div',
            { class: 'mobile-overview-v2__metric-item', style: { '--metric-accent': r[l] || 'var(--color-text-3)' } },
            [
              i('div', { class: 'mobile-overview-v2__metric-label' }, [
                _(a[l] || x, { color: r[l] || 'var(--color-text-3)', size: 14 }),
                i('span', null, [
                  {
                    'service-count': '服务总数',
                    'healthy-services': '健康服务',
                    'active-alerts': '活跃告警',
                    'total-requests': '请求总量',
                    'error-rate': '全局错误率',
                    'p95-latency': 'P95 延迟',
                    'ingest-success-rate': '采集成功率'
                  }[l] || e.title
                ])
              ]),
              i('div', { class: 'mobile-overview-v2__metric-value' }, [
                Fe(t, { 'error-rate': '%', 'p95-latency': 'ms', 'ingest-success-rate': '%' }[l] || '')
              ])
            ]
          )
        },
        xl = (l) => {
          const a = Te.value.highRiskServices.length
            ? Te.value.highRiskServices.slice(0, 5)
            : Te.value.recentDegradedServices.slice(0, 5)
          return a.length
            ? i('div', { class: 'mobile-overview-v2__stack-list' }, [
                a.map((l, a) =>
                  i(
                    'div',
                    {
                      class: [
                        'mobile-overview-v2__risk-card',
                        'critical' === l.healthStatus
                          ? 'mobile-overview-v2__risk-card--critical'
                          : 'warning' === l.healthStatus
                            ? 'mobile-overview-v2__risk-card--warning'
                            : ''
                      ],
                      key: a,
                      onClick: () => e.push(`/mobile/service-detail-v2/${l.serviceId || l.id}`),
                      onKeydown: (e) => cl(e, `/mobile/service-detail-v2/${l.serviceId || l.id}`),
                      role: 'button',
                      tabindex: '0',
                      'aria-label': `查看风险服务 ${l.service || l.name || '未知服务'}`
                    },
                    [
                      i('div', null, [
                        i('div', { class: 'mobile-overview-v2__risk-title' }, [l.service || l.name]),
                        i('div', { class: 'mobile-overview-v2__risk-meta' }, [
                          p('Health '),
                          l.healthStatus || 'unknown',
                          p(' · 错误率 '),
                          Fe(l.errorRate, '%'),
                          p(' · 延迟'),
                          ' ',
                          Fe(l.latencyDelta, 'ms')
                        ]),
                        i('div', { class: 'mobile-overview-v2__risk-submeta' }, [
                          p('活跃事件 '),
                          Fe(l.activeIncidentCount)
                        ])
                      ]),
                      i(
                        ue,
                        {
                          status:
                            'healthy' === l.healthStatus
                              ? 'healthy'
                              : 'warning' === l.healthStatus
                                ? 'degraded'
                                : 'critical',
                          size: 'sm'
                        },
                        null
                      )
                    ]
                  )
                )
              ])
            : i(O, { description: '暂无风险服务', class: 'mobile-overview-v2__empty-state' }, null)
        },
        Sl = (l) => {
          const a = Ie.value.slice(0, 5)
          return a.length
            ? i('div', { class: 'mobile-overview-v2__stack-list' }, [
                a.map((l, a) =>
                  i(
                    'div',
                    {
                      class: [
                        'mobile-overview-v2__incident-card',
                        'critical' === l.level || 'critical' === l.severity
                          ? 'mobile-overview-v2__incident-card--critical'
                          : 'mobile-overview-v2__incident-card--warning'
                      ],
                      key: l.id || a,
                      onClick: () => e.push({ path: '/mobile/alerts-inbox', query: { incidentId: String(l.id) } }),
                      onKeydown: (e) => cl(e, `/mobile/alerts-inbox?incidentId=${encodeURIComponent(String(l.id))}`),
                      role: 'button',
                      tabindex: '0',
                      'aria-label': `查看事件 ${l.service || l.title || '未知服务'}`
                    },
                    [
                      i('div', { class: 'mobile-overview-v2__incident-header' }, [
                        i('div', null, [
                          i('div', { class: 'mobile-overview-v2__risk-title' }, [l.service || l.title]),
                          i('div', { class: 'mobile-overview-v2__risk-meta' }, [l.message || l.summary || '暂无摘要'])
                        ]),
                        i(
                          ue,
                          {
                            status: 'critical' === l.level || 'critical' === l.severity ? 'critical' : 'degraded',
                            size: 'sm'
                          },
                          null
                        )
                      ])
                    ]
                  )
                )
              ])
            : i(O, { description: '暂无活跃事件', class: 'mobile-overview-v2__empty-state' }, null)
        },
        zl = (e) =>
          $e.value
            ? i('div', { class: 'mobile-overview-v2__ingest-grid' }, [
                [
                  { key: 'metrics', label: 'Metrics', icon: x },
                  { key: 'logs', label: 'Logs', icon: h },
                  { key: 'traces', label: 'Traces', icon: g }
                ].map((e) => {
                  var l, a, r
                  const t =
                      (null == (l = $e.value) ? void 0 : l[e.key]) ||
                      (null == (r = null == (a = $e.value) ? void 0 : a[e.key]) ? void 0 : r.status),
                    s = ((e) =>
                      'healthy' === e
                        ? 'var(--color-success-6)'
                        : 'warning' === e
                          ? 'var(--color-warning-6)'
                          : 'var(--color-text-3)')(String(t || ''))
                  return i('div', { class: 'mobile-overview-v2__ingest-card', key: e.key }, [
                    i('div', { class: 'mobile-overview-v2__ingest-icon' }, [_(e.icon, { color: s, size: 18 })]),
                    i('div', { class: 'mobile-overview-v2__ingest-value', style: { color: s } }, [t || '--']),
                    i('div', { class: 'mobile-overview-v2__ingest-label' }, [e.label])
                  ])
                })
              ])
            : i(O, { description: '暂无采集状态', class: 'mobile-overview-v2__empty-state' }, null),
        Cl = (e) => {
          const l = e.config,
            a = l.metric,
            r = l.groupBy || 'overall',
            s = ((v = a), Le.value.overall[v] || []).map((e) => ({ timestamp: e.timestamp, value: e.value })),
            o =
              'errors' === a
                ? 'var(--color-danger-6)'
                : 'latency' === a
                  ? 'var(--color-warning-6)'
                  : 'var(--color-primary-6)'
          var v
          return s.length
            ? i('div', null, [
                i('div', { class: 'mobile-overview-v2__trend-tags' }, [
                  i(E, { size: 'small' }, pe(r) ? r : { default: () => [r] })
                ]),
                i(
                  oe,
                  {
                    title: e.title,
                    data: s,
                    color: o,
                    height: '200px',
                    variant: 'monitor',
                    area: 'requests' === a,
                    loading: t.value
                  },
                  null
                )
              ])
            : i(O, { description: '暂无趋势数据', class: 'mobile-overview-v2__empty-state' }, null)
        },
        ql = (l) => {
          const a = l.config.links || [
              { key: 'services' },
              { key: 'alerts' },
              { key: 'traces' },
              { key: 'logs' },
              { key: 'topology' }
            ],
            r = {
              services: '/mobile/services-v2',
              alerts: '/mobile/alerts-inbox',
              traces: '/mobile/trace-explorer',
              logs: '/mobile/log-center',
              topology: '/mobile/topology',
              'admin-ingestion': '/mobile/instance-monitor'
            },
            t = {
              services: '服务目录',
              alerts: '告警',
              traces: '链路',
              logs: '日志',
              topology: '拓扑',
              'admin-ingestion': '接入'
            },
            s = { services: w, alerts: v, traces: g, logs: h, topology: g, 'admin-ingestion': f }
          return i('div', { class: 'mobile-overview-v2__pivot-grid' }, [
            a
              .filter((e) => !1 !== e.visible)
              .map((l) =>
                i(
                  D,
                  {
                    key: l.key,
                    block: !0,
                    size: 'small',
                    onClick: () => {
                      const a = r[l.key]
                      a && e.push(a)
                    }
                  },
                  {
                    default: () => [
                      _(s[l.key] || w, { size: 16 }),
                      i('span', { class: 'mobile-overview-v2__pivot-label' }, [t[l.key] || l.key])
                    ]
                  }
                )
              )
          ])
        }
      return () => {
        var l
        let a, u
        return i('div', { class: 'mobile-overview-v2' }, [
          i(me, null, null),
          i('div', { class: 'mobile-overview-v2__header' }, [
            i('h2', { class: 'mobile-overview-v2__title' }, [p('看板')]),
            i('div', { class: 'mobile-overview-v2__header-right' }, [
              i('span', { class: 'mobile-overview-v2__time' }, [I.value]),
              i(
                D,
                {
                  size: 'small',
                  type: 'primary',
                  'aria-label': '刷新看板',
                  loading: n.value,
                  onClick: () => {
                    ;(n.value = !0), il('manual')
                  }
                },
                pe((a = _(A, { size: 16 }))) ? a : { default: () => [a] }
              )
            ])
          ]),
          i(
            'section',
            { ref: de, class: 'mobile-overview-v2__refresh-region', onTouchstart: dl, onTouchmove: ml, onTouchend: bl },
            [
              i(
                'div',
                {
                  class: 'mobile-overview-v2__pull-indicator',
                  style: { height: `${Z.value}px`, opacity: Z.value / 60 }
                },
                [
                  i(N, { loading: ee.value || Z.value > 10 }, null),
                  i('span', { class: 'mobile-overview-v2__pull-text' }, [
                    ee.value ? '刷新中…' : Z.value >= 60 ? '松开刷新' : '下拉刷新'
                  ])
                ]
              ),
              t.value && !n.value
                ? i('div', { class: 'mobile-overview-v2__loading' }, [i(N, { loading: t.value }, null)])
                : o.value
                  ? i(
                      O,
                      { description: '数据加载失败，请检查网络连接后重试', class: 'mobile-overview-v2__error' },
                      {
                        default: () =>
                          i(
                            D,
                            {
                              type: 'primary',
                              size: 'small',
                              onClick: () => {
                                ;(n.value = !0), il()
                              }
                            },
                            { default: () => [p('重新加载')] }
                          )
                      }
                    )
                  : i(y, null, [
                      i(
                        'div',
                        {
                          class: 'mobile-overview-v2__status-summary',
                          'aria-label': '值班状态摘要',
                          'aria-live': 'polite'
                        },
                        [
                          i('div', { class: 'mobile-overview-v2__status-summary-heading' }, [
                            i('div', null, [
                              i('span', { class: 'mobile-overview-v2__eyebrow' }, [p('ON-CALL STATUS')]),
                              i('strong', null, [p('值班状态')])
                            ]),
                            i(
                              E,
                              {
                                size: 'small',
                                type:
                                  'number' != typeof Re.value.activeAlerts
                                    ? 'default'
                                    : Re.value.activeAlerts > 0
                                      ? 'warning'
                                      : 'success'
                              },
                              {
                                default: () => [
                                  'number' != typeof Re.value.activeAlerts
                                    ? '状态待确认'
                                    : Re.value.activeAlerts > 0
                                      ? '需要处置'
                                      : '运行良好'
                                ]
                              }
                            )
                          ]),
                          i('div', { class: 'mobile-overview-v2__status-summary-grid' }, [
                            i('div', null, [
                              i('span', null, [p('服务健康度')]),
                              i('strong', null, [Fe(Re.value.healthyServices), p(' / '), Fe(Re.value.serviceCount)])
                            ]),
                            i('div', null, [
                              i('span', null, [p('活跃告警')]),
                              i('strong', null, [Fe(Re.value.activeAlerts)])
                            ]),
                            i('div', null, [
                              i('span', null, [p('错误率')]),
                              i('strong', null, [Fe(Re.value.errorRate, '%')])
                            ]),
                            i('div', null, [
                              i('span', null, [p('P95 延迟')]),
                              i('strong', null, [Fe(Re.value.p95Latency, 'ms')])
                            ])
                          ])
                        ]
                      ),
                      i('div', { class: 'mobile-overview-v2__control-panel' }, [
                        i(
                          'button',
                          {
                            type: 'button',
                            class: ['mobile-overview-v2__control-toggle', Ce.value && 'is-active'],
                            'aria-expanded': Ce.value,
                            'aria-controls': 'overview-filter-controls',
                            onClick: () => (Ce.value = !Ce.value)
                          },
                          [
                            _(j, { size: 16 }),
                            i('span', null, [p('筛选控制')]),
                            i('span', { class: ['mobile-overview-v2__control-arrow', Ce.value && 'is-open'] }, [p('▾')])
                          ]
                        ),
                        Ce.value &&
                          i('div', { id: 'overview-filter-controls', class: 'mobile-overview-v2__control-body' }, [
                            i('div', { class: 'mobile-overview-v2__control-section' }, [
                              i('div', { class: 'mobile-overview-v2__control-label' }, [p('时间范围')]),
                              i('div', { class: 'mobile-overview-v2__time-range-row' }, [
                                ['15m', '1h', '4h', '1d', '2d', '7d'].map((e) =>
                                  i(
                                    D,
                                    {
                                      key: e,
                                      size: 'small',
                                      type: we.value === e ? 'primary' : 'ghost',
                                      onClick: () =>
                                        ((e) => {
                                          const l = ge.value
                                          ;(we.value = e),
                                            (Be = !0),
                                            (Ke = null),
                                            r.setTimeRange(e),
                                            (r.isLive = l),
                                            (ge.value = l),
                                            (n.value = !0),
                                            il('time-range'),
                                            l ? sl() : tl()
                                        })(e)
                                    },
                                    { default: () => [Se[e]] }
                                  )
                                ),
                                i(
                                  D,
                                  { size: 'small', type: ge.value ? 'primary' : 'default', onClick: ol },
                                  {
                                    default: () => [
                                      ge.value ? _(R, { size: 14 }) : _(L, { size: 14 }),
                                      i('span', { class: 'mobile-overview-v2__control-button-label' }, [p('Live')])
                                    ]
                                  }
                                )
                              ])
                            ]),
                            i('div', { class: 'mobile-overview-v2__control-section' }, [
                              i('div', { class: 'mobile-overview-v2__control-label' }, [p('自动刷新')]),
                              i('div', { class: 'mobile-overview-v2__time-range-row' }, [
                                ye.map((e) =>
                                  i(
                                    D,
                                    {
                                      key: e.value,
                                      size: 'small',
                                      type: Pe.value === e.value ? 'primary' : 'ghost',
                                      onClick: () =>
                                        ((e) => {
                                          ;(Pe.value = e),
                                            (Oe.value = 0),
                                            (() => {
                                              try {
                                                localStorage.setItem(_e, JSON.stringify({ autoRefresh: Pe.value }))
                                              } catch {}
                                            })(),
                                            'off' !== e && ge.value && il('manual'),
                                            sl()
                                        })(e.value)
                                    },
                                    { default: () => [e.label] }
                                  )
                                )
                              ]),
                              Oe.value >= 3 &&
                                i('div', { class: 'mobile-overview-v2__auto-refresh-warning' }, [
                                  p('连续刷新失败，已暂停自动刷新')
                                ])
                            ]),
                            i('div', { class: 'mobile-overview-v2__control-section' }, [
                              i('div', { class: 'mobile-overview-v2__control-label' }, [p('服务筛选')]),
                              i('div', { class: 'mobile-overview-v2__service-search-row' }, [
                                i(
                                  U,
                                  {
                                    modelValue: he.value,
                                    placeholder: '输入服务名称搜索…',
                                    clearable: !0,
                                    'onUpdate:modelValue': (e) => (he.value = e),
                                    onEnter: vl,
                                    leftIcon: () => _(s, { size: 14 })
                                  },
                                  null
                                ),
                                i(D, { size: 'small', type: 'primary', onClick: vl }, { default: () => [p('搜索')] })
                              ]),
                              ke.value &&
                                i('div', { class: 'mobile-overview-v2__service-indicator' }, [
                                  i('span', null, [p('当前服务: '), i('strong', null, [ke.value])]),
                                  i(
                                    D,
                                    { size: 'small', type: 'ghost', onClick: nl },
                                    {
                                      default: () => [
                                        _(T, { size: 12 }),
                                        i('span', { class: 'mobile-overview-v2__clear-filter-label' }, [p('清除')])
                                      ]
                                    }
                                  )
                                ])
                            ]),
                            el.value.length > 0 &&
                              i('div', { class: 'mobile-overview-v2__control-section' }, [
                                i('div', { class: 'mobile-overview-v2__control-label' }, [
                                  p('卡片分类'),
                                  i(
                                    E,
                                    { size: 'small', type: 'info', class: 'mobile-overview-v2__filter-count' },
                                    { default: () => [ll.value.length] }
                                  )
                                ]),
                                i('div', { class: 'mobile-overview-v2__tag-chip-scroll' }, [
                                  i(
                                    D,
                                    { size: 'small', type: ze.value ? 'ghost' : 'primary', onClick: () => ul('') },
                                    { default: () => [p('全部')] }
                                  ),
                                  el.value.map(({ tag: e, count: l }) =>
                                    i(
                                      D,
                                      {
                                        key: e,
                                        size: 'small',
                                        type: ze.value === e ? 'primary' : 'ghost',
                                        onClick: () => ul(e)
                                      },
                                      { default: () => [e, p(' ('), l, p(')')] }
                                    )
                                  )
                                ])
                              ])
                          ])
                      ]),
                      Qe.value.length > 0 &&
                        i('div', { class: 'mobile-overview-v2__section mobile-overview-v2__section--priority' }, [
                          i('div', { class: 'mobile-overview-v2__section-heading' }, [
                            i('div', null, [
                              i('span', { class: 'mobile-overview-v2__eyebrow' }, [p('ACTION QUEUE')]),
                              i('div', { class: 'mobile-overview-v2__section-title' }, [p('优先处置')])
                            ]),
                            i('span', { class: 'mobile-overview-v2__section-hint' }, [p('点按查看详情')])
                          ]),
                          i(
                            'div',
                            { class: 'mobile-overview-v2__widget-list mobile-overview-v2__widget-list--priority' },
                            [
                              Qe.value.map((e) =>
                                i('div', { class: 'mobile-overview-v2__widget-card', key: e.id }, [
                                  i('div', { class: 'mobile-overview-v2__widget-card-header' }, [
                                    i('span', { class: 'mobile-overview-v2__widget-card-title' }, [e.title]),
                                    i(E, { size: 'small', type: 'warning' }, { default: () => [fe[e.kind] || '状态'] })
                                  ]),
                                  i('div', { class: 'mobile-overview-v2__widget-card-body' }, [hl(e)])
                                ])
                              )
                            ]
                          )
                        ]),
                      i(
                        'section',
                        {
                          class: 'mobile-overview-v2__section mobile-overview-v2__section--pivots',
                          'aria-label': '快速调查入口'
                        },
                        [
                          i('div', { class: 'mobile-overview-v2__section-heading' }, [
                            i('div', null, [
                              i('span', { class: 'mobile-overview-v2__eyebrow' }, [p('INVESTIGATE')]),
                              i('div', { class: 'mobile-overview-v2__section-title' }, [p('快速调查')])
                            ]),
                            i('span', { class: 'mobile-overview-v2__section-hint' }, [p('已有工作区')])
                          ]),
                          i('div', { class: 'mobile-overview-v2__pivot-grid' }, [
                            [
                              { key: 'services', icon: w, label: '服务目录', path: '/mobile/services-v2' },
                              { key: 'alerts', icon: v, label: '告警', path: '/mobile/alerts-inbox' },
                              { key: 'traces', icon: g, label: '链路', path: '/mobile/trace-explorer' },
                              { key: 'logs', icon: h, label: '日志', path: '/mobile/log-center' },
                              { key: 'topology', icon: g, label: '拓扑', path: '/mobile/topology' }
                            ].map((l) =>
                              i(
                                D,
                                {
                                  key: l.key,
                                  class: 'mobile-overview-v2__pivot-btn',
                                  size: 'large',
                                  onClick: () => e.push(l.path)
                                },
                                {
                                  default: () => [
                                    _(l.icon, { size: 20 }),
                                    i('span', { class: 'mobile-overview-v2__pivot-label' }, [l.label])
                                  ]
                                }
                              )
                            )
                          ])
                        ]
                      ),
                      i(
                        P,
                        {
                          bordered: !1,
                          size: 'small',
                          class: 'mobile-overview-v2__summary-card',
                          'aria-label': '关键指标摘要'
                        },
                        {
                          default: () => [
                            i(
                              V,
                              { cols: 2 },
                              pe(
                                (u = [
                                  {
                                    key: 'serviceCount',
                                    icon: f,
                                    label: '服务总数',
                                    extra: `健康 ${Fe(Re.value.healthyServices)}`,
                                    color: 'var(--color-primary-6)'
                                  },
                                  {
                                    key: 'activeAlerts',
                                    icon: k,
                                    label: '活跃告警',
                                    extra: null,
                                    color: 'var(--color-warning-6)'
                                  },
                                  {
                                    key: 'totalRequests',
                                    icon: x,
                                    label: '请求总量',
                                    extra: null,
                                    color: 'var(--color-primary-6)'
                                  },
                                  {
                                    key: 'errorRate',
                                    icon: S,
                                    label: '全局错误率',
                                    extra: null,
                                    unit: '%',
                                    color: 'var(--color-danger-6)'
                                  },
                                  {
                                    key: 'p95Latency',
                                    icon: z,
                                    label: 'P95 延迟',
                                    extra: null,
                                    unit: 'ms',
                                    color: 'var(--color-warning-6)'
                                  },
                                  {
                                    key: 'darwinCpu',
                                    icon: C,
                                    label: '系统负载',
                                    extra: null,
                                    unit: '%',
                                    color: 'var(--color-primary-6)'
                                  }
                                ].map((e) =>
                                  i('div', { key: e.key }, [
                                    i('div', { class: 'mobile-overview-v2__metric-card' }, [
                                      i('div', { class: 'mobile-overview-v2__metric-label' }, [
                                        _(e.icon, { color: e.color, size: 14 }),
                                        i('span', null, [e.label])
                                      ]),
                                      i('div', { class: 'mobile-overview-v2__metric-value' }, [
                                        Fe(Re.value[e.key], e.unit || '')
                                      ]),
                                      e.extra && i('div', { class: 'mobile-overview-v2__metric-subtitle' }, [e.extra])
                                    ])
                                  ])
                                ))
                              )
                                ? u
                                : { default: () => [u] }
                            )
                          ]
                        }
                      ),
                      (null !== Re.value.darwinCpu || null !== Re.value.darwinMemory) &&
                        i('div', { class: 'mobile-overview-v2__section' }, [
                          i('div', { class: 'mobile-overview-v2__section-title' }, [p('Darwin 资源')]),
                          i('div', { class: 'mobile-overview-v2__darwin-grid' }, [
                            null !== Re.value.darwinCpu &&
                              i('div', { class: 'mobile-overview-v2__darwin-card' }, [
                                i('div', { class: 'mobile-overview-v2__darwin-label' }, [
                                  _(C, { color: 'var(--color-primary-6)', size: 14 }),
                                  i('span', null, [p('CPU')])
                                ]),
                                i(
                                  le,
                                  {
                                    value: Re.value.darwinCpu,
                                    min: 0,
                                    max: 100,
                                    unit: '%',
                                    color: 'var(--color-primary-6)',
                                    height: '160px',
                                    loading: t.value
                                  },
                                  null
                                )
                              ]),
                            null !== Re.value.darwinMemory &&
                              i('div', { class: 'mobile-overview-v2__darwin-card' }, [
                                i('div', { class: 'mobile-overview-v2__darwin-label' }, [
                                  _($, { color: 'var(--color-warning-6)', size: 14 }),
                                  i('span', null, [p('内存')])
                                ]),
                                i(
                                  le,
                                  {
                                    value: Re.value.darwinMemory,
                                    min: 0,
                                    max: 100,
                                    unit: '%',
                                    color: 'var(--color-warning-6)',
                                    height: '160px',
                                    loading: t.value
                                  },
                                  null
                                )
                              ])
                          ])
                        ]),
                      ll.value.length > 0
                        ? i(y, null, [
                            i('div', { class: 'mobile-overview-v2__section' }, [
                              i('div', { class: 'mobile-overview-v2__section-title' }, [
                                (null == (l = Je.value) ? void 0 : l.name) || 'Widgets',
                                i(
                                  E,
                                  { size: 'small', type: 'info', class: 'mobile-overview-v2__filter-count' },
                                  { default: () => [ll.value.length, p(' 个')] }
                                )
                              ])
                            ]),
                            i('div', { class: 'mobile-overview-v2__widget-list' }, [
                              Xe.value.map((e) =>
                                i('div', { class: 'mobile-overview-v2__widget-card', key: e.id }, [
                                  i('div', { class: 'mobile-overview-v2__widget-card-header' }, [
                                    i('span', { class: 'mobile-overview-v2__widget-card-title' }, [e.title]),
                                    i(
                                      E,
                                      { size: 'small', type: 'default' },
                                      { default: () => [fe[e.kind] || '自定义组件'] }
                                    )
                                  ]),
                                  i('div', { class: 'mobile-overview-v2__widget-card-body' }, [hl(e)])
                                ])
                              )
                            ])
                          ])
                        : i('div', { class: 'mobile-overview-v2__section' }, [
                            i(
                              O,
                              {
                                description: '当前面板暂无卡片，请在桌面端添加卡片后查看。',
                                class: 'mobile-overview-v2__empty-state'
                              },
                              null
                            )
                          ])
                    ])
            ]
          )
        ])
      }
    }
  })
export { ze as default }
