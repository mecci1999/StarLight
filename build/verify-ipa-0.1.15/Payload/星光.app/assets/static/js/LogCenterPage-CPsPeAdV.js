import { L as e, a, b as l } from './logs-DZkPx9D6.js'
import t from './index-BRz3eDUI.js'
import {
  by as r,
  az as s,
  p as o,
  r as n,
  y as i,
  a0 as c,
  a2 as g,
  a1 as u,
  a3 as p,
  ba as d,
  Z as v,
  w as m,
  ag as _,
  ar as f,
  dA as y,
  dB as h,
  cn as b,
  ci as w,
  am as T,
  cM as L,
  cN as R,
  cL as x,
  ac as S,
  ab as C,
  cz as k,
  ce as D,
  av as A,
  dC as E,
  cd as H,
  dD as U,
  al as I,
  aC as N,
  aR as Y,
  dE as O,
  cO as z,
  ai as M,
  dF as j,
  dG as F,
  dH as $,
  dI as B,
  ck as G,
  cK as q,
  ay as P,
  dJ as W,
  dK as V,
  a6 as J,
  ch as K,
  c0 as Q,
  aA as Z,
  aB as X,
  aS as ee,
  A as ae,
  h as le,
  dL as te,
  dM as re,
  cc as se,
  dN as oe,
  D as ne,
  cq as ie
} from './invariable-DewVS0br.js'
import { P as ce } from './PageHeader-OtleDOO-.js'
import { b as ge, o as ue } from './index-DFkcx8xz.js'
import { R as pe } from './ResultTable-B_9U75PU.js'
import { f as de } from './metrics-uVJcD6zf.js'
import { u as ve } from './useTimeStore-CVw7RN2Q.js'
import { E as me } from './ExceptionAnalysisContent-D4ZOH4hG.js'
import _e from './IngestionPage-DsOnnjH5.js'
import { w as fe } from './webSocket-m2SVJyVb.js'
import { u as ye } from './useMitt-UjCuZB1B.js'
import './logs-CT6hSV3d.js'
import './request-BiInMBwl.js'
import './alerts-CIHfuoAx.js'
import './subscription-C610hAN0.js'
import './auth-CpdnJA9r.js'
import './user-CjErkjef.js'
import './microApps-BJHOuFrl.js'
const he = [e.INFO, e.WARN, e.ERROR, e.FATAL],
  be = { excludeServices: ['logs'], excludeNodeIDs: ['logs-development'] },
  we = (e) => ('info-and-above' === e ? { levels: he } : e ? { level: e } : {}),
  Te = ({ originType: e, page: a, pageSize: l, levelFilter: t = null, service: r, keyword: s }) => {
    const o = null == s ? void 0 : s.trim()
    return {
      page: a,
      pageSize: l,
      limit: l,
      sortBy: 'timestamp',
      sortOrder: 'desc',
      originType: e,
      ...('darwin-app' === e ? be : {}),
      ...we(t),
      ...(r ? { service: r } : {}),
      ...(o ? { keyword: o, query: o } : {})
    }
  },
  Le = (
    e,
    { showTimestamp: a, showLevel: l, showService: t } = { showTimestamp: !0, showLevel: !0, showService: !0 }
  ) => {
    var s
    return [
      a && `[${e.timestamp ? r(e.timestamp).format('HH:mm:ss.SSS') : '-'}]`,
      l && `[${(null == (s = e.level) ? void 0 : s.toUpperCase()) || 'UNKNOWN'}]`,
      t && `[${e.service || 'unknown-service'}]`,
      e.originType && `[${e.originType}]`,
      e.message || ''
    ]
      .filter(Boolean)
      .join(' ')
  },
  Re = async (e) => {
    var a
    try {
      return void (await s(e))
    } catch {}
    if (null == (a = navigator.clipboard) ? void 0 : a.writeText)
      try {
        return void (await navigator.clipboard.writeText(e))
      } catch {}
    ;((e) => {
      const a = document.createElement('textarea')
      ;(a.value = e),
        a.setAttribute('readonly', ''),
        a.setAttribute('aria-hidden', 'true'),
        (a.style.position = 'fixed'),
        (a.style.opacity = '0'),
        document.body.append(a),
        a.select()
      const l = document.execCommand('copy')
      if ((a.remove(), !l)) throw new Error('Clipboard is unavailable')
    })(e)
  },
  xe = o({
    name: 'LogExplorerPage',
    setup() {
      var s
      const o = d(),
        j = n(),
        F = ve(),
        $ = Boolean(null == (s = ge()) ? void 0 : s.isAdmin),
        B = () => ({
          startTime: r().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
          endTime: r().endOf('day').format('YYYY-MM-DD HH:mm:ss')
        }),
        G = i({
          loading: !1,
          statsLoading: !1,
          streamConnected: !1,
          logs: [],
          stats: null,
          selectedLog: null,
          showLogDetail: !1,
          autoRefresh: !1,
          refreshInterval: null
        }),
        q = i({
          service: '',
          level: void 0,
          keyword: '',
          startTime: B().startTime,
          endTime: B().endTime,
          page: 1,
          pageSize: 50,
          originType: $ ? 'darwin-app' : 'microservice',
          source: void 0,
          hostname: '',
          containerId: ''
        }),
        P = c(!1)
      g(
        () => [F.startTime, F.endTime],
        () => {
          P.value &&
            ((q.startTime = r(F.startTime).format('YYYY-MM-DD HH:mm:ss')),
            (q.endTime = r(F.endTime).format('YYYY-MM-DD HH:mm:ss')),
            re(!0),
            se())
        }
      )
      const W = c([]),
        V = i({ page: 1, pageSize: 50, total: 0, showSizePicker: !0, pageSizes: [20, 50, 100, 200] }),
        J = Object.values(e).map((e) => ({ label: e.toUpperCase(), value: e })),
        K = Object.values(a).map((e) => ({ label: e.charAt(0).toUpperCase() + e.slice(1), value: e })),
        Q = [
          ...($ ? [{ label: 'Darwin 服务日志', value: 'darwin-app' }] : []),
          { label: '用户微服务日志', value: 'microservice' }
        ],
        Z = Object.values(l).map((e) => ({ label: e.toUpperCase(), value: e })),
        X = u(() => {
          const e = `${r(q.startTime).format('MM-DD HH:mm')} 至 ${r(q.endTime).format('MM-DD HH:mm')}`
          return 'darwin-app' === q.originType
            ? `当前查看 Darwin 系统日志，统计范围 ${e}；DEBUG 级别需要先在日志中心概览开启“调试日志收集”。`
            : `当前查看用户微服务日志，统计范围 ${e}；可按服务、级别、主机和容器快速收敛问题范围。`
        }),
        ee = u(() => [q.service, q.level, q.keyword, q.source, q.hostname, q.containerId].filter(Boolean).length),
        ae = [
          { title: '时间', key: 'timestamp', width: 180, render: (e) => r(e.timestamp).format('MM-DD HH:mm:ss.SSS') },
          {
            title: '级别',
            key: 'level',
            width: 80,
            render: (a) => {
              const l = {
                [e.TRACE]: 'default',
                [e.DEBUG]: 'default',
                [e.INFO]: 'info',
                [e.WARN]: 'warning',
                [e.ERROR]: 'error',
                [e.FATAL]: 'error'
              }
              return Y(w, { type: l[a.level], size: 'small' }, () => a.level.toUpperCase())
            }
          },
          { title: '服务', key: 'service', width: 120, ellipsis: { tooltip: !0 } },
          {
            title: '消息',
            key: 'message',
            ellipsis: { tooltip: !0 },
            render: (e) => Y('span', { class: 'log-explorer-page__message-link', onClick: () => oe(e) }, e.message)
          },
          { title: '主机', key: 'hostname', width: 120, ellipsis: { tooltip: !0 } },
          {
            title: '操作',
            key: 'actions',
            width: 100,
            render: (e) =>
              Y(z, { size: 'small' }, () => [
                Y(
                  O,
                  { trigger: 'hover' },
                  {
                    trigger: () =>
                      Y(_, { size: 'small', type: 'primary', ghost: !0, onClick: () => oe(e) }, () => '详情'),
                    default: () => '查看日志详情'
                  }
                )
              ])
          }
        ],
        le = u(
          () =>
            q.service ||
            q.level ||
            q.keyword ||
            q.originType !== ($ ? 'darwin-app' : 'microservice') ||
            q.source ||
            q.hostname ||
            q.containerId
        ),
        te = async () => {
          try {
            const e = await de({
              page: 1,
              pageSize: 200,
              scope: $ && 'darwin-app' === q.originType ? 'system' : 'tenant'
            })
            W.value = ((null == e ? void 0 : e.items) || []).map((e) => {
              var a, l, t
              return {
                label: (null == (a = e.identity) ? void 0 : a.name) || (null == (l = e.identity) ? void 0 : l.id),
                value: (null == (t = e.identity) ? void 0 : t.id) || ''
              }
            })
          } catch (e) {
            W.value = []
          }
        },
        re = async (e = !0) => {
          var a, l, r
          e && ((q.page = 1), (V.page = 1)), (G.loading = !0)
          try {
            const e = q.containerId ? { containerId: q.containerId } : void 0,
              s = await t.logs.searchLogsExplorer({
                ...q,
                query: q.keyword || void 0,
                filters: e,
                page: V.page,
                pageSize: V.pageSize,
                limit: V.pageSize
              })
            s
              ? ((G.logs = s.items || []),
                (V.total = (null == (a = s.pagination) ? void 0 : a.total) || 0),
                (V.page = (null == (l = s.pagination) ? void 0 : l.page) || V.page),
                (V.pageSize = (null == (r = s.pagination) ? void 0 : r.pageSize) || V.pageSize))
              : (G.logs = [])
          } catch (s) {
            ;(G.logs = []), (V.total = 0)
          } finally {
            G.loading = !1
          }
        },
        se = async () => {
          if (q.startTime && q.endTime) {
            G.statsLoading = !0
            try {
              const e = await t.logs.getLogExplorerStats({
                service: q.service,
                level: q.level,
                query: q.keyword || void 0,
                source: q.source,
                hostname: q.hostname || void 0,
                filters: q.containerId ? { containerId: q.containerId } : void 0,
                originType: q.originType,
                startTime: q.startTime,
                endTime: q.endTime,
                interval: '1h',
                groupBy: 'level'
              })
              e && (G.stats = e)
            } catch {
            } finally {
              G.statsLoading = !1
            }
          }
        },
        oe = (e) => {
          ;(G.selectedLog = e), (G.showLogDetail = !0)
        },
        ne = (e = !0) => {
          re(e), se()
        },
        ie = () => {
          ;(G.autoRefresh = !G.autoRefresh),
            G.autoRefresh
              ? ((G.refreshInterval = setInterval(() => {
                  re(!1), se()
                }, 3e4)),
                j.success('已开启自动刷新'))
              : (G.refreshInterval && (clearInterval(G.refreshInterval), (G.refreshInterval = null)),
                j.info('已关闭自动刷新'))
        },
        ue = () => {
          const e = B()
          ;(q.service = ''),
            (q.level = void 0),
            (q.keyword = ''),
            (q.originType = $ ? 'darwin-app' : 'microservice'),
            (q.source = void 0),
            (q.hostname = ''),
            (q.containerId = ''),
            (q.startTime = e.startTime),
            (q.endTime = e.endTime),
            te(),
            re(),
            se()
        },
        me = (e) => {
          ;(V.page = e), (q.page = e), re(!1)
        },
        _e = (e) => {
          ;(V.pageSize = e), (V.page = 1), (q.page = 1), (q.pageSize = e), re(!1)
        }
      return (
        p(() => {
          o.query.timeRange &&
            'string' == typeof o.query.timeRange &&
            ((P.value = !0), F.setTimeRange(o.query.timeRange))
          const e = 'string' == typeof o.query.service ? o.query.service : o.query.serviceId
          'string' == typeof e && (q.service = e),
            'string' == typeof o.query.keyword && (q.keyword = o.query.keyword),
            te(),
            re(),
            se()
        }),
        v(() => {
          G.refreshInterval && clearInterval(G.refreshInterval)
        }),
        () => {
          let a
          return m('div', { class: 'log-explorer-page' }, [
            m(
              ce,
              { title: '服务日志', subtitle: '按范围、服务和级别检索日志，并与调试采集开关联动排查上下文' },
              {
                actions: () =>
                  m(
                    _,
                    { secondary: !0, type: G.autoRefresh ? 'warning' : 'primary', onClick: ie },
                    {
                      default: () => [
                        m(f, { component: G.autoRefresh ? y : h, class: 'log-explorer-page__button-icon' }, null),
                        G.autoRefresh ? '停止自动刷新' : '开启自动刷新'
                      ]
                    }
                  )
              }
            ),
            m('div', { class: 'log-explorer-page__scope-note' }, [
              m('div', { class: 'log-explorer-page__scope-note-main' }, [
                m(f, { component: b, size: 18 }, null),
                m('span', null, [X.value])
              ]),
              m(
                w,
                { bordered: !1, type: ee.value > 0 ? 'info' : 'default' },
                { default: () => [ee.value > 0 ? `${ee.value} 个筛选条件` : '未筛选'] }
              )
            ]),
            G.stats &&
              m(
                T,
                { class: 'log-explorer-page__card log-explorer-page__summary-card', bordered: !1 },
                {
                  default: () => [
                    m(
                      L,
                      { cols: 4, xGap: 16, yGap: 16 },
                      {
                        default: () => [
                          m(R, null, {
                            default: () => [
                              m(
                                x,
                                { label: '总日志数', value: G.stats.totalLogs },
                                {
                                  default: () => {
                                    var e
                                    return m('span', { class: 'log-explorer-page__stat-value' }, [
                                      (null == (e = G.stats) ? void 0 : e.totalLogs) || 0
                                    ])
                                  }
                                }
                              )
                            ]
                          }),
                          m(R, null, {
                            default: () => [
                              m(
                                x,
                                { label: '错误日志', value: G.stats.errorLogs },
                                {
                                  default: () => {
                                    var e
                                    return m(
                                      'span',
                                      { class: 'log-explorer-page__stat-value log-explorer-page__stat-value--danger' },
                                      [(null == (e = G.stats) ? void 0 : e.errorLogs) || 0]
                                    )
                                  }
                                }
                              )
                            ]
                          }),
                          m(R, null, {
                            default: () => [
                              m(
                                x,
                                { label: '警告日志', value: G.stats.warnLogs },
                                {
                                  default: () => {
                                    var e
                                    return m(
                                      'span',
                                      { class: 'log-explorer-page__stat-value log-explorer-page__stat-value--warning' },
                                      [(null == (e = G.stats) ? void 0 : e.warnLogs) || 0]
                                    )
                                  }
                                }
                              )
                            ]
                          }),
                          m(R, null, {
                            default: () => [
                              m(
                                x,
                                {
                                  label: '错误率',
                                  value:
                                    G.stats.totalLogs > 0
                                      ? `${((G.stats.errorLogs / G.stats.totalLogs) * 100).toFixed(2)}%`
                                      : '0%'
                                },
                                {
                                  default: () =>
                                    m('span', { class: 'log-explorer-page__stat-value' }, [
                                      G.stats && G.stats.totalLogs > 0
                                        ? ((G.stats.errorLogs / G.stats.totalLogs) * 100).toFixed(2)
                                        : '0.00',
                                      S('%')
                                    ])
                                }
                              )
                            ]
                          })
                        ]
                      }
                    )
                  ]
                }
              ),
            m(
              T,
              { class: 'log-explorer-page__card log-explorer-page__filter-card', bordered: !1 },
              {
                default: () => [
                  m('div', { class: 'log-explorer-page__filter-header' }, [
                    m('div', null, [
                      m('div', { class: 'log-explorer-page__section-title' }, [S('日志筛选')]),
                      m('div', { class: 'log-explorer-page__section-desc' }, [
                        S('先选日志归属，再按服务、级别和关键字定位目标日志。')
                      ])
                    ]),
                    m(w, { bordered: !1 }, { default: () => [V.total.toLocaleString(), S(' 条结果')] })
                  ]),
                  m('div', { class: 'log-explorer-page__filter-grid' }, [
                    m('div', { class: 'log-explorer-page__filter-primary' }, [
                      m(
                        C,
                        {
                          value: q.keyword,
                          'onUpdate:value': (e) => (q.keyword = e),
                          placeholder: '搜索关键词',
                          clearable: !0,
                          class: 'log-explorer-page__keyword-input'
                        },
                        null
                      ),
                      m(
                        k,
                        {
                          value: q.originType,
                          'onUpdate:value': (e) => (q.originType = e),
                          placeholder: '日志归属',
                          class: 'log-explorer-page__select log-explorer-page__select--scope',
                          options: Q
                        },
                        null
                      ),
                      m(
                        k,
                        {
                          value: q.service,
                          'onUpdate:value': (e) => (q.service = e),
                          placeholder: $ && 'darwin-app' === q.originType ? '选择系统服务' : '选择服务',
                          clearable: !0,
                          filterable: !0,
                          tag: !0,
                          class: 'log-explorer-page__select log-explorer-page__select--service',
                          options: W.value
                        },
                        null
                      ),
                      m(
                        k,
                        {
                          value: q.level,
                          'onUpdate:value': (e) => (q.level = e),
                          placeholder: '日志级别',
                          clearable: !0,
                          class: 'log-explorer-page__select log-explorer-page__select--level',
                          options: J
                        },
                        null
                      ),
                      m(
                        k,
                        {
                          value: q.source,
                          'onUpdate:value': (e) => (q.source = e),
                          placeholder: '日志来源',
                          clearable: !0,
                          class: 'log-explorer-page__select log-explorer-page__select--source',
                          options: K
                        },
                        null
                      )
                    ]),
                    m('div', { class: 'log-explorer-page__filter-secondary' }, [
                      m(
                        C,
                        {
                          value: q.hostname,
                          'onUpdate:value': (e) => (q.hostname = e),
                          placeholder: '主机名',
                          clearable: !0,
                          class: 'log-explorer-page__compact-input'
                        },
                        null
                      ),
                      m(
                        C,
                        {
                          value: q.containerId,
                          'onUpdate:value': (e) => (q.containerId = e),
                          placeholder: '容器ID',
                          clearable: !0,
                          class: 'log-explorer-page__compact-input'
                        },
                        null
                      )
                    ]),
                    m('div', { class: 'log-explorer-page__filter-actions' }, [
                      m(
                        _,
                        { type: 'primary', onClick: () => ne(), loading: G.loading },
                        {
                          default: () => [
                            m(f, { component: D, class: 'log-explorer-page__button-icon' }, null),
                            S('搜索')
                          ]
                        }
                      ),
                      m(
                        _,
                        { onClick: () => ne(!1), loading: G.loading },
                        {
                          default: () => [
                            m(f, { component: A, class: 'log-explorer-page__button-icon' }, null),
                            S('刷新')
                          ]
                        }
                      ),
                      m(
                        _,
                        { onClick: ue, disabled: !le.value },
                        {
                          default: () => [
                            m(f, { component: E, class: 'log-explorer-page__button-icon' }, null),
                            S('清空过滤')
                          ]
                        }
                      ),
                      m(
                        H,
                        { trigger: 'click', placement: 'bottom-end' },
                        {
                          trigger: () =>
                            m(_, null, {
                              default: () => [
                                m(f, { component: U, class: 'log-explorer-page__button-icon' }, null),
                                S('导出')
                              ]
                            }),
                          default: () =>
                            m('div', { class: 'log-explorer-page__export-menu' }, [
                              Z.map((e) =>
                                m(
                                  _,
                                  {
                                    key: e.value,
                                    size: 'small',
                                    onClick: () =>
                                      (async (e) => {
                                        var a
                                        try {
                                          const l = await t.logs.exportLogs({
                                              query: q.keyword || void 0,
                                              service: q.service || void 0,
                                              level: q.level || void 0,
                                              source: q.source || void 0,
                                              hostname: q.hostname || void 0,
                                              containerId: q.containerId || void 0,
                                              originType: q.originType,
                                              startTime: q.startTime,
                                              endTime: q.endTime,
                                              format: e,
                                              filename: `logs_${r().format('YYYY-MM-DD_HH-mm-ss')}.${e}`
                                            }),
                                            s = l.exportData,
                                            o =
                                              l.downloadUrl ||
                                              (s ? `data:text/plain;charset=utf-8,${encodeURIComponent(s)}` : ''),
                                            n =
                                              l.filename ||
                                              (null == (a = l.meta) ? void 0 : a.filename) ||
                                              `logs_${r().format('YYYY-MM-DD_HH-mm-ss')}.${e}`
                                          if (!o) return void j.error('导出日志失败: 后端未返回导出内容')
                                          const i = document.createElement('a')
                                          ;(i.href = o),
                                            (i.download = n),
                                            document.body.appendChild(i),
                                            i.click(),
                                            document.body.removeChild(i),
                                            j.success('日志导出成功')
                                        } catch (l) {
                                          j.error('导出日志失败')
                                        }
                                      })(e.value)
                                  },
                                  { default: () => [S('导出为 '), e.label] }
                                )
                              )
                            ])
                        }
                      )
                    ])
                  ])
                ]
              }
            ),
            m(
              T,
              { class: 'log-explorer-page__card log-explorer-page__table-card', bordered: !1 },
              {
                default: () => [
                  m('div', { class: 'log-explorer-page__table-header' }, [
                    m('div', null, [
                      m('div', { class: 'log-explorer-page__section-title' }, [S('日志结果')]),
                      m('div', { class: 'log-explorer-page__section-desc' }, [
                        S('点击消息或详情按钮查看原始字段、标签和上下文。')
                      ])
                    ]),
                    q.level === e.DEBUG
                      ? m(w, { type: 'warning', bordered: !1 }, { default: () => [S('DEBUG 诊断视图')] })
                      : null
                  ]),
                  m(
                    pe,
                    {
                      columns: ae,
                      data: G.logs,
                      loading: G.loading,
                      pagination: {
                        page: V.page,
                        pageSize: V.pageSize,
                        itemCount: V.total,
                        showSizePicker: V.showSizePicker,
                        pageSizes: V.pageSizes,
                        onUpdatePage: me,
                        onUpdatePageSize: _e
                      },
                      rowKey: (e) => e.id
                    },
                    null
                  )
                ]
              }
            ),
            m(
              I,
              {
                show: G.showLogDetail,
                'onUpdate:show': (e) => (G.showLogDetail = e),
                preset: 'card',
                title: '日志详情',
                class: 'log-explorer-page__modal',
                style: { width: 'min(880px, 92vw)' }
              },
              {
                default: () => {
                  return [
                    G.selectedLog &&
                      m('div', { class: 'log-explorer-page__detail' }, [
                        m('div', { class: 'log-explorer-page__detail-header' }, [
                          m(
                            w,
                            {
                              type:
                                G.selectedLog.level === e.ERROR || G.selectedLog.level === e.FATAL
                                  ? 'error'
                                  : G.selectedLog.level === e.WARN
                                    ? 'warning'
                                    : G.selectedLog.level === e.INFO
                                      ? 'success'
                                      : 'default'
                            },
                            ((l = a = G.selectedLog.level.toUpperCase()),
                            'function' == typeof l || ('[object Object]' === Object.prototype.toString.call(l) && !M(l))
                              ? a
                              : { default: () => [a] })
                          ),
                          m('span', { class: 'log-explorer-page__detail-time' }, [
                            r(G.selectedLog.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')
                          ])
                        ]),
                        m('div', { class: 'log-explorer-page__code-shell' }, [
                          m(N, { code: G.selectedLog.message, language: 'text' }, null)
                        ]),
                        m('div', { class: 'log-explorer-page__code-shell log-explorer-page__code-shell--muted' }, [
                          m(
                            N,
                            {
                              code: JSON.stringify({ tags: G.selectedLog.tags, fields: G.selectedLog.fields }, null, 2),
                              language: 'json'
                            },
                            null
                          )
                        ])
                      ])
                  ]
                  var l
                }
              }
            )
          ])
        }
      )
    }
  }),
  Se = o({ name: 'ServiceLogsLegacyEntry', setup: () => () => m(xe, null, null) }),
  Ce = o({ name: 'LogIngestLegacyEntry', setup: () => () => m(_e, null, null) }),
  ke = o({
    name: 'LogStreamContent',
    setup() {
      var a
      const l = n(),
        s = c(!1),
        o = c(!1),
        g = c(!1),
        u = c(!0),
        d = c(!0),
        b = c(!0),
        w = c(!0),
        D = c(1e3),
        A = Boolean(null == (a = ge()) ? void 0 : a.isAdmin),
        H = c(),
        I = c([]),
        N = c([]),
        Y = c(null),
        M = c(fe.isConnected),
        Z = i({ services: [], levels: [], startTime: '', endTime: '', keywords: '', follow: !0, bufferSize: 1e3 }),
        X = i({ originType: A ? 'darwin-app' : 'microservice', service: '', level: '', keyword: '', timeRange: '' }),
        ee = i({ totalReceived: 0, linesPerSecond: 0, lastReceiveTime: '', connectionTime: '', errorCount: 0 }),
        ae = () => {
          ;(Z.service = X.service || ''),
            (Z.level = X.level ? X.level : void 0),
            (Z.keywords = X.keyword || ''),
            (Z.originType = X.originType)
        },
        le = [
          ...(A ? [{ label: 'Darwin 服务日志', value: 'darwin-app' }] : []),
          { label: '用户微服务日志', value: 'microservice' }
        ],
        te = [
          { label: 'ALL', value: '' },
          { label: 'DEBUG', value: e.DEBUG },
          { label: 'INFO', value: e.INFO },
          { label: 'WARN', value: e.WARN },
          { label: 'ERROR', value: e.ERROR },
          { label: 'FATAL', value: e.FATAL }
        ],
        re = c([{ label: 'ALL', value: '' }]),
        se = async () => {
          try {
            const e = await de({
                page: 1,
                pageSize: 200,
                scope: A && 'darwin-app' === X.originType ? 'system' : 'tenant'
              }),
              a = (null == e ? void 0 : e.items) || []
            re.value = [
              { label: 'ALL', value: '' },
              ...a.map((e) => {
                var a, l, t
                return {
                  label: (null == (a = e.identity) ? void 0 : a.name) || (null == (l = e.identity) ? void 0 : l.id),
                  value: (null == (t = e.identity) ? void 0 : t.id) || ''
                }
              })
            ]
          } catch (e) {
            re.value = [{ label: 'ALL', value: '' }]
          }
        },
        oe = (a) => {
          switch (a) {
            case e.TRACE:
              return '#6b7280'
            case e.DEBUG:
              return '#a21caf'
            case e.INFO:
              return '#15803d'
            case e.WARN:
              return '#ca8a04'
            case e.ERROR:
              return '#dc2626'
            case e.FATAL:
              return '#7f1d1d'
            default:
              return '#6b7280'
          }
        },
        ne = (a) => {
          switch (a) {
            case e.TRACE:
              return 'log-stream-page__segment log-stream-page__segment--trace'
            case e.DEBUG:
              return 'log-stream-page__segment log-stream-page__segment--debug'
            case e.INFO:
              return 'log-stream-page__segment log-stream-page__segment--info'
            case e.WARN:
              return 'log-stream-page__segment log-stream-page__segment--warn'
            case e.ERROR:
              return 'log-stream-page__segment log-stream-page__segment--error'
            case e.FATAL:
              return 'log-stream-page__segment log-stream-page__segment--fatal'
            default:
              return 'log-stream-page__segment'
          }
        },
        ie = () => {
          let e = [...I.value]
          if (
            (X.service && (e = e.filter((e) => e.service === X.service)),
            X.level && (e = e.filter((e) => e.level === X.level)),
            X.keyword)
          ) {
            const a = X.keyword.toLowerCase()
            e = e.filter((e) => e.message.toLowerCase().includes(a) || e.service.toLowerCase().includes(a))
          }
          X.originType && (e = e.filter((e) => !e.originType || e.originType === X.originType)), (N.value = e)
        },
        pe = () => {
          ;(s.value = !1), (o.value = !1)
        },
        ve = () => {
          fe.send({ type: 'unsubscribe', data: { channel: 'logs' } }), pe(), l.info('日志流已停止')
        },
        me = (e) => {
          ;(M.value = e === ue.CONNECTED),
            e === ue.CONNECTED && s.value && fe.send({ type: 'subscribe', data: { channel: 'logs' } })
        },
        _e = async () => {
          if (!s.value) {
            g.value = !0
            try {
              if (
                (ae(),
                await (async () => {
                  ae()
                  const e = await t.logs.searchLogsExplorer(
                      Te({
                        originType: Z.originType || X.originType,
                        service: Z.service || void 0,
                        levelFilter: Z.level || null,
                        keyword: Z.keywords || void 0,
                        page: 1,
                        pageSize: Math.min(D.value, 200)
                      })
                    ),
                    a = Array.isArray(null == e ? void 0 : e.items) ? [...e.items].reverse() : []
                  ;(I.value = a),
                    (() => {
                      ee.totalReceived = I.value.length
                      const e = I.value.reduce(
                        (e, a) => (e ? (new Date(a.timestamp).getTime() > new Date(e.timestamp).getTime() ? a : e) : a),
                        null
                      )
                      ee.lastReceiveTime = (null == e ? void 0 : e.timestamp) ? r(e.timestamp).format('HH:mm:ss') : ''
                    })(),
                    ie(),
                    await Q(),
                    u.value && H.value && (H.value.scrollTop = H.value.scrollHeight)
                })(),
                !(await (async (e = 8e3) => (
                  (M.value = M.value || fe.isConnected),
                  !!M.value ||
                    (await fe.ensureConnected(),
                    (M.value = M.value || fe.isConnected),
                    !!M.value ||
                      new Promise((a) => {
                        let l = !1
                        const t = (e) => {
                            l || ((l = !0), ye.off('wsConnectionStateChange', r), clearTimeout(s), a(e))
                          },
                          r = (e) => {
                            e === ue.CONNECTED && t(!0), (e !== ue.ERROR && e !== ue.DISCONNECTED) || t(!1)
                          },
                          s = setTimeout(() => t(M.value || fe.isConnected), e)
                        ye.on('wsConnectionStateChange', r)
                      }))
                ))()))
              )
                throw new Error('WebSocket 实时通道尚未连接')
              ;(s.value = !0),
                (ee.connectionTime = r().format('HH:mm:ss')),
                fe.send({ type: 'subscribe', data: { channel: 'logs' } }),
                l.success(I.value.length > 0 ? `日志流连接成功，已加载 ${I.value.length} 条最近日志` : '日志流连接成功')
            } catch (e) {
              l.error('启动日志流失败: ' + (e.message || '未知错误')), ee.errorCount++, pe()
            } finally {
              g.value = !1
            }
          }
        },
        he = () => {
          ;(o.value = !o.value), o.value ? l.info('日志流已暂停') : l.info('日志流已恢复')
        },
        be = () => {
          ;(I.value = []),
            (N.value = []),
            (ee.totalReceived = 0),
            (ee.linesPerSecond = 0),
            (ee.lastReceiveTime = ''),
            (ee.errorCount = 0),
            l.info('日志已清空')
        },
        we = async () => {
          if (0 === N.value.length) return void l.warning('没有日志可复制')
          const e = N.value
            .map((e) => Le(e, { showTimestamp: d.value, showLevel: b.value, showService: w.value }))
            .join('\n')
          try {
            await Re(e), l.success(`已复制 ${N.value.length} 条日志`)
          } catch {
            l.error('复制日志失败')
          }
        },
        xe = () => {
          0 !== N.value.length
            ? t.logs
                .exportLogs({
                  format: 'json',
                  query: X.keyword || void 0,
                  service: X.service || void 0,
                  originType: X.originType || void 0,
                  startTime: r().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
                  endTime: r().format('YYYY-MM-DD HH:mm:ss'),
                  limit: Math.min(N.value.length, 1e3)
                })
                .then((e) => {
                  var a
                  const t = null == e ? void 0 : e.exportData,
                    s =
                      (null == e ? void 0 : e.filename) ||
                      (null == (a = null == e ? void 0 : e.meta) ? void 0 : a.filename) ||
                      `logs-${r().format('YYYY-MM-DD-HH-mm-ss')}.json`
                  if (!t) return void l.error('日志导出失败: 后端未返回导出内容')
                  const o = new Blob([t], { type: 'application/json' }),
                    n = URL.createObjectURL(o),
                    i = document.createElement('a')
                  ;(i.href = n),
                    (i.download = s),
                    document.body.appendChild(i),
                    i.click(),
                    document.body.removeChild(i),
                    URL.revokeObjectURL(n),
                    l.success('日志导出成功')
                })
                .catch((e) => {
                  l.error('日志导出失败: ' + (e.message || '未知错误'))
                })
            : l.warning('没有日志可导出')
        },
        Se = async () => {
          ae(), ie(), await se(), s.value && (ve(), _e())
        },
        Ce = (e) => {
          if (!s.value || o.value) return
          if ('logs' !== (null == e ? void 0 : e.type)) return
          const a = e.data
          var l
          a &&
            ((e) => {
              if (Z.originType && e.originType && e.originType !== Z.originType) return !1
              if (Z.service && e.service !== Z.service) return !1
              if (Z.level && e.level !== Z.level) return !1
              if (Z.keywords) {
                const a = Z.keywords.toLowerCase()
                if (!`${e.message || ''} ${e.service || ''}`.toLowerCase().includes(a)) return !1
              }
              return !0
            })(a) &&
            ((l = a),
            I.value.push(l),
            I.value.length > D.value && (I.value = I.value.slice(-D.value)),
            (ee.totalReceived = I.value.length),
            (ee.lastReceiveTime = r().format('HH:mm:ss')),
            ie(),
            u.value &&
              !o.value &&
              Q(() => {
                H.value && (H.value.scrollTop = H.value.scrollHeight)
              }))
        }
      return (
        p(() => {
          se(),
            ie(),
            ye.on('wsConnectionStateChange', me),
            ye.on('wsRawMessage', Ce),
            (Y.value = setInterval(() => {
              ;(() => {
                const e = Date.now() - 1e3,
                  a = I.value.filter((a) => new Date(a.timestamp).getTime() > e)
                ee.linesPerSecond = a.length
              })()
            }, 1e3))
        }),
        v(() => {
          ye.off('wsConnectionStateChange', me),
            ye.off('wsRawMessage', Ce),
            fe.send({ type: 'unsubscribe', data: { channel: 'logs' } }),
            pe(),
            Y.value && (clearInterval(Y.value), (Y.value = null))
        }),
        () =>
          m('div', { class: 'log-stream-page' }, [
            m(ce, { title: '日志流', subtitle: '实时查看和监控系统日志' }, null),
            m('div', { class: 'log-stream-page__body' }, [
              m(
                T,
                { bordered: !1, class: 'log-stream-page__card log-stream-page__card--controls' },
                {
                  default: () => [
                    m(
                      z,
                      { justify: 'space-between', align: 'center' },
                      {
                        default: () => [
                          m(z, null, {
                            default: () => [
                              s.value
                                ? m(z, null, {
                                    default: () => [
                                      m(
                                        _,
                                        { type: o.value ? 'primary' : 'default', onClick: he },
                                        {
                                          default: () => [
                                            m(f, { component: o.value ? h : j, class: 'mr-1' }, null),
                                            o.value ? '恢复' : '暂停'
                                          ]
                                        }
                                      ),
                                      m(
                                        _,
                                        { onClick: () => ve() },
                                        { default: () => [m(f, { component: y, class: 'mr-1' }, null), S('停止')] }
                                      )
                                    ]
                                  })
                                : m(
                                    _,
                                    { type: 'primary', onClick: _e, loading: g.value },
                                    { default: () => [m(f, { component: h, class: 'mr-1' }, null), S('开始流')] }
                                  ),
                              m(
                                _,
                                { onClick: be },
                                { default: () => [m(f, { component: F, class: 'mr-1' }, null), S('清空')] }
                              ),
                              m(
                                _,
                                { onClick: xe },
                                { default: () => [m(f, { component: U, class: 'mr-1' }, null), S('导出')] }
                              ),
                              m(_, { onClick: we }, { default: () => [S('复制日志')] })
                            ]
                          }),
                          m(z, null, {
                            default: () => [
                              m(
                                O,
                                { trigger: 'hover' },
                                {
                                  trigger: () =>
                                    m(
                                      _,
                                      { size: 'small', onClick: () => (u.value = !u.value) },
                                      { default: () => [m(f, { component: u.value ? $ : B }, null)] }
                                    ),
                                  default: () => (u.value ? '关闭自动滚动' : '开启自动滚动')
                                }
                              ),
                              m(
                                O,
                                { trigger: 'hover' },
                                {
                                  trigger: () =>
                                    m(_, { size: 'small' }, { default: () => [m(f, { component: G }, null)] }),
                                  default: () => '流设置'
                                }
                              )
                            ]
                          })
                        ]
                      }
                    )
                  ]
                }
              ),
              m(
                T,
                { bordered: !1, class: 'log-stream-page__card log-stream-page__card--stats' },
                {
                  default: () => [
                    m('div', { class: 'log-stream-page__stats-header' }, [
                      m('div', null, [
                        m('div', { class: 'log-stream-page__section-title' }, [S('流状态')]),
                        m('div', { class: 'log-stream-page__section-subtitle' }, [
                          S('通过 WebSocket 订阅实时日志，并用最近日志预加载上下文')
                        ])
                      ]),
                      m('div', { class: 'log-stream-page__status-cluster' }, [
                        m(
                          'span',
                          {
                            class: 'log-stream-page__status-dot',
                            'data-tone': s.value && !o.value ? 'success' : o.value ? 'warning' : 'default'
                          },
                          null
                        ),
                        m('span', { class: 'log-stream-page__status-label' }, [
                          s.value && !o.value ? '实时接收中' : o.value ? '已暂停' : '未连接'
                        ])
                      ])
                    ]),
                    m(
                      L,
                      { cols: 5, xGap: 16 },
                      {
                        default: () => [
                          m(R, null, { default: () => [m(x, { label: '接收总数', value: ee.totalReceived }, null)] }),
                          m(R, null, { default: () => [m(x, { label: '每秒日志', value: ee.linesPerSecond }, null)] }),
                          m(R, null, { default: () => [m(x, { label: '错误数', value: ee.errorCount }, null)] }),
                          m(R, null, {
                            default: () => [m(x, { label: '连接时间', value: ee.connectionTime || '-' }, null)]
                          }),
                          m(R, null, {
                            default: () => [m(x, { label: '最后接收', value: ee.lastReceiveTime || '-' }, null)]
                          })
                        ]
                      }
                    )
                  ]
                }
              ),
              m(
                T,
                { bordered: !1, class: 'log-stream-page__card log-stream-page__card--filters' },
                {
                  default: () => [
                    m('div', { class: 'log-stream-page__filters-shell' }, [
                      m('div', { class: 'log-stream-page__filters-header' }, [
                        m('div', { class: 'log-stream-page__filters-title' }, [
                          m(f, { component: E }, null),
                          m('span', { class: 'log-stream-page__section-label' }, [S('实时过滤器')])
                        ]),
                        m('span', { class: 'log-stream-page__hint' }, [
                          S('显示 '),
                          N.value.length,
                          S(' / '),
                          I.value.length,
                          S(' 条日志')
                        ])
                      ]),
                      m('div', { class: 'log-stream-page__filters-grid' }, [
                        m(
                          k,
                          {
                            value: X.originType,
                            'onUpdate:value': (e) => (X.originType = e),
                            options: le,
                            placeholder: '日志来源',
                            onUpdateValue: Se
                          },
                          null
                        ),
                        m(
                          k,
                          {
                            value: X.service,
                            'onUpdate:value': (e) => (X.service = e),
                            options: re.value,
                            placeholder: A && 'darwin-app' === X.originType ? '选择系统服务' : '选择服务',
                            clearable: !0,
                            onUpdateValue: Se
                          },
                          null
                        ),
                        m(
                          k,
                          {
                            value: X.level,
                            'onUpdate:value': (e) => (X.level = e),
                            options: te,
                            placeholder: '选择级别',
                            clearable: !0,
                            onUpdateValue: Se
                          },
                          null
                        ),
                        m(
                          C,
                          {
                            value: X.keyword,
                            'onUpdate:value': (e) => (X.keyword = e),
                            placeholder: '关键词搜索',
                            clearable: !0,
                            onUpdateValue: Se
                          },
                          null
                        )
                      ])
                    ])
                  ]
                }
              ),
              m(
                T,
                { bordered: !1, class: 'log-stream-page__card log-stream-page__card--terminal' },
                {
                  default: () => [
                    m('div', { class: 'log-stream-page__terminal-header' }, [
                      m('h3', { class: 'log-stream-page__terminal-title' }, [S('实时日志')]),
                      m(z, null, {
                        default: () => [
                          m('span', { class: 'log-stream-page__hint' }, [S('显示选项:')]),
                          m(
                            z,
                            { size: 'small' },
                            {
                              default: () => [
                                m('span', { class: 'log-stream-page__toggle-label' }, [S('时间戳')]),
                                m(q, { value: d.value, 'onUpdate:value': (e) => (d.value = e), size: 'small' }, null)
                              ]
                            }
                          ),
                          m(
                            z,
                            { size: 'small' },
                            {
                              default: () => [
                                m('span', { class: 'log-stream-page__toggle-label' }, [S('级别')]),
                                m(q, { value: b.value, 'onUpdate:value': (e) => (b.value = e), size: 'small' }, null)
                              ]
                            }
                          ),
                          m(
                            z,
                            { size: 'small' },
                            {
                              default: () => [
                                m('span', { class: 'log-stream-page__toggle-label' }, [S('服务')]),
                                m(q, { value: w.value, 'onUpdate:value': (e) => (w.value = e), size: 'small' }, null)
                              ]
                            }
                          )
                        ]
                      })
                    ]),
                    s.value &&
                      m(
                        P,
                        { type: 'info', class: 'log-stream-page__stream-alert' },
                        {
                          default: () => [
                            m('div', { class: 'log-stream-page__stream-alert-content' }, [
                              m('span', null, [o.value ? '日志流已暂停' : '正在通过 WebSocket 接收实时日志...']),
                              W(m(J, { size: 'small' }, null), [[V, !o.value]])
                            ])
                          ]
                        }
                      ),
                    m('div', { ref: H, class: 'log-stream-page__terminal' }, [
                      N.value.length > 0
                        ? m('div', { class: 'log-stream-page__terminal-list' }, [
                            N.value.map((e, a) =>
                              m('div', { key: a, class: 'log-stream-page__line' }, [
                                d.value &&
                                  m('span', { class: 'log-stream-page__segment log-stream-page__segment--timestamp' }, [
                                    S('['),
                                    r(e.timestamp).format('HH:mm:ss.SSS'),
                                    S(']')
                                  ]),
                                b.value &&
                                  m('span', { class: ne(e.level), style: { color: oe(e.level) } }, [
                                    S('['),
                                    e.level,
                                    S(']')
                                  ]),
                                w.value &&
                                  m('span', { class: 'log-stream-page__segment log-stream-page__segment--service' }, [
                                    S('['),
                                    e.service,
                                    S(']')
                                  ]),
                                e.originType &&
                                  m('span', { class: 'log-stream-page__segment log-stream-page__segment--origin' }, [
                                    S('['),
                                    e.originType,
                                    S(']')
                                  ]),
                                m('span', { class: 'log-stream-page__message' }, [e.message])
                              ])
                            )
                          ])
                        : m('div', { class: 'flex items-center justify-center h-full' }, [
                            m(K, { description: '暂无日志数据' }, null)
                          ])
                    ])
                  ]
                }
              )
            ])
          ])
      )
    }
  })
function De(e) {
  return 'function' == typeof e || ('[object Object]' === Object.prototype.toString.call(e) && !M(e))
}
const Ae = o({
  name: 'LogCenterPage',
  components: { LogService: Se, ExceptionAnalysisContent: me, LogIngest: Ce, LogStreamContent: ke },
  setup() {
    var a
    const l = n(),
      s = c(!1),
      o = c(!1),
      g = c(!1),
      d = c(null),
      y = c('overview'),
      h = c(null),
      E = c(null),
      H = c(1),
      U = c(!1),
      I = c(!1),
      N = c('info-and-above'),
      O = c(''),
      z = Boolean(null == (a = ge()) ? void 0 : a.isAdmin),
      M = c(z ? 'darwin-app' : 'microservice'),
      j = [
        { label: 'INFO 及以上', value: 'info-and-above' },
        { label: 'TRACE', value: e.TRACE },
        { label: 'DEBUG', value: e.DEBUG },
        { label: 'INFO', value: e.INFO },
        { label: 'WARN', value: e.WARN },
        { label: 'ERROR', value: e.ERROR },
        { label: 'FATAL', value: e.FATAL }
      ],
      F = [
        ...(z ? [{ label: 'Darwin 服务日志', value: 'darwin-app' }] : []),
        { label: '用户微服务日志', value: 'microservice' }
      ],
      $ = i({
        totalLogs: 0,
        todayLogs: 0,
        errorRate: 0,
        topServices: [],
        levelDistribution: [],
        recentLogs: [],
        recentLogsTotal: 0,
        recentLogsScopeLabel: '最近日志',
        systemHealth: { status: 'healthy', uptime: '99.9%', lastUpdate: '' }
      }),
      B = [
        {
          title: '日志搜索',
          description: '搜索和查看日志',
          icon: D,
          color: 'var(--color-primary-6)',
          action: () => (y.value = 'service')
        },
        {
          title: '异常分析',
          description: '分析异常和错误',
          icon: ae,
          color: 'var(--color-danger-6)',
          action: () => (y.value = 'exception')
        },
        {
          title: '日志摄取',
          description: '上传和摄取日志',
          icon: le,
          color: 'var(--color-success-6)',
          action: () => (y.value = 'ingest')
        },
        {
          title: '实时流',
          description: '查看实时日志流',
          icon: te,
          color: 'var(--color-warning-6)',
          action: () => (y.value = 'stream')
        }
      ],
      G = (e) => {
        switch (e) {
          case 'success':
          case 'healthy':
            return 'var(--color-success-6)'
          case 'warning':
            return 'var(--color-warning-6)'
          case 'error':
            return 'var(--color-danger-6)'
          default:
            return 'var(--color-text-3)'
        }
      },
      W = (a) => {
        switch (a) {
          case e.TRACE:
            return 'log-center-page__level-tone log-center-page__level-tone--trace'
          case e.DEBUG:
            return 'log-center-page__level-tone log-center-page__level-tone--debug'
          case e.INFO:
            return 'log-center-page__level-tone log-center-page__level-tone--info'
          case e.WARN:
            return 'log-center-page__level-tone log-center-page__level-tone--warn'
          case e.ERROR:
            return 'log-center-page__level-tone log-center-page__level-tone--error'
          case e.FATAL:
            return 'log-center-page__level-tone log-center-page__level-tone--fatal'
          default:
            return 'log-center-page__level-tone'
        }
      },
      V = (a) => {
        switch (a) {
          case e.TRACE:
            return '#6b7280'
          case e.DEBUG:
            return '#a21caf'
          case e.INFO:
            return '#15803d'
          case e.WARN:
            return '#ca8a04'
          case e.ERROR:
            return '#dc2626'
          case e.FATAL:
            return '#7f1d1d'
          default:
            return '#6b7280'
        }
      },
      J = (a) => {
        switch (a) {
          case e.TRACE:
            return { backgroundColor: '#f3f4f6', color: '#6b7280' }
          case e.DEBUG:
            return { backgroundColor: '#f5e8ff', color: '#a21caf' }
          case e.INFO:
            return { backgroundColor: '#dcfce7', color: '#15803d' }
          case e.WARN:
            return { backgroundColor: '#fef3c7', color: '#ca8a04' }
          case e.ERROR:
            return { backgroundColor: '#fee2e2', color: '#dc2626' }
          case e.FATAL:
            return { backgroundColor: '#7f1d1d', color: '#ffffff' }
          default:
            return { backgroundColor: '#f3f4f6', color: '#6b7280' }
        }
      },
      ue = (e) => {
        if (e instanceof Date) {
          const a = e.getTime()
          return Number.isFinite(a) ? a : 0
        }
        if ('number' == typeof e) return Number.isFinite(e) ? e : 0
        if ('string' != typeof e || !e.trim()) return 0
        const a = e.trim(),
          l = Number(a)
        if (Number.isFinite(l)) return l
        const t = a.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2}):(\d{1,3})$/)
        if (t) {
          const [, e, a, l, r, s, o, n] = t
          return new Date(
            Number(e),
            Number(a) - 1,
            Number(l),
            Number(r),
            Number(s),
            Number(o),
            Number(n.padEnd(3, '0'))
          ).getTime()
        }
        const r = a
            .replace(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/, '$1-$2-$3')
            .replace(/(\d{2}:\d{2}:\d{2}):(\d{1,3})$/, '$1.$2'),
          s = new Date(r).getTime()
        return Number.isFinite(s) ? s : 0
      },
      pe = (e) => {
        const a = e,
          l = [a.timestamp, a['@timestamp'], a.receivedAt, a.createdAt, a.updatedAt, a.time, a.datetime, a.date]
        for (const t of l) {
          const e = ue(t)
          if (e > 0) return e
        }
        return 0
      },
      de = (e) => [...e].sort((e, a) => pe(a) - pe(e)),
      ve = (e) => String(e.id || e.key || `${e.timestamp}-${e.service}-${e.message}`),
      _e = async (e = 1) => {
        var a
        const l = Te({ page: e, pageSize: 200, originType: M.value, levelFilter: N.value }),
          r = await t.logs.searchLogsExplorer({ ...l }),
          s = Array.isArray(null == r ? void 0 : r.items) ? r.items : []
        return {
          response: r,
          items: s,
          total: Number(
            (null == (a = null == r ? void 0 : r.pagination) ? void 0 : a.total) ||
              (null == r ? void 0 : r.total) ||
              s.length ||
              0
          )
        }
      },
      fe = (e, a, l, t = !1) => {
        ;($.recentLogs = t
          ? ((e, a) => {
              const l = new Set(),
                t = []
              for (const r of [...e, ...a]) {
                const e = ve(r)
                l.has(e) || (l.add(e), t.push(r))
              }
              return de(t)
            })($.recentLogs, e)
          : de(e)),
          ($.recentLogsTotal = a),
          (H.value = l),
          (I.value = $.recentLogs.length < a)
      },
      ye = (e) => {
        const a = e.currentTarget
        a &&
          a.scrollHeight - a.scrollTop - a.clientHeight <= 80 &&
          (async () => {
            if (!U.value && I.value) {
              U.value = !0
              try {
                const e = H.value + 1,
                  a = await _e(e)
                fe(a.items, a.total, e, !0)
              } catch (e) {
              } finally {
                U.value = !1
              }
            }
          })()
      },
      he = async () => {
        const e = await _e(1)
        fe(e.items, e.total, 1), await Q(), E.value && (E.value.scrollTop = 0)
      },
      be = async () => {
        s.value = !0
        try {
          const e = r().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
            a = r().endOf('day').format('YYYY-MM-DD HH:mm:ss'),
            l = await t.logs.getLogExplorerStats({ startTime: e, endTime: a, groupBy: 'level', originType: M.value }),
            s = Number((null == l ? void 0 : l.totalLogs) || 0)
          if (
            (($.totalLogs = s),
            ($.todayLogs = s),
            ($.errorRate =
              'number' == typeof (null == l ? void 0 : l.errorRate)
                ? l.errorRate
                : (null == l ? void 0 : l.errorLogs)
                  ? (l.errorLogs / Math.max(l.totalLogs || 1, 1)) * 100
                  : 0),
            Array.isArray(null == l ? void 0 : l.topServices) && l.topServices.length > 0)
          )
            $.topServices = l.topServices.slice(0, 5).map((e) => {
              const a = Number(e.count ?? e.logCount ?? 0)
              return {
                service: e.service,
                count: a,
                percentage: s > 0 ? (a / s) * 100 : 0,
                errorRate: Number(e.errorRate ?? 0)
              }
            })
          else {
            const e = Object.entries((null == l ? void 0 : l.serviceStats) || {})
            $.topServices = e
              .slice(0, 5)
              .map(([e, a]) => ({ service: e, count: a, percentage: s > 0 ? (a / s) * 100 : 0, errorRate: 0 }))
          }
          const o = Object.entries((null == l ? void 0 : l.levelStats) || {})
          ;($.levelDistribution = o.map(([e, a]) => ({ level: e, count: a, percentage: s > 0 ? (a / s) * 100 : 0 }))),
            ($.recentLogsScopeLabel = 'darwin-app' === M.value ? '最近日志 · Darwin 服务' : '最近日志 · 用户微服务'),
            await he(),
            ($.systemHealth.lastUpdate = r().format('YYYY-MM-DD HH:mm:ss')),
            $.errorRate < 1
              ? ($.systemHealth.status = 'healthy')
              : $.errorRate < 5
                ? ($.systemHealth.status = 'warning')
                : ($.systemHealth.status = 'error')
        } catch (e) {
          ;($.systemHealth.status = 'error'), ($.systemHealth.lastUpdate = r().format('YYYY-MM-DD HH:mm:ss'))
        } finally {
          s.value = !1
        }
      },
      we = () => {
        be()
      },
      xe = async (e) => {
        o.value = !0
        try {
          const a = await t.logs.setDebugDiagnosticsState({
            enabled: e,
            durationMs: 6e5,
            reason: e ? 'client enabled from log center' : 'client disabled from log center'
          })
          ;(g.value = Boolean(null == a ? void 0 : a.enabled)),
            (d.value = (null == a ? void 0 : a.expiresAt) || null),
            l.success(e ? '已临时开启调试日志收集，10 分钟后自动关闭' : '已关闭调试日志收集')
        } catch (a) {
          l.error('调试日志开关更新失败')
        } finally {
          o.value = !1
        }
      },
      Ae = u(() => ($.errorRate < 1 ? 'success' : $.errorRate < 5 ? 'warning' : 'error')),
      Ee = u(() => {
        const e = O.value.trim().toLowerCase()
        return $.recentLogs.filter((a) => {
          return (
            !e ||
            ((l = a),
            [
              l.level,
              l.message,
              l.service,
              l.hostname,
              l.containerId,
              l.source,
              l.originType,
              l.requestId,
              l.userId,
              l.nodeID,
              l.namespace,
              l.mod,
              l.svc,
              l.thread,
              l.logger,
              l.stackTrace,
              l.stack,
              l.tags ? JSON.stringify(l.tags) : '',
              l.fields ? JSON.stringify(l.fields) : ''
            ]
              .filter((e) => 'string' == typeof e)
              .join(' ')
              .toLowerCase()).includes(e)
          )
          var l
        })
      }),
      He = u(() => Boolean(N.value || O.value.trim())),
      Ue = async () => {
        if (0 === Ee.value.length) return void l.warning('没有日志可复制')
        const e = Ee.value.map((e) => Le(e)).join('\n')
        try {
          await Re(e), l.success(`已复制 ${Ee.value.length} 条日志`)
        } catch {
          l.error('复制日志失败')
        }
      }
    return (
      p(() => {
        be(),
          (async () => {
            o.value = !0
            try {
              const e = await t.logs.getDebugDiagnosticsState()
              ;(g.value = Boolean(null == e ? void 0 : e.enabled)),
                (d.value = (null == e ? void 0 : e.expiresAt) || null)
            } catch (e) {
              l.warning('调试日志开关状态获取失败，请稍后重试')
            } finally {
              o.value = !1
            }
          })(),
          (h.value = setInterval(() => {
            be()
          }, 3e4))
      }),
      v(() => {
        h.value && (clearInterval(h.value), (h.value = null))
      }),
      () => {
        let e
        return m('div', { class: 'log-center-page' }, [
          m(
            Z,
            {
              value: y.value,
              'onUpdate:value': (e) => (y.value = e),
              type: 'line',
              size: 'large',
              animated: !0,
              class: 'log-center-page__tabs'
            },
            {
              default: () => [
                m(
                  X,
                  { name: 'overview', tab: '概览' },
                  {
                    default: () => [
                      m('div', { class: 'log-center-page__overview' }, [
                        m(
                          ce,
                          { title: '日志中心', subtitle: '统一检索、分析和追踪服务日志，快速定位异常上下文' },
                          {
                            actions: () =>
                              m(ee, null, [
                                m(
                                  'div',
                                  {
                                    class: [
                                      'log-center-page__debug-switch',
                                      g.value ? 'log-center-page__debug-switch--enabled' : ''
                                    ]
                                  },
                                  [
                                    m('div', { class: 'log-center-page__debug-switch-copy' }, [
                                      m('span', { class: 'log-center-page__debug-switch-title' }, [S('调试日志收集')])
                                    ]),
                                    m(
                                      q,
                                      { value: g.value, loading: o.value, disabled: o.value, onUpdateValue: xe },
                                      null
                                    )
                                  ]
                                ),
                                m(
                                  _,
                                  {
                                    onClick: we,
                                    loading: s.value,
                                    type: 'primary',
                                    secondary: !0,
                                    class: 'log-center-page__refresh-btn'
                                  },
                                  { default: () => [m(f, { component: A, class: 'mr-1' }, null), S('刷新')] }
                                )
                              ])
                          }
                        ),
                        m(
                          P,
                          { type: g.value ? 'warning' : 'info', showIcon: !0, class: 'log-center-page__debug-alert' },
                          {
                            default: () => [
                              g.value
                                ? '调试日志收集已临时开启。期间客户端会打印并上报 DEBUG 级别诊断日志，服务端会在到期后自动恢复关闭。'
                                : '调试日志默认关闭。排查问题时可在右上角临时开启，避免日常运行产生大量 debug 噪音。'
                            ]
                          }
                        ),
                        m(
                          P,
                          {
                            type:
                              'healthy' === $.systemHealth.status
                                ? 'success'
                                : 'warning' === $.systemHealth.status
                                  ? 'warning'
                                  : 'error',
                            showIcon: !0,
                            class: 'log-center-page__health-alert'
                          },
                          {
                            default: () => [
                              m('div', { class: 'log-center-page__health-content' }, [
                                m('span', { class: 'log-center-page__health-title' }, [
                                  S('系统状态:'),
                                  ' ',
                                  'healthy' === $.systemHealth.status
                                    ? '健康'
                                    : 'warning' === $.systemHealth.status
                                      ? '警告'
                                      : '错误'
                                ]),
                                m('span', { class: 'log-center-page__health-time' }, [
                                  S('最后更新: '),
                                  $.systemHealth.lastUpdate
                                ])
                              ])
                            ]
                          }
                        ),
                        m(
                          T,
                          {
                            title: '核心指标',
                            bordered: !1,
                            class: 'log-center-page__card log-center-page__card--primary'
                          },
                          {
                            default: () => [
                              m(
                                L,
                                { cols: 3, xGap: 16 },
                                {
                                  default: () => [
                                    m(R, null, {
                                      default: () => [
                                        m(
                                          x,
                                          { label: '总日志数', value: $.totalLogs.toLocaleString() },
                                          {
                                            prefix: () => Y(f, { component: ne, color: 'var(--color-primary-6)' }),
                                            default: () =>
                                              m('span', { class: 'log-center-page__stat-value' }, [
                                                $.totalLogs.toLocaleString()
                                              ])
                                          }
                                        )
                                      ]
                                    }),
                                    m(R, null, {
                                      default: () => [
                                        m(
                                          x,
                                          { label: '今日日志', value: $.todayLogs.toLocaleString() },
                                          {
                                            prefix: () => Y(f, { component: b, color: 'var(--color-success-6)' }),
                                            default: () =>
                                              m('span', { class: 'log-center-page__stat-value' }, [
                                                $.todayLogs.toLocaleString()
                                              ])
                                          }
                                        )
                                      ]
                                    }),
                                    m(R, null, {
                                      default: () => [
                                        m(
                                          x,
                                          { label: '错误率', value: `${$.errorRate.toFixed(2)}%` },
                                          {
                                            prefix: () => Y(f, { component: ie, color: G(Ae.value) }),
                                            default: () =>
                                              m(
                                                'span',
                                                {
                                                  class:
                                                    'log-center-page__stat-value ' +
                                                    ($.errorRate > 0
                                                      ? 'log-center-page__stat-value--danger'
                                                      : 'log-center-page__stat-value--success')
                                                },
                                                [$.errorRate.toFixed(2), S('%')]
                                              )
                                          }
                                        )
                                      ]
                                    })
                                  ]
                                }
                              )
                            ]
                          }
                        ),
                        m(
                          T,
                          { title: '快捷操作', bordered: !1, class: 'log-center-page__card' },
                          {
                            default: () => [
                              m(
                                L,
                                { cols: 5, xGap: 16, yGap: 16 },
                                De(
                                  (e = B.map((e, a) =>
                                    m(
                                      R,
                                      { key: a },
                                      {
                                        default: () => [
                                          m('div', { class: 'log-center-page__quick-action', onClick: e.action }, [
                                            m('div', { class: 'log-center-page__quick-action-content' }, [
                                              m(
                                                'div',
                                                {
                                                  class: 'log-center-page__quick-action-icon',
                                                  style: { '--log-action-color': e.color }
                                                },
                                                [m(f, { component: e.icon, size: 24, color: e.color }, null)]
                                              ),
                                              m('h4', { class: 'log-center-page__quick-action-title' }, [e.title]),
                                              m('p', { class: 'log-center-page__quick-action-desc' }, [e.description])
                                            ])
                                          ])
                                        ]
                                      }
                                    )
                                  ))
                                )
                                  ? e
                                  : { default: () => [e] }
                              )
                            ]
                          }
                        ),
                        m(
                          L,
                          { cols: 2, xGap: 16, class: 'log-center-page__split-grid' },
                          {
                            default: () => [
                              m(R, null, {
                                default: () => [
                                  m(
                                    T,
                                    {
                                      title: 'Top 5 服务 · 日志量与错误率',
                                      bordered: !1,
                                      class: 'log-center-page__card log-center-page__card--stretch'
                                    },
                                    {
                                      default: () => [
                                        $.topServices.length > 0
                                          ? m('div', { class: 'log-center-page__list' }, [
                                              $.topServices.map((e, a) =>
                                                m('div', { key: a, class: 'log-center-page__list-item' }, [
                                                  m('div', { class: 'log-center-page__list-item-main' }, [
                                                    m('div', { class: 'log-center-page__list-badge' }, [
                                                      m(
                                                        f,
                                                        { component: re, size: 16, color: 'var(--color-primary-6)' },
                                                        null
                                                      )
                                                    ]),
                                                    m('span', { class: 'log-center-page__list-title' }, [e.service])
                                                  ]),
                                                  m('div', { class: 'log-center-page__list-item-meta' }, [
                                                    m('span', { class: 'log-center-page__service-metric' }, [
                                                      m('span', { class: 'log-center-page__metric-label' }, [
                                                        S('日志数')
                                                      ]),
                                                      m('span', { class: 'log-center-page__mono' }, [
                                                        e.count.toLocaleString()
                                                      ])
                                                    ]),
                                                    m(
                                                      'span',
                                                      {
                                                        class: [
                                                          'log-center-page__service-metric',
                                                          e.errorRate > 0
                                                            ? 'log-center-page__service-metric--danger'
                                                            : ''
                                                        ]
                                                      },
                                                      [
                                                        m('span', { class: 'log-center-page__metric-label' }, [
                                                          S('错误率')
                                                        ]),
                                                        m('span', { class: 'log-center-page__mono' }, [
                                                          e.errorRate.toFixed(2),
                                                          S('%')
                                                        ])
                                                      ]
                                                    ),
                                                    m(
                                                      'div',
                                                      {
                                                        class: 'log-center-page__progress-slot',
                                                        title: `日志占比 ${e.percentage.toFixed(1)}%`
                                                      },
                                                      [
                                                        m(
                                                          se,
                                                          {
                                                            type: 'line',
                                                            percentage: e.percentage,
                                                            showIndicator: !1,
                                                            height: 6,
                                                            color: 'var(--color-primary-6)'
                                                          },
                                                          null
                                                        )
                                                      ]
                                                    ),
                                                    m('span', { class: 'log-center-page__meta-text' }, [
                                                      S('占比 '),
                                                      e.percentage.toFixed(1),
                                                      S('%')
                                                    ])
                                                  ])
                                                ])
                                              )
                                            ])
                                          : m(K, { description: '暂无数据' }, null)
                                      ]
                                    }
                                  )
                                ]
                              }),
                              m(R, null, {
                                default: () => [
                                  m(
                                    T,
                                    {
                                      title: '日志级别分布',
                                      bordered: !1,
                                      class: 'log-center-page__card log-center-page__card--stretch'
                                    },
                                    {
                                      default: () => [
                                        $.levelDistribution.length > 0
                                          ? m('div', { class: 'log-center-page__list' }, [
                                              $.levelDistribution.map((e, a) =>
                                                m('div', { key: a, class: 'log-center-page__list-item' }, [
                                                  m('div', { class: 'log-center-page__list-item-main' }, [
                                                    m(
                                                      'div',
                                                      {
                                                        class: `log-center-page__level-dot ${W(e.level)}`,
                                                        style: { backgroundColor: V(e.level) }
                                                      },
                                                      null
                                                    ),
                                                    m('span', { class: 'log-center-page__list-title' }, [
                                                      e.level.toUpperCase()
                                                    ])
                                                  ]),
                                                  m('div', { class: 'log-center-page__list-item-meta' }, [
                                                    m('span', { class: 'log-center-page__mono' }, [
                                                      e.count.toLocaleString()
                                                    ]),
                                                    m('div', { class: 'log-center-page__progress-slot' }, [
                                                      m(
                                                        se,
                                                        {
                                                          type: 'line',
                                                          percentage: e.percentage,
                                                          showIndicator: !1,
                                                          height: 6,
                                                          color: V(e.level)
                                                        },
                                                        null
                                                      )
                                                    ]),
                                                    m('span', { class: 'log-center-page__meta-text' }, [
                                                      e.percentage.toFixed(1),
                                                      S('%')
                                                    ])
                                                  ])
                                                ])
                                              )
                                            ])
                                          : m(K, { description: '暂无数据' }, null)
                                      ]
                                    }
                                  )
                                ]
                              })
                            ]
                          }
                        ),
                        m(
                          T,
                          { bordered: !1, class: 'log-center-page__card log-center-page__card--recent' },
                          {
                            header: () =>
                              m('div', { class: 'log-center-page__card-title-row' }, [
                                m('span', null, [$.recentLogsScopeLabel]),
                                m('span', { class: 'log-center-page__card-meta' }, [
                                  S('共 '),
                                  $.totalLogs.toLocaleString(),
                                  S(' 条')
                                ])
                              ]),
                            default: () =>
                              m(ee, null, [
                                m('div', { class: 'log-center-page__recent-toolbar' }, [
                                  z
                                    ? m(
                                        k,
                                        {
                                          value: M.value,
                                          options: F,
                                          class: 'log-center-page__recent-origin-filter',
                                          onUpdateValue: (e) => {
                                            ;(M.value = e), be()
                                          }
                                        },
                                        null
                                      )
                                    : null,
                                  m(
                                    k,
                                    {
                                      value: N.value,
                                      options: j,
                                      placeholder: '全部级别',
                                      clearable: !0,
                                      class: 'log-center-page__recent-level-filter',
                                      onUpdateValue: (e) => {
                                        ;(N.value = e), he()
                                      }
                                    },
                                    null
                                  ),
                                  m(
                                    C,
                                    {
                                      value: O.value,
                                      placeholder: '搜索消息、服务、主机、标签',
                                      clearable: !0,
                                      class: 'log-center-page__recent-search',
                                      onUpdateValue: (e) => {
                                        O.value = e
                                      }
                                    },
                                    null
                                  ),
                                  m(_, { secondary: !0, onClick: Ue }, { default: () => [S('复制日志')] })
                                ]),
                                Ee.value.length > 0
                                  ? m('div', { ref: E, class: 'log-center-page__recent-list', onScroll: ye }, [
                                      Ee.value.map((e, a) => {
                                        let l
                                        return m(
                                          'div',
                                          {
                                            key: e.id || e.key || `${e.timestamp}-${a}`,
                                            class: 'log-center-page__recent-item'
                                          },
                                          [
                                            m('div', { class: 'log-center-page__recent-rail' }, [
                                              m(
                                                w,
                                                {
                                                  size: 'small',
                                                  bordered: !1,
                                                  class: ['log-center-page__level-tag', W(e.level)],
                                                  style: J(e.level)
                                                },
                                                De((l = e.level.toUpperCase())) ? l : { default: () => [l] }
                                              ),
                                              m('span', { class: 'log-center-page__service-chip' }, [
                                                e.service || 'unknown-service'
                                              ])
                                            ]),
                                            m('div', { class: 'log-center-page__recent-content' }, [
                                              m('div', { class: 'log-center-page__recent-line' }, [
                                                m('div', { class: 'log-center-page__recent-message' }, [e.message]),
                                                m('span', { class: 'log-center-page__recent-time' }, [
                                                  m(oe, { time: new Date(e.timestamp), type: 'datetime' }, null)
                                                ])
                                              ])
                                            ])
                                          ]
                                        )
                                      }),
                                      m('div', { class: 'log-center-page__recent-load-state' }, [
                                        U.value
                                          ? '正在加载更多日志…'
                                          : I.value
                                            ? '向下滚动加载更多'
                                            : '已加载全部最近日志'
                                      ])
                                    ])
                                  : m(K, { description: He.value ? '没有匹配的最近日志' : '暂无最近日志' }, null)
                              ])
                          }
                        )
                      ])
                    ]
                  }
                ),
                m(X, { name: 'service', tab: '日志搜索' }, { default: () => [m(Se, null, null)] }),
                m(X, { name: 'exception', tab: '异常分析' }, { default: () => [m(me, null, null)] }),
                m(X, { name: 'ingest', tab: '日志摄取' }, { default: () => [m(Ce, null, null)] }),
                m(X, { name: 'stream', tab: '实时流' }, { default: () => [m(ke, null, null)] })
              ]
            }
          )
        ])
      }
    )
  }
})
export { Ae as default }
