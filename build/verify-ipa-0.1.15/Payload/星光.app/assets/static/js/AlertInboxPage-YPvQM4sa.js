import {
  p as e,
  r as a,
  a1 as l,
  a0 as s,
  a3 as t,
  ba as i,
  a2 as n,
  w as r,
  ab as u,
  cz as o,
  ag as v,
  ac as d,
  cM as c,
  cN as p,
  am as g,
  ci as y,
  a6 as b,
  $ as m,
  al as _,
  cF as f,
  cG as x,
  co as h,
  cp as w,
  j as I,
  aR as k,
  ai as U
} from './invariable-DewVS0br.js'
import { c as T, f as j, a as q, r as z, b as R, s as C } from './alerts-CIHfuoAx.js'
import { f as P } from './metrics-uVJcD6zf.js'
import { P as N } from './PageHeader-OtleDOO-.js'
import { R as S } from './ResultTable-B_9U75PU.js'
import { D as L } from './DetailDrawer-C1HE8GcD.js'
import { T as D } from './TimeRangeBar-EdVcwx6f.js'
import { u as O } from './useTimeStore-CVw7RN2Q.js'
import { d as G } from './index-DFkcx8xz.js'
import './request-BiInMBwl.js'
const H = (e) => {
    if (!e) return '-'
    const a = new Date(e)
    return Number.isNaN(a.getTime()) ? e : a.toLocaleString('zh-CN', { hour12: !1 })
  },
  $ = e({
    name: 'AlertInboxPage',
    setup() {
      const e = i(),
        $ = m(),
        A = O(),
        B = a(),
        F = l(() => G()),
        K = s(''),
        M = s(''),
        X = s(''),
        E = s(''),
        J = s(''),
        Q = s(!1),
        V = s([]),
        W = s(null),
        Y = s(!1),
        Z = s([{ label: '全部服务', value: '' }]),
        ee = s([{ label: '全部处理人', value: '' }]),
        ae = s(''),
        le = s(!1),
        se = s(null),
        te = s({ assigneeUserId: '' }),
        ie = l(() => V.value.filter((e) => 'active' === e.status).length),
        ne = l(() => V.value.filter((e) => 'resolved' === e.status).length),
        re = l(() => V.value.filter((e) => 'suppressed' === e.status).length),
        ue = l(() =>
          'string' == typeof e.params.incidentId && e.params.incidentId
            ? e.params.incidentId
            : 'string' == typeof e.query.incidentId
              ? e.query.incidentId
              : ''
        ),
        oe = l(() => ('string' == typeof e.query.status ? e.query.status : '')),
        ve = () => {
          const e = ue.value
          if (!e) return void (ae.value = '')
          if (ae.value === e) return
          const a = V.value.find((a) => a.id === e)
          if (a) return ge(a), void (ae.value = e)
          Q.value || ((ae.value = e), B.warning('未找到对应事件，已展示当前告警列表'))
        },
        de = [
          { label: '全部等级', value: '' },
          { label: '严重', value: 'critical' },
          { label: '警告', value: 'warning' },
          { label: '信息', value: 'info' }
        ],
        ce = [
          { label: '全部状态', value: '' },
          { label: '活跃', value: 'active' },
          { label: '等待持续时间', value: 'pending' },
          { label: '已解决', value: 'resolved' },
          { label: '已静默', value: 'suppressed' }
        ],
        pe = async () => {
          Q.value = !0
          try {
            const e = await j({
              level: X.value,
              status: E.value,
              serviceId: M.value,
              assigneeUserId: '__unassigned__' === J.value ? '' : J.value,
              scope: F.value,
              keyword: K.value,
              startTime: A.startTime,
              endTime: A.endTime
            })
            ;(V.value = '__unassigned__' === J.value ? e.filter((e) => !e.assigneeUserId) : e), ve()
          } catch (e) {
            B.error('加载告警失败')
          } finally {
            Q.value = !1
          }
        },
        ge = (e) => {
          ;(W.value = e), (Y.value = !0)
        },
        ye = (e) => {
          const a = e.serviceId || M.value
          a
            ? $.push({ path: `/home/services/${a}`, query: { timeRange: A.timeRange, scope: F.value } })
            : B.warning('当前告警缺少服务标识，无法跳转服务详情')
        },
        be = async () => {
          if (!se.value) return
          const e = ee.value.find((e) => e.value === te.value.assigneeUserId)
          try {
            await q(se.value.id, {
              assigneeUserId: te.value.assigneeUserId || '',
              assigneeName: (te.value.assigneeUserId && (null == e ? void 0 : e.label)) || ''
            }),
              (le.value = !1),
              await pe(),
              B.success('告警处理人已更新')
          } catch (a) {
            B.error('更新告警处理人失败')
          }
        },
        me = [
          {
            title: '时间',
            key: 'time',
            render: (e) => r('div', { class: 'alert-inbox-page__mono-time' }, [H(e.time)])
          },
          {
            title: '状态',
            key: 'status',
            render(e) {
              const a = {
                active: { type: 'error', text: '活跃', icon: I },
                pending: { type: 'warning', text: '等待持续时间', icon: I },
                resolved: { type: 'success', text: '已解决', icon: w },
                suppressed: { type: 'default', text: '已静默', icon: h }
              }[e.status]
              return r(
                y,
                { type: a.type, size: 'small', round: !0, bordered: !1 },
                { icon: () => k(a.icon), default: () => a.text }
              )
            }
          },
          { title: '等级', key: 'level' },
          { title: '服务', key: 'service' },
          { title: '告警内容', key: 'message' },
          { title: '处理人', key: 'assigneeName', render: (e) => e.assigneeName || '未指派' },
          {
            title: '操作',
            key: 'actions',
            render: (e) =>
              r('div', { class: 'alert-inbox-page__action-group' }, [
                r(
                  v,
                  {
                    size: 'tiny',
                    type: 'primary',
                    secondary: !0,
                    onClick: (a) => {
                      a.stopPropagation(), ge(e)
                    }
                  },
                  { default: () => [d('详情')] }
                ),
                r(
                  v,
                  {
                    size: 'tiny',
                    secondary: !0,
                    onClick: (a) => {
                      var l
                      a.stopPropagation(),
                        (l = e),
                        (se.value = l),
                        (te.value.assigneeUserId = l.assigneeUserId || ''),
                        (le.value = !0)
                    }
                  },
                  { default: () => [d('指派')] }
                ),
                r(
                  v,
                  {
                    size: 'tiny',
                    secondary: !0,
                    onClick: (a) => {
                      a.stopPropagation(), ye(e)
                    }
                  },
                  { default: () => [d('服务详情')] }
                ),
                'active' === e.status &&
                  r(
                    v,
                    {
                      size: 'tiny',
                      secondary: !0,
                      onClick: (a) => {
                        a.stopPropagation(),
                          (async () => {
                            try {
                              await R(e.id), await pe(), B.success('告警已确认')
                            } catch (a) {
                              B.error('确认告警失败')
                            }
                          })()
                      }
                    },
                    { default: () => [d('确认')] }
                  ),
                'active' === e.status &&
                  r(
                    v,
                    {
                      size: 'tiny',
                      type: 'success',
                      secondary: !0,
                      onClick: (a) => {
                        a.stopPropagation(),
                          (async () => {
                            try {
                              await z(e.id), await pe(), B.success('告警已解决')
                            } catch (a) {
                              B.error('解决告警失败')
                            }
                          })()
                      }
                    },
                    { default: () => [d('解决')] }
                  ),
                r(
                  v,
                  {
                    size: 'tiny',
                    secondary: !0,
                    onClick: (a) => {
                      a.stopPropagation(),
                        (async () => {
                          try {
                            await C(e.id), await pe(), B.info('告警已静默')
                          } catch (a) {
                            B.error('静默告警失败')
                          }
                        })()
                    }
                  },
                  { default: () => [d('静默')] }
                )
              ])
          }
        ]
      return (
        t(() => {
          e.query.timeRange && 'string' == typeof e.query.timeRange && A.setTimeRange(e.query.timeRange),
            e.query.serviceId && 'string' == typeof e.query.serviceId && (M.value = e.query.serviceId),
            oe.value && (E.value = oe.value),
            (async () => {
              try {
                const e = await P({ page: 1, pageSize: 200, scope: F.value }),
                  a = (null == e ? void 0 : e.items) || []
                Z.value = [
                  { label: '全部服务', value: '' },
                  ...a.map((e) => {
                    var a, l, s
                    return {
                      label: (null == (a = e.identity) ? void 0 : a.name) || (null == (l = e.identity) ? void 0 : l.id),
                      value: (null == (s = e.identity) ? void 0 : s.id) || ''
                    }
                  })
                ]
              } catch (e) {}
            })(),
            (async () => {
              try {
                const e = await T()
                ee.value = [
                  { label: '全部处理人', value: '' },
                  { label: '未指派', value: '__unassigned__' },
                  ...e.map((e) => ({ label: e.nickname, value: e.userId }))
                ]
              } catch (e) {}
            })(),
            pe()
        }),
        n(() => [A.startTime, A.endTime], pe),
        n(() => ue.value, ve),
        n(
          () => oe.value,
          (e) => {
            E.value = e
          }
        ),
        () => {
          let a
          return r('div', { class: 'alert-inbox-page' }, [
            r(N, { title: '告警收件箱', subtitle: '统一查看当前告警、处理状态与服务关联上下文' }, null),
            r(
              D,
              {
                value: A.timeRange,
                live: A.isLive,
                options: A.timeOptions,
                'onUpdate:value': (e) => A.setTimeRange(e),
                'onUpdate:live': (e) => {
                  ;(A.isLive = e), e && A.refreshTime()
                },
                onRefresh: () => {
                  A.refreshTime(), pe()
                }
              },
              null
            ),
            r('div', { class: 'alert-inbox-page__filters' }, [
              r(
                u,
                {
                  value: K.value,
                  'onUpdate:value': (e) => (K.value = e),
                  placeholder: '搜索告警内容...',
                  style: { width: '240px' }
                },
                null
              ),
              r(
                o,
                {
                  value: M.value,
                  'onUpdate:value': (e) => (M.value = e),
                  options: Z.value,
                  placeholder: '服务',
                  clearable: !0,
                  style: { width: '180px' }
                },
                null
              ),
              r(
                o,
                {
                  value: X.value,
                  'onUpdate:value': (e) => (X.value = e),
                  options: de,
                  placeholder: '等级',
                  clearable: !0,
                  style: { width: '160px' }
                },
                null
              ),
              r(
                o,
                {
                  value: E.value,
                  'onUpdate:value': (e) => (E.value = e),
                  options: ce,
                  placeholder: '状态',
                  clearable: !0,
                  style: { width: '160px' }
                },
                null
              ),
              r(
                o,
                {
                  value: J.value,
                  'onUpdate:value': (e) => (J.value = e),
                  options: ee.value,
                  placeholder: '处理人',
                  clearable: !0,
                  style: { width: '180px' }
                },
                null
              ),
              r(v, { type: 'primary', onClick: pe }, { default: () => [d('查询')] })
            ]),
            r(
              c,
              { cols: 4, xGap: 16, class: 'alert-inbox-page__summary-grid' },
              ((l = a =
                [
                  { label: '总告警数', value: V.value.length },
                  { label: '活跃', value: ie.value },
                  { label: '已解决', value: ne.value },
                  { label: '已静默', value: re.value }
                ].map((e) =>
                  r(
                    p,
                    { key: e.label },
                    {
                      default: () => [
                        r(
                          g,
                          { bordered: !1, class: 'alert-inbox-page__summary-card' },
                          {
                            default: () => [
                              r('div', { class: 'alert-inbox-page__summary-label' }, [e.label]),
                              r('div', { class: 'alert-inbox-page__summary-value' }, [e.value])
                            ]
                          }
                        )
                      ]
                    }
                  )
                )),
              'function' == typeof l || ('[object Object]' === Object.prototype.toString.call(l) && !U(l))
                ? a
                : { default: () => [a] })
            ),
            r('section', { class: 'alert-inbox-page__table-card' }, [
              r('div', { class: 'alert-inbox-page__table-header' }, [
                r('div', null, [
                  r('div', { class: 'alert-inbox-page__section-title' }, [d('告警清单')]),
                  r('div', { class: 'alert-inbox-page__section-desc' }, [
                    d('等级、状态与操作列包含主要动作，中间信息列可横向滑动查看。')
                  ])
                ]),
                r(y, { bordered: !1 }, { default: () => [d('横向滚动')] })
              ]),
              Q.value
                ? r('div', { class: 'alert-inbox-page__table-loading' }, [r(b, { size: 'large' }, null)])
                : r('div', { class: 'alert-inbox-page__table-shell' }, [
                    r(
                      S,
                      {
                        class: 'alert-inbox-page__table',
                        columns: me,
                        data: V.value,
                        pagination: { pageSize: 10, showSizePicker: !0, pageSizes: [10, 20, 50] },
                        bordered: !1,
                        singleLine: !1,
                        scrollX: 1200,
                        flexHeight: !1,
                        rowKey: (e) => e.id,
                        rowProps: (e) => ({ onClick: () => ge(e) })
                      },
                      null
                    )
                  ])
            ]),
            r(
              L,
              {
                show: Y.value,
                title: '告警详情',
                width: 'md',
                'onUpdate:show': (a) => {
                  ;(Y.value = a),
                    !a &&
                      ue.value &&
                      $.replace({ path: '/home/alerts/inbox', query: { ...e.query, incidentId: void 0 } })
                }
              },
              {
                default: () => [
                  W.value
                    ? r('div', { class: 'alert-inbox-page__detail' }, [
                        r('div', null, [
                          r('span', { class: 'alert-inbox-page__detail-label' }, [d('时间：')]),
                          H(W.value.time)
                        ]),
                        r('div', null, [
                          r('span', { class: 'alert-inbox-page__detail-label' }, [d('状态：')]),
                          W.value.status
                        ]),
                        r('div', null, [
                          r('span', { class: 'alert-inbox-page__detail-label' }, [d('等级：')]),
                          W.value.level
                        ]),
                        r('div', null, [
                          r('span', { class: 'alert-inbox-page__detail-label' }, [d('服务：')]),
                          W.value.service
                        ]),
                        r('div', null, [
                          r('span', { class: 'alert-inbox-page__detail-label' }, [d('处理人：')]),
                          W.value.assigneeName || '未指派'
                        ]),
                        r('div', null, [
                          r('span', { class: 'alert-inbox-page__detail-label' }, [d('内容：')]),
                          W.value.message
                        ]),
                        r('div', { class: 'alert-inbox-page__detail-action' }, [
                          r(
                            v,
                            { secondary: !0, type: 'primary', onClick: () => ye(W.value) },
                            { default: () => [d('查看服务详情')] }
                          )
                        ])
                      ])
                    : null
                ]
              }
            ),
            r(
              _,
              { show: le.value, 'onUpdate:show': (e) => (le.value = e), preset: 'dialog', title: '指派告警处理人' },
              {
                default: () => [
                  r(f, null, {
                    default: () => [
                      r(
                        x,
                        { label: '处理人' },
                        {
                          default: () => [
                            r(
                              o,
                              {
                                value: te.value.assigneeUserId,
                                'onUpdate:value': (e) => (te.value.assigneeUserId = e),
                                options: ee.value.filter((e) => '' !== e.value && '__unassigned__' !== e.value),
                                clearable: !0
                              },
                              null
                            )
                          ]
                        }
                      )
                    ]
                  }),
                  r('div', { class: 'alert-inbox-page__modal-actions' }, [
                    r(v, { onClick: () => (le.value = !1) }, { default: () => [d('取消')] }),
                    r(v, { type: 'primary', onClick: be }, { default: () => [d('保存')] })
                  ])
                ]
              }
            )
          ])
          var l
        }
      )
    }
  })
export { $ as default }
