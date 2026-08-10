import {
  p as e,
  r as a,
  a0 as l,
  a1 as t,
  a3 as i,
  ba as s,
  a2 as n,
  w as r,
  ag as u,
  ac as v,
  cM as o,
  cN as c,
  am as d,
  cL as g,
  ci as p,
  ab as m,
  cz as y,
  cO as _,
  ch as f,
  a6 as h,
  $ as b,
  ai as k
} from './invariable-DewVS0br.js'
import { f as w, w as S, x as q } from './metrics-uVJcD6zf.js'
import './request-BiInMBwl.js'
import { P as C } from './PageHeader-OtleDOO-.js'
import { T as R } from './TimeRangeBar-EdVcwx6f.js'
import { S as P } from './ScopeBar-cbY9MT5P.js'
import { R as T } from './ResultTable-B_9U75PU.js'
import { S as z } from './ServiceHealthBadge-b4ePBNa-.js'
import { D as I } from './DetailDrawer-C1HE8GcD.js'
import { u as $ } from './useTimeStore-CVw7RN2Q.js'
import { d as j } from './index-DFkcx8xz.js'
const x = e({
  name: 'ServiceCatalogPageV2',
  setup() {
    const e = b(),
      x = s(),
      D = $(),
      N = a(),
      O = l(j()),
      U = l({ service: null, env: null, region: null }),
      B = l(''),
      A = l(''),
      L = l(''),
      E = l(''),
      G = l(''),
      H = l(''),
      Q = l('name'),
      M = l('table'),
      V = l(!1),
      F = l(''),
      Y = l([]),
      K = l([]),
      X = l({ total: null, healthy: null, degraded: null, critical: null, muted: null }),
      J = l(!1),
      W = l(!1),
      Z = l(null),
      ee = () => {
        ;(K.value = Y.value
          .filter((e) => !U.value.service || e.id === U.value.service)
          .filter((e) => !U.value.env || e.env === U.value.env)
          .filter((e) => !U.value.region || e.region === U.value.region)
          .filter((e) => {
            const a = B.value.trim().toLowerCase()
            return (
              !a ||
              [e.name, e.owner, e.team, ...(e.tags || [])]
                .filter(Boolean)
                .some((e) => String(e).toLowerCase().includes(a))
            )
          })
          .filter((e) => !A.value || e.health === A.value)
          .filter((e) => !L.value || e.env === L.value)
          .filter((e) => !E.value || e.team === E.value)
          .filter((e) => !G.value || e.owner === G.value)
          .filter((e) => !H.value || (e.tags || []).includes(H.value))),
          (K.value = [...K.value].sort((e, a) => {
            if ('name' === Q.value) return String(e.name).localeCompare(String(a.name))
            if ('lastDeploy' === Q.value) return String(a.lastDeploy || '').localeCompare(String(e.lastDeploy || ''))
            const l = 'number' == typeof e[Q.value] ? e[Q.value] : Number.NEGATIVE_INFINITY
            return ('number' == typeof a[Q.value] ? a[Q.value] : Number.NEGATIVE_INFINITY) - l
          }))
      },
      ae = async () => {
        ;(V.value = !0), (F.value = '')
        try {
          const [e, a] = await Promise.all([w({ page: 1, pageSize: 50, scope: O.value }), S({ scope: O.value })]),
            l = (null == e ? void 0 : e.items) || []
          ;(Y.value = l.map((e) => {
            var a, l, t, i, s, n, r, u, v, o, c, d, g, p, m
            return {
              id: null == (a = e.identity) ? void 0 : a.id,
              name: null == (l = e.identity) ? void 0 : l.name,
              owner: null == (t = e.identity) ? void 0 : t.owner,
              team: null == (i = e.identity) ? void 0 : i.team,
              env: null == (s = e.identity) ? void 0 : s.env,
              region: null == (n = e.identity) ? void 0 : n.region,
              version: null == (r = e.identity) ? void 0 : r.runtime,
              tags: (null == (u = e.identity) ? void 0 : u.tags) || [],
              health: null == (v = e.identity) ? void 0 : v.healthStatus,
              qps: e.qps,
              latency: e.p95Latency,
              errorRate: e.errorRate,
              activeIncidentCount: e.activeIncidentCount,
              metricStatus: e.metricStatus,
              runtimeMetrics: e.runtimeMetrics,
              instances: e.instanceCount,
              lastDeploy: e.lastDeployAt,
              status:
                'healthy' === (null == (o = e.identity) ? void 0 : o.healthStatus)
                  ? 'running'
                  : 'warning' === (null == (c = e.identity) ? void 0 : c.healthStatus) ||
                      'degraded' === (null == (d = e.identity) ? void 0 : d.healthStatus)
                    ? 'warning'
                    : 'unknown' === (null == (g = e.identity) ? void 0 : g.healthStatus) ||
                        'muted' === (null == (p = e.identity) ? void 0 : p.healthStatus)
                      ? 'unknown'
                      : 'critical' === (null == (m = e.identity) ? void 0 : m.healthStatus)
                        ? 'error'
                        : 'unknown'
            }
          })),
            ee(),
            (X.value = {
              total: (null == a ? void 0 : a.total) ?? null,
              healthy: (null == a ? void 0 : a.healthy) ?? null,
              degraded: (null == a ? void 0 : a.degraded) ?? null,
              critical: (null == a ? void 0 : a.critical) ?? null,
              muted: (null == a ? void 0 : a.muted) ?? null
            })
        } catch (e) {
          ;(Y.value = []),
            (K.value = []),
            (X.value = { total: null, healthy: null, degraded: null, critical: null, muted: null }),
            (F.value = '服务目录加载失败，请检查后端服务或稍后重试。'),
            N.error('加载服务目录失败')
        } finally {
          V.value = !1
        }
      },
      le = t(() => [
        { label: '全部环境', value: '' },
        ...Array.from(new Set(Y.value.map((e) => e.env).filter(Boolean))).map((e) => ({ label: e, value: e }))
      ]),
      te = t(() => ({
        services: Y.value.map((e) => ({ label: e.name, value: e.id })),
        envs: le.value.filter((e) => e.value),
        regions: Array.from(new Set(Y.value.map((e) => e.region).filter(Boolean))).map((e) => ({ label: e, value: e }))
      })),
      ie = t(() => [
        { label: '全部团队', value: '' },
        ...Array.from(new Set(Y.value.map((e) => e.team).filter(Boolean))).map((e) => ({ label: e, value: e }))
      ]),
      se = t(() => {
        var e
        return [
          B.value ? { key: 'query', label: `关键词: ${B.value}` } : null,
          U.value.service
            ? {
                key: 'scope-service',
                label: `服务: ${(null == (e = Y.value.find((e) => e.id === U.value.service)) ? void 0 : e.name) || U.value.service}`
              }
            : null,
          U.value.env ? { key: 'scope-env', label: `范围环境: ${U.value.env}` } : null,
          U.value.region ? { key: 'scope-region', label: `范围区域: ${U.value.region}` } : null,
          A.value ? { key: 'status', label: `状态: ${A.value}` } : null,
          L.value ? { key: 'env', label: `环境: ${L.value}` } : null,
          E.value ? { key: 'team', label: `团队: ${E.value}` } : null,
          G.value ? { key: 'owner', label: `Owner: ${G.value}` } : null,
          H.value ? { key: 'tag', label: `Tag: ${H.value}` } : null
        ].filter(Boolean)
      }),
      ne = async (e) => {
        ;(W.value = !0), (J.value = !0)
        try {
          Z.value = await q(e, { scope: O.value })
        } catch (a) {
          N.error('加载服务摘要失败')
        } finally {
          J.value = !1
        }
      },
      re = (a) => {
        e.push({ path: `/home/services/${a}`, query: { timeRange: D.timeRange, scope: O.value } })
      },
      ue = (a, l, t = 'serviceId') => {
        e.push({ path: a, query: { [t]: l, timeRange: D.timeRange, scope: O.value } })
      },
      ve = (e, a = '', l) => ('number' == typeof e ? `${e}${a}` : 'unavailable' === l ? '暂无样本' : '未知'),
      oe = [
        {
          title: '服务名',
          key: 'name',
          fixed: 'left',
          width: 220,
          render: (e) =>
            r('div', { class: 'service-catalog-page__service-cell' }, [
              r('strong', null, [e.name || '-']),
              r('span', null, [e.id || 'unknown-service'])
            ])
        },
        {
          title: 'Owner',
          key: 'owner',
          width: 150,
          render: (e) =>
            r(
              'span',
              {
                class: 'service-catalog-page__link-button',
                onClick: (a) => {
                  a.stopPropagation(), (G.value = e.owner || '')
                }
              },
              [e.owner || '-']
            )
        },
        { title: '团队', key: 'team', width: 140, render: (e) => e.team || '-' },
        { title: '环境', key: 'env', width: 120, render: (e) => e.env || '-' },
        { title: '区域', key: 'region', width: 140, render: (e) => e.region || '-' },
        { title: '健康状态', key: 'health', width: 130, render: (e) => r(z, { status: e.health, size: 'sm' }, null) },
        {
          title: '实例数',
          key: 'instances',
          width: 110,
          render: (e) => ('number' == typeof e.instances ? e.instances : '未知')
        },
        {
          title: 'QPS',
          key: 'qps',
          width: 110,
          render: (e) => {
            var a
            return ve(e.qps, '', null == (a = e.metricStatus) ? void 0 : a.qps)
          }
        },
        {
          title: '错误率',
          key: 'errorRate',
          width: 110,
          render: (e) => {
            var a
            return ve(e.errorRate, '%', null == (a = e.metricStatus) ? void 0 : a.errorRate)
          }
        },
        {
          title: 'P95',
          key: 'latency',
          width: 110,
          render: (e) => {
            var a
            return ve(e.latency, 'ms', null == (a = e.metricStatus) ? void 0 : a.latency)
          }
        },
        {
          title: '告警',
          key: 'alerts',
          width: 100,
          render: (e) => ('number' == typeof e.activeIncidentCount ? e.activeIncidentCount : '未知')
        },
        { title: '最近部署', key: 'lastDeploy', width: 190, render: (e) => e.lastDeploy || '-' },
        {
          title: '操作',
          key: 'actions',
          fixed: 'right',
          width: 420,
          render: (e) =>
            r('div', { class: 'service-catalog-page__meta-group' }, [
              r(
                u,
                {
                  size: 'small',
                  onClick: (a) => {
                    a.stopPropagation(), ne(e.id)
                  }
                },
                { default: () => [v('快速查看')] }
              ),
              r(
                u,
                {
                  size: 'small',
                  secondary: !0,
                  onClick: (a) => {
                    a.stopPropagation(), ue('/home/services/topology', e.id, 'focus')
                  }
                },
                { default: () => [v('拓扑')] }
              ),
              r(
                u,
                {
                  size: 'small',
                  secondary: !0,
                  onClick: (a) => {
                    a.stopPropagation(), ue('/home/investigate/traces', e.id)
                  }
                },
                { default: () => [v('链路')] }
              ),
              r(
                u,
                {
                  size: 'small',
                  secondary: !0,
                  onClick: (a) => {
                    a.stopPropagation(), ue('/home/investigate/logs', e.id, 'service')
                  }
                },
                { default: () => [v('日志')] }
              ),
              r(
                u,
                { size: 'small', secondary: !0, type: 'primary', onClick: () => re(e.id) },
                { default: () => [v('查看详情')] }
              )
            ])
        }
      ]
    return (
      i(() => {
        x.query.timeRange && 'string' == typeof x.query.timeRange && D.setTimeRange(x.query.timeRange), ae()
      }),
      n(
        () => [
          U.value.service,
          U.value.env,
          U.value.region,
          B.value,
          A.value,
          L.value,
          E.value,
          G.value,
          H.value,
          Q.value
        ],
        () => {
          ee()
        }
      ),
      n(
        () => D.timeRange,
        () => {
          ae()
        }
      ),
      n(
        () => O.value,
        () => {
          ae()
        }
      ),
      () => {
        var e, a, l, t
        let i
        return r('div', { class: 'service-catalog-page' }, [
          r(
            C,
            { title: '服务目录', subtitle: '查看服务清单、健康状态与常用排查入口' },
            { actions: () => r(u, { secondary: !0, type: 'primary', onClick: ae }, { default: () => [v('刷新目录')] }) }
          ),
          r('section', { class: 'service-catalog-page__control-panel' }, [
            r('div', { class: 'service-catalog-page__control-row service-catalog-page__control-row--range' }, [
              r(
                R,
                {
                  value: D.timeRange,
                  live: D.isLive,
                  options: D.timeOptions,
                  'onUpdate:value': (e) => {
                    D.setTimeRange(e), ae()
                  },
                  'onUpdate:live': (e) => {
                    ;(D.isLive = e), e && D.refreshTime(), ae()
                  },
                  onRefresh: () => {
                    D.refreshTime(), ae()
                  }
                },
                null
              )
            ]),
            r('div', { class: 'service-catalog-page__control-row' }, [
              r(
                P,
                {
                  value: U.value,
                  options: te.value,
                  mode: 'global',
                  'onUpdate:value': (e) => {
                    ;(U.value = e), ee()
                  }
                },
                null
              )
            ])
          ]),
          r(
            o,
            { cols: 5, xGap: 16, yGap: 16, class: 'service-catalog-page__summary-grid' },
            ((s = i =
              [
                { label: '总服务数', value: X.value.total },
                { label: '健康', value: X.value.healthy },
                { label: '轻微异常', value: X.value.degraded },
                { label: '严重异常', value: X.value.critical },
                { label: '已静音', value: X.value.muted }
              ].map((e) =>
                r(
                  c,
                  { key: e.label },
                  {
                    default: () => [
                      r(
                        d,
                        { bordered: !1, class: 'service-catalog-page__summary-card' },
                        { default: () => [r(g, { label: e.label, value: ve(e.value) }, null)] }
                      )
                    ]
                  }
                )
              )),
            'function' == typeof s || ('[object Object]' === Object.prototype.toString.call(s) && !k(s))
              ? i
              : { default: () => [i] })
          ),
          r('section', { class: 'service-catalog-page__filters-card' }, [
            r('div', { class: 'service-catalog-page__filters-header' }, [
              r('div', null, [
                r('div', { class: 'service-catalog-page__section-title' }, [v('服务筛选')]),
                r('div', { class: 'service-catalog-page__section-desc' }, [
                  v('按健康状态、环境、团队与关键指标排序，快速收敛排查范围。')
                ])
              ]),
              r(
                p,
                { bordered: !1, type: 'info' },
                { default: () => [K.value.length, v(' / '), Y.value.length, v(' 个服务')] }
              )
            ]),
            r('div', { class: 'service-catalog-page__filters' }, [
              r(
                m,
                {
                  value: B.value,
                  'onUpdate:value': (e) => (B.value = e),
                  placeholder: '搜索服务 / Owner / Team / Tag',
                  clearable: !0,
                  class: 'service-catalog-page__search'
                },
                null
              ),
              r(
                y,
                {
                  value: A.value,
                  'onUpdate:value': (e) => (A.value = e),
                  options: [
                    { label: '全部状态', value: '' },
                    { label: '健康', value: 'healthy' },
                    { label: '轻微异常', value: 'degraded' },
                    { label: '严重异常', value: 'critical' }
                  ],
                  class: 'service-catalog-page__select'
                },
                null
              ),
              r(
                y,
                {
                  value: L.value,
                  'onUpdate:value': (e) => (L.value = e),
                  options: le.value,
                  class: 'service-catalog-page__select'
                },
                null
              ),
              r(
                y,
                {
                  value: E.value,
                  'onUpdate:value': (e) => (E.value = e),
                  options: ie.value,
                  class: 'service-catalog-page__select'
                },
                null
              ),
              r(
                y,
                {
                  value: Q.value,
                  'onUpdate:value': (e) => (Q.value = e),
                  options: [
                    { label: '按名称', value: 'name' },
                    { label: '按 QPS', value: 'qps' },
                    { label: '按错误率', value: 'errorRate' },
                    { label: '按 P95', value: 'latency' },
                    { label: '按最近部署', value: 'lastDeploy' }
                  ],
                  class: 'service-catalog-page__select'
                },
                null
              ),
              r(_, null, {
                default: () => [
                  r(
                    u,
                    { type: 'table' === M.value ? 'primary' : 'default', onClick: () => (M.value = 'table') },
                    { default: () => [v('表格')] }
                  ),
                  r(
                    u,
                    { type: 'card' === M.value ? 'primary' : 'default', onClick: () => (M.value = 'card') },
                    { default: () => [v('卡片')] }
                  ),
                  r(u, { type: 'primary', onClick: ae }, { default: () => [v('搜索')] }),
                  r(
                    u,
                    {
                      secondary: !0,
                      onClick: () => {
                        ;(B.value = ''),
                          (A.value = ''),
                          (L.value = ''),
                          (E.value = ''),
                          (G.value = ''),
                          (H.value = ''),
                          (U.value = { service: null, env: null, region: null }),
                          (Q.value = 'name'),
                          ae()
                      }
                    },
                    { default: () => [v('重置')] }
                  )
                ]
              })
            ])
          ]),
          se.value.length > 0 &&
            r('div', { class: 'service-catalog-page__chips' }, [
              se.value.map((e) =>
                r(
                  p,
                  {
                    closable: !0,
                    bordered: !1,
                    onClose: () => {
                      return (
                        'query' === (a = e.key) && (B.value = ''),
                        'scope-service' === a && (U.value.service = null),
                        'scope-env' === a && (U.value.env = null),
                        'scope-region' === a && (U.value.region = null),
                        'status' === a && (A.value = ''),
                        'env' === a && (L.value = ''),
                        'team' === a && (E.value = ''),
                        'owner' === a && (G.value = ''),
                        void ('tag' === a && (H.value = ''))
                      )
                      var a
                    }
                  },
                  { default: () => [e.label] }
                )
              )
            ]),
          F.value && !V.value
            ? r(
                f,
                { description: F.value, class: 'service-catalog-page__empty-state' },
                {
                  extra: () => r(u, { type: 'primary', secondary: !0, onClick: ae }, { default: () => [v('重试加载')] })
                }
              )
            : 0 !== K.value.length || V.value
              ? 'table' === M.value
                ? r('section', { class: 'service-catalog-page__table-card' }, [
                    r('div', { class: 'service-catalog-page__table-header' }, [
                      r('div', null, [
                        r('div', { class: 'service-catalog-page__section-title' }, [v('服务清单')]),
                        r('div', { class: 'service-catalog-page__section-desc' }, [
                          v('服务名与操作列已固定，中间指标列可横向滑动查看。')
                        ])
                      ]),
                      r(p, { bordered: !1 }, { default: () => [v('横向滚动')] })
                    ]),
                    r('div', { class: 'service-catalog-page__table-scroll' }, [
                      r(
                        T,
                        {
                          columns: oe,
                          data: K.value,
                          loading: V.value,
                          scrollX: 1940,
                          maxHeight: 'max(360px, calc(100vh - 420px))',
                          flexHeight: !1,
                          rowKey: 'id',
                          rowProps: (e) => ({ onClick: () => re(e.id) })
                        },
                        null
                      )
                    ])
                  ])
                : r('div', { class: 'service-catalog-page__card-grid' }, [
                    K.value.map((e) =>
                      r('div', { class: 'service-catalog-page__card-wrap', key: e.id, onClick: () => re(e.id) }, [
                        r(
                          d,
                          { bordered: !1, class: 'service-catalog-page__card' },
                          {
                            default: () => {
                              var a
                              return [
                                r('div', { class: 'service-catalog-page__card-header' }, [
                                  r('div', null, [
                                    r('div', { class: 'service-catalog-page__card-title' }, [e.name]),
                                    r('div', { class: 'service-catalog-page__card-meta' }, [
                                      v('Owner：'),
                                      e.owner || '-',
                                      v(' · Team：'),
                                      e.team || '-',
                                      v(' · Env：'),
                                      e.env || '-',
                                      v(' · Region：'),
                                      e.region || '-'
                                    ])
                                  ]),
                                  r(z, { status: e.health || 'unknown', size: 'sm' }, null)
                                ]),
                                r('div', { class: 'service-catalog-page__card-stats' }, [
                                  r('div', null, [
                                    v('实例数：'),
                                    'number' == typeof e.instances ? e.instances : '未知'
                                  ]),
                                  r('div', null, [v('QPS：'), 'number' == typeof e.qps ? e.qps : '未知']),
                                  r('div', null, [
                                    v('错误率：'),
                                    'number' == typeof e.errorRate ? `${e.errorRate}%` : '未知'
                                  ]),
                                  r('div', null, [
                                    v('P95：'),
                                    'number' == typeof e.latency ? `${e.latency}ms` : '未知'
                                  ]),
                                  r('div', null, [v('最近部署：'), e.lastDeploy || '-'])
                                ]),
                                r('div', { class: 'service-catalog-page__card-tags' }, [
                                  null == (a = e.tags)
                                    ? void 0
                                    : a.map((e) =>
                                        r(
                                          'button',
                                          {
                                            class: 'service-catalog-page__tag-button',
                                            onClick: (a) => {
                                              a.stopPropagation(), (H.value = e)
                                            }
                                          },
                                          [e]
                                        )
                                      )
                                ]),
                                r('div', { class: 'service-catalog-page__card-actions' }, [
                                  r(
                                    u,
                                    {
                                      size: 'small',
                                      onClick: (a) => {
                                        a.stopPropagation(), ne(e.id)
                                      }
                                    },
                                    { default: () => [v('快速查看')] }
                                  ),
                                  r(
                                    u,
                                    {
                                      size: 'small',
                                      secondary: !0,
                                      onClick: (a) => {
                                        a.stopPropagation(), ue('/home/services/topology', e.id, 'focus')
                                      }
                                    },
                                    { default: () => [v('拓扑')] }
                                  ),
                                  r(
                                    u,
                                    {
                                      size: 'small',
                                      secondary: !0,
                                      onClick: (a) => {
                                        a.stopPropagation(), ue('/home/investigate/traces', e.id)
                                      }
                                    },
                                    { default: () => [v('链路')] }
                                  ),
                                  r(
                                    u,
                                    {
                                      size: 'small',
                                      secondary: !0,
                                      onClick: (a) => {
                                        a.stopPropagation(), ue('/home/investigate/logs', e.id, 'service')
                                      }
                                    },
                                    { default: () => [v('日志')] }
                                  ),
                                  r(
                                    u,
                                    {
                                      size: 'small',
                                      secondary: !0,
                                      type: 'primary',
                                      onClick: (a) => {
                                        a.stopPropagation(), re(e.id)
                                      }
                                    },
                                    { default: () => [v('查看详情')] }
                                  )
                                ])
                              ]
                            }
                          }
                        )
                      ])
                    )
                  ])
              : r(f, { description: '暂无服务数据', class: 'service-catalog-page__empty-state' }, null),
          r(
            I,
            {
              show: W.value,
              title:
                (null == (a = null == (e = Z.value) ? void 0 : e.identity) ? void 0 : a.displayName) ||
                (null == (t = null == (l = Z.value) ? void 0 : l.identity) ? void 0 : t.name) ||
                '服务摘要',
              width: 'md',
              'onUpdate:show': (e) => {
                W.value = e
              },
              onClose: () => {
                Z.value = null
              }
            },
            {
              default: () => {
                var e, a, l, t, i, s, n, u, o, c, d
                return [
                  J.value
                    ? r('div', { class: 'service-catalog-page__quick-loading' }, [r(h, { size: 'large' }, null)])
                    : Z.value
                      ? r('div', { class: 'service-catalog-page__quick-panel' }, [
                          r('div', { class: 'service-catalog-page__quick-hero' }, [
                            r('div', { class: 'service-catalog-page__quick-hero-title' }, [
                              (null == (e = Z.value.identity) ? void 0 : e.displayName) ||
                                (null == (a = Z.value.identity) ? void 0 : a.name)
                            ]),
                            r('div', { class: 'service-catalog-page__quick-hero-meta' }, [
                              v('Owner：'),
                              (null == (l = Z.value.identity) ? void 0 : l.owner) || '-',
                              v(' · Region：'),
                              (null == (t = Z.value.identity) ? void 0 : t.region) || '-',
                              v(' · Runtime：'),
                              (null == (i = Z.value.identity) ? void 0 : i.runtime) || '-'
                            ])
                          ]),
                          r('div', { class: 'service-catalog-page__quick-stats' }, [
                            r('div', { class: 'service-catalog-page__quick-stat' }, [
                              r('div', { class: 'service-catalog-page__quick-stat-label' }, [v('QPS')]),
                              r('div', { class: 'service-catalog-page__quick-stat-value' }, [
                                ve(
                                  null == (s = Z.value.redSummary) ? void 0 : s.qps,
                                  '',
                                  null == (n = Z.value.metricStatus) ? void 0 : n.qps
                                )
                              ])
                            ]),
                            r('div', { class: 'service-catalog-page__quick-stat' }, [
                              r('div', { class: 'service-catalog-page__quick-stat-label' }, [v('错误率')]),
                              r('div', { class: 'service-catalog-page__quick-stat-value' }, [
                                ve(
                                  null == (u = Z.value.redSummary) ? void 0 : u.errorRate,
                                  '%',
                                  null == (o = Z.value.metricStatus) ? void 0 : o.errorRate
                                )
                              ])
                            ]),
                            r('div', { class: 'service-catalog-page__quick-stat' }, [
                              r('div', { class: 'service-catalog-page__quick-stat-label' }, [v('P95 延迟')]),
                              r('div', { class: 'service-catalog-page__quick-stat-value' }, [
                                ve(
                                  null == (c = Z.value.redSummary) ? void 0 : c.p95Latency,
                                  'ms',
                                  null == (d = Z.value.metricStatus) ? void 0 : d.latency
                                )
                              ])
                            ]),
                            r('div', { class: 'service-catalog-page__quick-stat' }, [
                              r('div', { class: 'service-catalog-page__quick-stat-label' }, [v('实例数')]),
                              r('div', { class: 'service-catalog-page__quick-stat-value' }, [
                                'number' == typeof Z.value.instanceCount ? Z.value.instanceCount : '未知'
                              ])
                            ])
                          ]),
                          r('div', { class: 'service-catalog-page__quick-footer' }, [
                            v('活跃事件：'),
                            'number' == typeof Z.value.activeIncidentCount ? Z.value.activeIncidentCount : '未知'
                          ])
                        ])
                      : r(f, { description: '暂无服务摘要', class: 'service-catalog-page__empty-state' }, null)
                ]
              }
            }
          )
        ])
        var s
      }
    )
  }
})
export { x as default }
