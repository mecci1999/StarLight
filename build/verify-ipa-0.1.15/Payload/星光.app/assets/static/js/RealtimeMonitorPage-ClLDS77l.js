import {
  p as e,
  a0 as a,
  a1 as l,
  a2 as t,
  a3 as r,
  ba as i,
  Z as n,
  w as o,
  ag as s,
  ar as u,
  av as m,
  a6 as v,
  ch as c,
  ac as p,
  aS as d,
  cM as g,
  cN as y,
  am as f,
  cc as h,
  cL as _,
  cO as b,
  ci as x
} from './invariable-DewVS0br.js'
import S from './index-BRz3eDUI.js'
import { P as R } from './PageHeader-OtleDOO-.js'
import { T } from './TimeRangeBar-EdVcwx6f.js'
import { S as q } from './ScopeBar-cbY9MT5P.js'
import { u as j } from './useTimeStore-CVw7RN2Q.js'
import { L as w } from './LineChart-gPgXHJ75.js'
import { d as C } from './index-DFkcx8xz.js'
import './metrics-uVJcD6zf.js'
import './request-BiInMBwl.js'
import './logs-CT6hSV3d.js'
import './alerts-CIHfuoAx.js'
import './subscription-C610hAN0.js'
import './auth-CpdnJA9r.js'
import './user-CjErkjef.js'
import './microApps-BJHOuFrl.js'
import './BaseChart-FGf3lmW3.js'
const k = e({
  name: 'RealtimeMonitorPage',
  setup() {
    const e = i(),
      k = j(),
      I = a(C()),
      A = a(null),
      L = a(null),
      P = a(!1),
      G = a(''),
      z = a([]),
      U = a({ cpu: null, memory: null, qps: null, responseTime: null, errorRate: null, activeConnections: null }),
      W = a(null),
      $ = a([]),
      K = a(!1),
      M = (e) => (Array.isArray(e) && e.length > 0 && e[0].data) || [],
      Q = l(() => z.value.map((e) => ({ label: e.name || e.keyName || e.appKey, value: e.appKey }))),
      B = async () => {
        try {
          const e = await S.metrics.fetchCatalogServices({ page: 1, pageSize: 200, scope: I.value }),
            a = (null == e ? void 0 : e.items) || []
          ;(z.value = a.map((e) => {
            var a, l, t
            return {
              appKey: null == (a = e.identity) ? void 0 : a.id,
              name: null == (l = e.identity) ? void 0 : l.name,
              keyName: null == (t = e.identity) ? void 0 : t.name
            }
          })),
            z.value.length > 0 && !A.value ? ((A.value = z.value[0].appKey), N()) : A.value && N(),
            (K.value = !1)
        } catch (e) {
          ;(z.value = []), (K.value = !0)
        }
      },
      N = async () => {
        var e, a, l, t, r, i, n
        if (A.value) {
          ;(P.value = !0), (G.value = '')
          try {
            const [o, s, u, m] = await Promise.all([
                S.metrics.fetchServiceDetailSummary(A.value, { scope: I.value }),
                S.metrics.fetchServiceRuntime(A.value, { scope: I.value }),
                S.metrics.fetchOverviewIncidents({ timeRange: `-${k.timeRange}`, scope: I.value }),
                S.metrics.fetchMetricsExplorer({ serviceId: A.value, scope: I.value })
              ]),
              v = (null == o ? void 0 : o.summary) || {}
            ;(U.value = {
              cpu: v.cpu ?? null,
              memory: v.memory ?? null,
              qps: v.qps ?? null,
              responseTime: v.responseTime ?? null,
              errorRate: v.errorRate ?? null,
              activeConnections: v.activeConnections ?? null
            }),
              (W.value = {
                cpu: M(null == (e = null == m ? void 0 : m.series) ? void 0 : e.cpu),
                memory: M(null == (a = null == m ? void 0 : m.series) ? void 0 : a.memory),
                responseTime: M(null == (l = null == m ? void 0 : m.series) ? void 0 : l.responseTime)
              })
            const c = Array.isArray(u),
              p = c ? u.filter((e) => !e.serviceId || e.serviceId === A.value) : []
            $.value = [
              {
                name: '实例运行',
                status:
                  Array.isArray(null == s ? void 0 : s.instances) && s.instances.length > 0 ? 'healthy' : 'unknown',
                value: Array.isArray(null == s ? void 0 : s.instances) ? s.instances.length : null,
                unit: 'instances'
              },
              {
                name: 'Metrics 采集',
                status:
                  !0 === (null == (t = null == s ? void 0 : s.ingestStatus) ? void 0 : t.metrics)
                    ? 'healthy'
                    : 'unknown',
                value: !0 === (null == (r = null == s ? void 0 : s.ingestStatus) ? void 0 : r.metrics) ? 1 : null,
                unit: 'ok'
              },
              {
                name: 'Logs 采集',
                status:
                  !0 === (null == (i = null == s ? void 0 : s.ingestStatus) ? void 0 : i.logs) ? 'healthy' : 'unknown',
                value: !0 === (null == (n = null == s ? void 0 : s.ingestStatus) ? void 0 : n.logs) ? 1 : null,
                unit: 'ok'
              },
              {
                name: '活跃事件',
                status: c ? (p.length > 0 ? 'critical' : 'healthy') : 'unknown',
                value: c ? p.length : null,
                unit: 'count'
              }
            ]
          } catch (o) {
            ;(W.value = null),
              ($.value = []),
              (U.value = {
                cpu: null,
                memory: null,
                qps: null,
                responseTime: null,
                errorRate: null,
                activeConnections: null
              }),
              (G.value = '实时监控数据加载失败，请检查服务状态或稍后重试。')
          } finally {
            P.value = !1
          }
        }
      }
    t(
      () => [k.startTime, k.endTime],
      () => {
        N()
      }
    ),
      t(
        () => k.isLive,
        (e) => {
          e ? (N(), (L.value = setInterval(N, 5e3))) : L.value && (clearInterval(L.value), (L.value = null))
        }
      ),
      t(
        () => I.value,
        () => {
          ;(A.value = null), B()
        }
      ),
      r(() => {
        e.query.timeRange && 'string' == typeof e.query.timeRange && k.setTimeRange(e.query.timeRange),
          e.query.serviceId && 'string' == typeof e.query.serviceId && (A.value = e.query.serviceId),
          B(),
          k.isLive && (L.value = setInterval(N, 5e3))
      }),
      n(() => {
        L.value && clearInterval(L.value)
      })
    const O = (e, a = '', l) =>
        'number' != typeof e ? '未知' : 'number' == typeof l ? `${e.toFixed(l)}${a}` : `${e}${a}`,
      D = l(() => ({ service: A.value, env: null, region: null })),
      E = (e) => {
        ;(A.value = e.service || null), N()
      },
      F = (e) => {
        k.setTimeRange(e)
      },
      H = (e) => {
        ;(k.isLive = e), e && k.refreshTime()
      }
    return () =>
      o('div', { class: 'realtime-monitor-page' }, [
        o(
          R,
          { title: '基础设施概览', subtitle: '系统性能与健康状态指标' },
          {
            actions: () =>
              o(
                s,
                { type: 'primary', onClick: N, disabled: !A.value },
                { icon: () => o(u, { component: m }, null), default: () => '刷新数据' }
              )
          }
        ),
        o(
          T,
          {
            value: k.timeRange,
            live: k.isLive,
            options: k.timeOptions,
            'onUpdate:value': F,
            'onUpdate:live': H,
            onRefresh: () => {
              k.refreshTime(), N()
            }
          },
          null
        ),
        o(q, { value: D.value, options: { services: Q.value }, mode: 'service', 'onUpdate:value': E }, null),
        P.value && !U.value.cpu
          ? o('div', { class: 'realtime-monitor-page__loading' }, [o(v, { size: 'large' }, null)])
          : null,
        A.value || !K.value || P.value
          ? A.value || P.value
            ? G.value && !P.value
              ? o(
                  c,
                  { description: G.value, class: 'realtime-monitor-page__empty-state' },
                  {
                    extra: () =>
                      o(s, { type: 'primary', secondary: !0, onClick: N }, { default: () => [p('重试加载')] })
                  }
                )
              : o(d, null, [
                  o(
                    g,
                    { cols: 3, xGap: 16, class: 'realtime-monitor-page__metrics-grid' },
                    {
                      default: () => [
                        o(y, null, {
                          default: () => [
                            o(
                              f,
                              { bordered: !1, class: 'realtime-monitor-page__hero-card' },
                              {
                                default: () => {
                                  return [
                                    o('div', { class: 'realtime-monitor-page__hero-card-content' }, [
                                      o('div', { class: 'realtime-monitor-page__hero-label' }, [p('CPU 使用率')]),
                                      'number' == typeof U.value.cpu
                                        ? o(
                                            h,
                                            {
                                              type: 'circle',
                                              percentage: U.value.cpu,
                                              status:
                                                ((e = U.value.cpu), e > 80 ? 'error' : e > 60 ? 'warning' : 'success'),
                                              strokeWidth: 8,
                                              railColor: 'rgba(0,0,0,0.05)',
                                              style: { width: '120px', margin: '16px auto' }
                                            },
                                            null
                                          )
                                        : o('div', { class: 'realtime-monitor-page__hero-placeholder' }, [p('未知')]),
                                      o('div', { class: 'realtime-monitor-page__hero-value' }, [O(U.value.cpu, '%', 1)])
                                    ])
                                  ]
                                  var e
                                }
                              }
                            )
                          ]
                        }),
                        o(y, null, {
                          default: () => [
                            o(
                              f,
                              { bordered: !1, class: 'realtime-monitor-page__hero-card' },
                              {
                                default: () => {
                                  return [
                                    o('div', { class: 'realtime-monitor-page__hero-card-content' }, [
                                      o('div', { class: 'realtime-monitor-page__hero-label' }, [p('内存使用率')]),
                                      'number' == typeof U.value.memory
                                        ? o(
                                            h,
                                            {
                                              type: 'circle',
                                              percentage: U.value.memory,
                                              status:
                                                ((e = U.value.memory),
                                                e > 80 ? 'error' : e > 60 ? 'warning' : 'success'),
                                              strokeWidth: 8,
                                              railColor: 'rgba(0,0,0,0.05)',
                                              style: { width: '120px', margin: '16px auto' }
                                            },
                                            null
                                          )
                                        : o('div', { class: 'realtime-monitor-page__hero-placeholder' }, [p('未知')]),
                                      o('div', { class: 'realtime-monitor-page__hero-value' }, [
                                        O(U.value.memory, '%', 1)
                                      ])
                                    ])
                                  ]
                                  var e
                                }
                              }
                            )
                          ]
                        }),
                        o(y, null, {
                          default: () => [
                            o(
                              f,
                              { bordered: !1, class: 'realtime-monitor-page__hero-card' },
                              {
                                default: () => [
                                  o(
                                    'div',
                                    {
                                      class:
                                        'realtime-monitor-page__hero-card-content realtime-monitor-page__hero-card-content--error-rate'
                                    },
                                    [
                                      o(
                                        'div',
                                        {
                                          class:
                                            'realtime-monitor-page__hero-label realtime-monitor-page__hero-label--wide'
                                        },
                                        [p('错误率')]
                                      ),
                                      o(
                                        'div',
                                        {
                                          class: 'realtime-monitor-page__error-rate-value',
                                          style: {
                                            color:
                                              'number' == typeof U.value.errorRate
                                                ? U.value.errorRate > 1
                                                  ? 'var(--color-danger-6)'
                                                  : 'var(--color-success-6)'
                                                : 'var(--color-text-3)'
                                          }
                                        },
                                        [O(U.value.errorRate, '%', 2)]
                                      ),
                                      o('div', { class: 'realtime-monitor-page__error-rate-badge' }, [p('最新值')])
                                    ]
                                  )
                                ]
                              }
                            )
                          ]
                        })
                      ]
                    }
                  ),
                  o(
                    g,
                    { cols: 3, xGap: 16, class: 'realtime-monitor-page__stats-grid' },
                    {
                      default: () => [
                        o(y, null, {
                          default: () => [
                            o(f, null, {
                              default: () => [
                                o(
                                  _,
                                  {
                                    label: 'QPS（请求/秒）',
                                    value: 'number' == typeof U.value.qps ? U.value.qps.toLocaleString() : '未知',
                                    style: { fontSize: '24px', fontWeight: '600', color: 'var(--color-text-1)' }
                                  },
                                  null
                                )
                              ]
                            })
                          ]
                        }),
                        o(y, null, {
                          default: () => [
                            o(f, null, {
                              default: () => {
                                return [
                                  o(
                                    _,
                                    {
                                      label: '平均响应时间',
                                      value: O(U.value.responseTime, 'ms', 0),
                                      style: {
                                        fontSize: '24px',
                                        fontWeight: '600',
                                        color:
                                          'number' == typeof U.value.responseTime
                                            ? ((e = U.value.responseTime),
                                              e > 150
                                                ? 'var(--color-danger-6)'
                                                : e > 100
                                                  ? 'var(--color-warning-6)'
                                                  : 'var(--color-success-6)')
                                            : 'var(--color-text-3)'
                                      }
                                    },
                                    null
                                  )
                                ]
                                var e
                              }
                            })
                          ]
                        }),
                        o(y, null, {
                          default: () => [
                            o(f, null, {
                              default: () => [
                                o(
                                  _,
                                  {
                                    label: '活跃连接数',
                                    value:
                                      'number' == typeof U.value.activeConnections
                                        ? U.value.activeConnections.toLocaleString()
                                        : '未知',
                                    style: { fontSize: '24px', fontWeight: '600', color: 'var(--color-text-1)' }
                                  },
                                  null
                                )
                              ]
                            })
                          ]
                        })
                      ]
                    }
                  ),
                  W.value
                    ? o(
                        g,
                        { cols: 2, xGap: 16, yGap: 16 },
                        {
                          default: () => [
                            o(y, null, {
                              default: () => [
                                o(
                                  f,
                                  { title: 'CPU 实时趋势', bordered: !1 },
                                  {
                                    default: () => [
                                      o(
                                        w,
                                        {
                                          data: W.value.cpu,
                                          title: '',
                                          height: '240px',
                                          area: !0,
                                          variant: 'monitor',
                                          mutedGrid: !0
                                        },
                                        null
                                      )
                                    ]
                                  }
                                )
                              ]
                            }),
                            o(y, null, {
                              default: () => [
                                o(
                                  f,
                                  { title: '内存实时趋势', bordered: !1 },
                                  {
                                    default: () => [
                                      o(
                                        w,
                                        {
                                          data: W.value.memory,
                                          title: '',
                                          height: '240px',
                                          area: !0,
                                          variant: 'monitor',
                                          mutedGrid: !0
                                        },
                                        null
                                      )
                                    ]
                                  }
                                )
                              ]
                            }),
                            o(y, null, {
                              default: () => [
                                o(
                                  f,
                                  { title: 'QPS 当前值', bordered: !1 },
                                  {
                                    default: () => [
                                      o('div', { class: 'realtime-monitor-page__qps-panel' }, [
                                        o('div', { class: 'realtime-monitor-page__qps-panel-content' }, [
                                          o('div', { class: 'realtime-monitor-page__qps-panel-value' }, [
                                            O(U.value.qps)
                                          ]),
                                          o('div', { class: 'realtime-monitor-page__qps-panel-label' }, [
                                            p('当前采样 QPS')
                                          ])
                                        ])
                                      ])
                                    ]
                                  }
                                )
                              ]
                            }),
                            o(y, null, {
                              default: () => [
                                o(
                                  f,
                                  { title: '响应时间趋势', bordered: !1 },
                                  {
                                    default: () => [
                                      o(
                                        w,
                                        {
                                          data: W.value.responseTime,
                                          title: '',
                                          height: '240px',
                                          variant: 'monitor',
                                          mutedGrid: !0
                                        },
                                        null
                                      )
                                    ]
                                  }
                                )
                              ]
                            })
                          ]
                        }
                      )
                    : null,
                  o(
                    f,
                    { class: 'realtime-monitor-page__system-card', title: '系统状态', bordered: !1 },
                    {
                      default: () => [
                        o(b, null, {
                          default: () => [
                            $.value.length
                              ? $.value.map((e) =>
                                  o(
                                    x,
                                    {
                                      type:
                                        'healthy' === e.status
                                          ? 'success'
                                          : 'critical' === e.status
                                            ? 'error'
                                            : 'warning' === e.status
                                              ? 'warning'
                                              : 'default',
                                      bordered: !1
                                    },
                                    { default: () => [e.name, p(': '), e.status] }
                                  )
                                )
                              : o(c, { description: '暂无系统状态数据' }, null)
                          ]
                        })
                      ]
                    }
                  )
                ])
            : o(c, { description: '请选择服务查看数据', class: 'realtime-monitor-page__empty-state' }, null)
          : o(
              c,
              { description: '服务列表暂时不可用，请稍后重试', class: 'realtime-monitor-page__empty-state' },
              { extra: () => o(s, { type: 'primary', secondary: !0, onClick: B }, { default: () => [p('重试加载')] }) }
            )
      ])
  }
})
export { k as default }
