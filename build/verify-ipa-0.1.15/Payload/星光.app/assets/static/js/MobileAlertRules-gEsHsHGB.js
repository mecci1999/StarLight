import {
  p as e,
  a0 as l,
  w as a,
  bo as r,
  a1 as o,
  aK as t,
  aP as s,
  ac as u,
  aR as i,
  bp as n,
  bq as d,
  bk as c,
  b2 as m,
  br as v,
  bs as b,
  bc as p,
  ai as _
} from './invariable-DewVS0br.js'
import { M as f } from './MobileButton-BKhxhz5A.js'
import { M as h } from './MobileCard-BxmuYclQ.js'
import { M as y } from './MobileTag-ByR2jSPf.js'
import { M as g } from './MobileEmpty-BimvXy70.js'
import { M as V } from './MobileLoading-DlB38x7T.js'
import { M as w } from './MobileInput-OCuvcoNh.js'
import { m as C } from './MobileToast-CIN42EDh.js'
import { M as U } from './MobileSwitch-DjTHu5Qy.js'
import { M } from './MobileSheet-BNn0TOks.js'
import { M as j } from './MobileSelect-BOALIWQn.js'
import { M as z } from './MobileTabs-CAdXTbXB.js'
import { M as k } from './MobileGrid-sIXQCLxa.js'
import { M as S } from './MobileStatistic-BuNMJvar.js'
import './request-BiInMBwl.js'
import { d as N, u as I, e as B, g as x, h as O, i as F, j as E } from './alerts-CIHfuoAx.js'
import './index-DFkcx8xz.js'
const T = e({
    name: 'MobileForm',
    props: {
      onSubmit: { type: Function, default: null },
      onFailed: { type: Function, default: null },
      scrollToError: { type: Boolean, default: !0 }
    },
    setup(e, { slots: o }) {
      const t = l(),
        s = (l) => {
          var a
          null == (a = e.onSubmit) || a.call(e, l)
        },
        u = (l) => {
          var a
          null == (a = e.onFailed) || a.call(e, l)
        }
      return () =>
        a(
          r,
          { ref: t, class: 'mobile-form', onSubmit: s, onFailed: u, scrollToError: e.scrollToError },
          {
            default: () => {
              var e
              return null == (e = o.default) ? void 0 : e.call(o)
            }
          }
        )
    }
  }),
  A = e({
    name: 'MobileFormItem',
    props: {
      name: { type: String, default: '' },
      rules: { type: Array, default: () => [] },
      label: { type: String, default: '' },
      required: { type: Boolean, default: !1 },
      modelValue: { type: [String, Number], default: '' },
      placeholder: { type: String, default: '请输入' },
      type: { type: String, default: 'text' },
      maxlength: { type: [String, Number], default: '' },
      clearable: { type: Boolean, default: !0 },
      readonly: { type: Boolean, default: !1 },
      disabled: { type: Boolean, default: !1 },
      error: { type: Boolean, default: !1 },
      errorMessage: { type: String, default: '' },
      leftIcon: { type: Function, default: null },
      rightIcon: { type: Function, default: null },
      autosize: { type: [Boolean, Object], default: !1 },
      rows: { type: [String, Number], default: '' }
    },
    emits: ['update:modelValue'],
    setup(e, { emit: l }) {
      const r = o(() => ['mobile-form__item', e.error && 'mobile-form__item--error']),
        s = (e) => {
          l('update:modelValue', e)
        }
      return () =>
        a('div', { class: r.value }, [
          a(
            t,
            {
              name: e.name,
              rules: e.rules.length > 0 ? e.rules : void 0,
              label: e.label,
              required: e.required,
              modelValue: e.modelValue,
              'onUpdate:modelValue': s,
              placeholder: e.placeholder,
              type: e.type,
              maxlength: e.maxlength,
              clearable: e.clearable,
              readonly: e.readonly,
              disabled: e.disabled,
              error: e.error,
              autosize: e.autosize,
              rows: e.rows
            },
            {
              leftIcon: 'function' == typeof e.leftIcon ? () => e.leftIcon() : void 0,
              rightIcon: 'function' == typeof e.rightIcon ? () => e.rightIcon() : void 0
            }
          ),
          e.errorMessage && a('div', { class: 'mobile-form__error' }, [e.errorMessage])
        ])
    }
  }),
  q = [
    { label: 'CPU使用率', value: 'cpu_usage' },
    { label: '内存使用率', value: 'memory_usage' },
    { label: '响应时间', value: 'response_time' },
    { label: 'QPS', value: 'qps' },
    { label: '错误率', value: 'error_rate' },
    { label: '磁盘使用率', value: 'disk_usage' }
  ],
  L = [
    { label: '大于', value: '>' },
    { label: '小于', value: '<' },
    { label: '等于', value: '=' },
    { label: '大于等于', value: '>=' },
    { label: '小于等于', value: '<=' }
  ],
  R = [
    { label: '严重', value: 'critical' },
    { label: '警告', value: 'warning' },
    { label: '信息', value: 'info' }
  ],
  P = [
    { label: 'Email', value: 'Email' },
    { label: 'Webhook', value: 'Webhook' },
    { label: '站内通知', value: 'InApp' }
  ],
  $ = e({
    name: 'MobileAlertRules',
    setup() {
      const e = l(!1),
        r = l(!1),
        t = l([]),
        $ = l(!1),
        J = l(!1),
        W = l(!1),
        D = l(null),
        G = l(!1),
        K = l('[]'),
        Q = l('all'),
        X = l({
          name: '',
          service: '',
          metric: '',
          operator: '',
          threshold: 0,
          duration: 5,
          level: 'warning',
          enabled: !0,
          notificationChannels: []
        }),
        Y = async () => {
          ;(e.value = !0), (r.value = !1)
          try {
            const e = await N()
            t.value = Array.isArray(e) ? e : []
          } catch {
            r.value = !0
          } finally {
            e.value = !1
          }
        }
      s(Y)
      const Z = o(() =>
          'all' === Q.value
            ? t.value
            : t.value.filter(
                (e) =>
                  ((e) => {
                    const l = e.toLowerCase()
                    return l.includes('log')
                      ? 'logs'
                      : l.includes('trace') || l.includes('response_time')
                        ? 'trace'
                        : 'metrics'
                  })(e.metric) === Q.value
              )
        ),
        H = o(() => t.value.filter((e) => e.enabled).length),
        ee = o(() => t.value.filter((e) => 'critical' === e.level).length),
        le = (e) => {
          switch (e) {
            case 'critical':
              return 'danger'
            case 'warning':
              return 'warning'
            case 'info':
              return 'info'
            default:
              return 'default'
          }
        },
        ae = (e) => {
          switch (e) {
            case 'critical':
              return '严重'
            case 'warning':
              return '警告'
            case 'info':
              return '提示'
            default:
              return e
          }
        },
        re = (e) => {
          switch (e) {
            case '>':
              return '>'
            case '<':
              return '<'
            case '=':
              return '='
            case '>=':
              return '>='
            case '<=':
              return '<='
            default:
              return e
          }
        },
        oe = () => {
          ;(X.value = {
            name: '',
            service: '',
            metric: 'logs' === Q.value ? 'error_rate' : 'trace' === Q.value ? 'response_time' : 'cpu_usage',
            operator: '',
            threshold: 0,
            duration: 5,
            level: 'warning',
            enabled: !0,
            notificationChannels: []
          }),
            (D.value = null),
            ($.value = !0)
        },
        te = async () => {
          try {
            if (D.value) {
              const e = {
                  ...D.value,
                  ...X.value,
                  operator: X.value.operator,
                  level: X.value.level,
                  channels: X.value.notificationChannels,
                  threshold: Number(X.value.threshold),
                  duration: Number(X.value.duration)
                },
                l = await I(e)
              Object.assign(D.value, l), (J.value = !1)
            } else {
              const e = {
                  name: X.value.name,
                  service: X.value.service,
                  metric: X.value.metric,
                  operator: X.value.operator,
                  threshold: Number(X.value.threshold),
                  duration: Number(X.value.duration),
                  level: X.value.level,
                  enabled: X.value.enabled,
                  channels: X.value.notificationChannels
                },
                l = await B(e)
              t.value.push(l), ($.value = !1)
            }
            D.value = null
          } catch (e) {}
        },
        se = async (e) => {
          const l = Z.value.map((e) => e.id)
          if (l.length)
            try {
              const a = await x({ ids: l, enabled: e }),
                r = new Map(a.map((e) => [e.id, e]))
              t.value = t.value.map((e) => r.get(e.id) || e)
            } catch (a) {}
        },
        ue = async () => {
          try {
            const e = await O(),
              l = new Blob([JSON.stringify(e.rules, null, 2)], { type: 'application/json' }),
              a = URL.createObjectURL(l),
              r = document.createElement('a')
            ;(r.href = a),
              (r.download = `alert-rules-${Date.now()}.json`),
              document.body.appendChild(r),
              r.click(),
              document.body.removeChild(r),
              URL.revokeObjectURL(a)
          } catch (e) {}
        },
        ie = async () => {
          try {
            const e = JSON.parse(K.value),
              l = await F({ rules: e })
            ;(t.value = [...l, ...t.value.filter((e) => !l.some((l) => l.id === e.id))]),
              (W.value = !1),
              (K.value = '[]')
          } catch (e) {}
        },
        ne = () => {
          if (e.value)
            return a('div', { class: 'mobile-alert-rules__loading' }, [a(V, { loading: !0, size: 'large' }, null)])
          if (r.value)
            return a(
              g,
              { description: '数据加载失败', class: 'mobile-alert-rules__error' },
              {
                default: () => [
                  a(f, { size: 'small', type: 'primary', onClick: Y }, { default: () => [u('重新加载')] })
                ]
              }
            )
          if (0 === t.value.length)
            return a('div', { class: 'mobile-alert-rules__empty-state' }, [
              a(
                g,
                { description: '暂无告警规则' },
                {
                  default: () => [
                    a(f, { size: 'small', type: 'primary', onClick: oe }, { default: () => [u('添加规则')] })
                  ]
                }
              )
            ])
          const l = Z.value
          return 0 === l.length
            ? a(g, { description: '当前分类暂无规则', class: 'mobile-alert-rules__empty-state' }, null)
            : a('div', { class: 'mobile-alert-rules__list' }, [
                l.map((e) => {
                  let l
                  return a(
                    h,
                    { key: e.id, size: 'small', bordered: !1, class: 'mobile-alert-rules__list-card' },
                    {
                      default: () => {
                        return [
                          a('div', { class: 'mobile-alert-rules__card-header' }, [
                            a('span', { class: 'mobile-alert-rules__card-name' }, [e.name || '-']),
                            a('div', { class: 'mobile-alert-rules__card-badges' }, [
                              a(
                                y,
                                { size: 'small', type: le(e.level) },
                                ((r = l = ae(e.level)),
                                'function' == typeof r ||
                                ('[object Object]' === Object.prototype.toString.call(r) && !_(r))
                                  ? l
                                  : { default: () => [l] })
                              ),
                              a(
                                y,
                                { size: 'small', type: e.enabled ? 'success' : 'default' },
                                { default: () => [e.enabled ? '启用' : '禁用'] }
                              )
                            ])
                          ]),
                          a('div', { class: 'mobile-alert-rules__card-meta' }, [
                            a('span', null, [u('服务: '), e.service || '-'])
                          ]),
                          a('div', { class: 'mobile-alert-rules__card-condition' }, [
                            a('span', { class: 'mobile-alert-rules__card-metric' }, [e.metric || '-']),
                            a('span', { class: 'mobile-alert-rules__card-operator' }, [re(e.operator)]),
                            a('span', { class: 'mobile-alert-rules__card-threshold' }, [
                              e.threshold ?? '-',
                              e.unit ?? ''
                            ])
                          ]),
                          e.channels &&
                            e.channels.length > 0 &&
                            a('div', { class: 'mobile-alert-rules__card-channels' }, [
                              a('span', { class: 'mobile-alert-rules__card-channels-label' }, [u('通知渠道: ')]),
                              e.channels.join(', ')
                            ]),
                          a('div', { class: 'mobile-alert-rules__card-actions' }, [
                            a('div', { class: 'mobile-alert-rules__card-toggle' }, [
                              a('span', { class: 'mobile-alert-rules__card-toggle-label' }, [
                                e.enabled ? '已启用' : '已禁用'
                              ]),
                              a(
                                U,
                                {
                                  modelValue: e.enabled,
                                  'onUpdate:modelValue': () =>
                                    (async (e) => {
                                      try {
                                        const l = await I({ ...e, enabled: !e.enabled })
                                        Object.assign(e, l)
                                      } catch (l) {}
                                    })(e)
                                },
                                null
                              )
                            ]),
                            a('div', { class: 'mobile-alert-rules__card-buttons' }, [
                              a(
                                f,
                                {
                                  size: 'small',
                                  type: 'ghost',
                                  onClick: () => {
                                    return (
                                      (l = e),
                                      (D.value = l),
                                      (X.value = {
                                        name: l.name,
                                        service: l.service,
                                        metric: l.metric,
                                        operator: l.operator,
                                        threshold: l.threshold,
                                        duration: l.duration,
                                        level: l.level,
                                        enabled: l.enabled,
                                        notificationChannels: Array.isArray(l.channels) ? [...l.channels] : []
                                      }),
                                      void (J.value = !0)
                                    )
                                    var l
                                  }
                                },
                                { default: () => [u('编辑')] }
                              ),
                              a(
                                f,
                                {
                                  size: 'small',
                                  type: 'ghost',
                                  class: 'mobile-alert-rules__delete-button',
                                  'aria-label': `删除规则 ${e.name || e.id}`,
                                  onClick: () =>
                                    (async (e) => {
                                      try {
                                        await C.confirm({
                                          title: '确认删除',
                                          message: `确定要删除规则「${e.name || e.id}」吗？此操作不可撤销。`,
                                          confirmButtonText: '删除',
                                          cancelButtonText: '取消'
                                        }),
                                          await E(e.id)
                                        const l = t.value.findIndex((l) => l.id === e.id)
                                        l > -1 && t.value.splice(l, 1)
                                      } catch (l) {}
                                    })(e),
                                  icon: () => i(d, { size: 16 })
                                },
                                null
                              )
                            ])
                          ])
                        ]
                        var r
                      }
                    }
                  )
                })
              ])
        }
      return () =>
        a('div', { class: 'mobile-alert-rules' }, [
          a('div', { class: 'mobile-alert-rules__header' }, [
            a('div', null, [
              a('h2', { class: 'mobile-alert-rules__title' }, [u('告警规则')]),
              a('div', { class: 'mobile-alert-rules__subtitle' }, [
                t.value.length,
                u(' 条规则 · '),
                H.value,
                u(' 启用 · '),
                ee.value,
                u(' 严重')
              ])
            ]),
            a('div', { class: 'mobile-alert-rules__header-actions' }, [
              a(
                f,
                { size: 'small', type: 'ghost', onClick: () => (G.value = !G.value), icon: () => i(c, { size: 16 }) },
                null
              ),
              a(f, { size: 'small', type: 'ghost', onClick: Y, icon: () => i(m, { size: 16 }) }, null)
            ])
          ]),
          !e.value &&
            !r.value &&
            t.value.length > 0 &&
            a(
              k,
              { cols: 3, class: 'mobile-alert-rules__summary-grid' },
              {
                default: () => [
                  a('div', null, [
                    a(
                      h,
                      { bordered: !1, size: 'small', class: 'mobile-alert-rules__summary-card' },
                      { default: () => [a(S, { label: '总规则', value: t.value.length }, null)] }
                    )
                  ]),
                  a('div', null, [
                    a(
                      h,
                      { bordered: !1, size: 'small', class: 'mobile-alert-rules__summary-card' },
                      { default: () => [a(S, { label: '已启用', value: H.value }, null)] }
                    )
                  ]),
                  a('div', null, [
                    a(
                      h,
                      { bordered: !1, size: 'small', class: 'mobile-alert-rules__summary-card' },
                      { default: () => [a(S, { label: '严重', value: ee.value }, null)] }
                    )
                  ])
                ]
              }
            ),
          !e.value &&
            !r.value &&
            t.value.length > 0 &&
            a('div', { class: 'mobile-alert-rules__tabs-wrapper' }, [
              a(
                z,
                {
                  active: Q.value,
                  'onUpdate:active': (e) => (Q.value = e),
                  class: 'mobile-alert-rules__tabs',
                  type: 'line'
                },
                {
                  default: () => [
                    a(n, { title: '全部', name: 'all' }, null),
                    a(n, { title: '指标', name: 'metrics' }, null),
                    a(n, { title: '日志', name: 'logs' }, null),
                    a(n, { title: '链路', name: 'trace' }, null)
                  ]
                }
              )
            ]),
          !e.value &&
            !r.value &&
            a('div', { class: 'mobile-alert-rules__action-bar' }, [
              a(
                f,
                { size: 'small', type: 'primary', onClick: oe, icon: () => i(v, { size: 16 }) },
                { default: () => [a('span', { class: 'mobile-alert-rules__action-label' }, [u('添加')])] }
              ),
              a(
                f,
                { size: 'small', onClick: () => (W.value = !0), icon: () => i(b, { size: 16 }) },
                { default: () => [a('span', { class: 'mobile-alert-rules__action-label' }, [u('导入')])] }
              ),
              a(
                f,
                { size: 'small', onClick: ue, icon: () => i(p, { size: 16 }) },
                { default: () => [a('span', { class: 'mobile-alert-rules__action-label' }, [u('导出')])] }
              )
            ]),
          G.value &&
            !e.value &&
            !r.value &&
            t.value.length > 0 &&
            a('div', { class: 'mobile-alert-rules__bulk-bar' }, [
              a(f, { size: 'small', type: 'primary', onClick: () => se(!0) }, { default: () => [u('批量启用')] }),
              a(f, { size: 'small', type: 'ghost', onClick: () => se(!1) }, { default: () => [u('批量禁用')] })
            ]),
          ne(),
          a(
            M,
            { show: $.value, 'onUpdate:show': (e) => ($.value = e), position: 'bottom', title: '添加告警规则' },
            {
              default: () => [
                a(
                  T,
                  { class: 'mobile-alert-rules__form' },
                  {
                    default: () => [
                      a(
                        A,
                        {
                          label: '规则名称',
                          name: 'name',
                          modelValue: X.value.name,
                          'onUpdate:modelValue': (e) => (X.value.name = e),
                          placeholder: '请输入规则名称'
                        },
                        null
                      ),
                      a(
                        A,
                        {
                          label: '监控服务',
                          name: 'service',
                          modelValue: X.value.service,
                          'onUpdate:modelValue': (e) => (X.value.service = e),
                          placeholder: '请输入服务标识'
                        },
                        null
                      ),
                      a('div', { class: 'mobile-alert-rules__form-group' }, [
                        a('div', { class: 'mobile-alert-rules__form-label' }, [u('监控指标')]),
                        a(
                          j,
                          {
                            modelValue: X.value.metric,
                            'onUpdate:modelValue': (e) => (X.value.metric = e),
                            options: q,
                            placeholder: '选择指标'
                          },
                          null
                        )
                      ]),
                      a('div', { class: 'mobile-alert-rules__form-group' }, [
                        a('div', { class: 'mobile-alert-rules__form-label' }, [u('触发条件')]),
                        a('div', { class: 'mobile-alert-rules__condition-row' }, [
                          a(
                            j,
                            {
                              modelValue: X.value.operator,
                              'onUpdate:modelValue': (e) => (X.value.operator = e),
                              options: L,
                              placeholder: '运算符'
                            },
                            null
                          ),
                          a(
                            w,
                            {
                              type: 'digit',
                              modelValue: X.value.threshold,
                              'onUpdate:modelValue': (e) => (X.value.threshold = Number(e)),
                              placeholder: '阈值'
                            },
                            null
                          )
                        ])
                      ]),
                      a('div', { class: 'mobile-alert-rules__form-group' }, [
                        a('div', { class: 'mobile-alert-rules__form-label' }, [u('持续时间 (分钟)')]),
                        a(
                          w,
                          {
                            type: 'digit',
                            modelValue: X.value.duration,
                            'onUpdate:modelValue': (e) => (X.value.duration = Number(e)),
                            placeholder: '分钟'
                          },
                          null
                        )
                      ]),
                      a('div', { class: 'mobile-alert-rules__form-group' }, [
                        a('div', { class: 'mobile-alert-rules__form-label' }, [u('告警等级')]),
                        a(
                          j,
                          {
                            modelValue: X.value.level,
                            'onUpdate:modelValue': (e) => (X.value.level = e),
                            options: R,
                            placeholder: '选择等级'
                          },
                          null
                        )
                      ]),
                      a('div', { class: 'mobile-alert-rules__form-group' }, [
                        a('div', { class: 'mobile-alert-rules__form-label' }, [u('通知渠道')]),
                        a(
                          j,
                          {
                            modelValue: X.value.notificationChannels[0] || '',
                            'onUpdate:modelValue': (e) => {
                              X.value.notificationChannels = e ? [e] : []
                            },
                            options: P,
                            placeholder: '选择通知渠道'
                          },
                          null
                        )
                      ]),
                      a('div', { class: 'mobile-alert-rules__form-group mobile-alert-rules__form-group--switch' }, [
                        a('div', { class: 'mobile-alert-rules__form-label' }, [u('启用')]),
                        a(U, { modelValue: X.value.enabled, 'onUpdate:modelValue': (e) => (X.value.enabled = e) }, null)
                      ])
                    ]
                  }
                ),
                a('div', { class: 'mobile-alert-rules__modal-footer' }, [
                  a(f, { onClick: () => ($.value = !1) }, { default: () => [u('取消')] }),
                  a(f, { type: 'primary', onClick: te }, { default: () => [u('保存')] })
                ])
              ]
            }
          ),
          a(
            M,
            { show: J.value, 'onUpdate:show': (e) => (J.value = e), position: 'bottom', title: '编辑告警规则' },
            {
              default: () => [
                a(
                  T,
                  { class: 'mobile-alert-rules__form' },
                  {
                    default: () => [
                      a(
                        A,
                        {
                          label: '规则名称',
                          name: 'name',
                          modelValue: X.value.name,
                          'onUpdate:modelValue': (e) => (X.value.name = e),
                          placeholder: '请输入规则名称'
                        },
                        null
                      ),
                      a(
                        A,
                        {
                          label: '监控服务',
                          name: 'service',
                          modelValue: X.value.service,
                          'onUpdate:modelValue': (e) => (X.value.service = e),
                          placeholder: '请输入服务标识'
                        },
                        null
                      ),
                      a('div', { class: 'mobile-alert-rules__form-group' }, [
                        a('div', { class: 'mobile-alert-rules__form-label' }, [u('监控指标')]),
                        a(
                          j,
                          {
                            modelValue: X.value.metric,
                            'onUpdate:modelValue': (e) => (X.value.metric = e),
                            options: q,
                            placeholder: '选择指标'
                          },
                          null
                        )
                      ]),
                      a('div', { class: 'mobile-alert-rules__form-group' }, [
                        a('div', { class: 'mobile-alert-rules__form-label' }, [u('触发条件')]),
                        a('div', { class: 'mobile-alert-rules__condition-row' }, [
                          a(
                            j,
                            {
                              modelValue: X.value.operator,
                              'onUpdate:modelValue': (e) => (X.value.operator = e),
                              options: L,
                              placeholder: '运算符'
                            },
                            null
                          ),
                          a(
                            w,
                            {
                              type: 'digit',
                              modelValue: X.value.threshold,
                              'onUpdate:modelValue': (e) => (X.value.threshold = Number(e)),
                              placeholder: '阈值'
                            },
                            null
                          )
                        ])
                      ]),
                      a('div', { class: 'mobile-alert-rules__form-group' }, [
                        a('div', { class: 'mobile-alert-rules__form-label' }, [u('持续时间 (分钟)')]),
                        a(
                          w,
                          {
                            type: 'digit',
                            modelValue: X.value.duration,
                            'onUpdate:modelValue': (e) => (X.value.duration = Number(e)),
                            placeholder: '分钟'
                          },
                          null
                        )
                      ]),
                      a('div', { class: 'mobile-alert-rules__form-group' }, [
                        a('div', { class: 'mobile-alert-rules__form-label' }, [u('告警等级')]),
                        a(
                          j,
                          {
                            modelValue: X.value.level,
                            'onUpdate:modelValue': (e) => (X.value.level = e),
                            options: R,
                            placeholder: '选择等级'
                          },
                          null
                        )
                      ]),
                      a('div', { class: 'mobile-alert-rules__form-group' }, [
                        a('div', { class: 'mobile-alert-rules__form-label' }, [u('通知渠道')]),
                        a(
                          j,
                          {
                            modelValue: X.value.notificationChannels[0] || '',
                            'onUpdate:modelValue': (e) => {
                              X.value.notificationChannels = e ? [e] : []
                            },
                            options: P,
                            placeholder: '选择通知渠道'
                          },
                          null
                        )
                      ]),
                      a('div', { class: 'mobile-alert-rules__form-group mobile-alert-rules__form-group--switch' }, [
                        a('div', { class: 'mobile-alert-rules__form-label' }, [u('启用')]),
                        a(U, { modelValue: X.value.enabled, 'onUpdate:modelValue': (e) => (X.value.enabled = e) }, null)
                      ])
                    ]
                  }
                ),
                a('div', { class: 'mobile-alert-rules__modal-footer' }, [
                  a(f, { onClick: () => (J.value = !1) }, { default: () => [u('取消')] }),
                  a(f, { type: 'primary', onClick: te }, { default: () => [u('保存')] })
                ])
              ]
            }
          ),
          a(
            M,
            { show: W.value, 'onUpdate:show': (e) => (W.value = e), position: 'bottom', title: '导入告警规则' },
            {
              default: () => [
                a(
                  T,
                  { class: 'mobile-alert-rules__form' },
                  {
                    default: () => [
                      a(
                        A,
                        {
                          label: '规则 JSON',
                          name: 'payload',
                          modelValue: K.value,
                          'onUpdate:modelValue': (e) => (K.value = e),
                          type: 'textarea',
                          autosize: !0,
                          placeholder:
                            '[{"name":"CPU 告警","service":"my-service","metric":"cpu_usage","operator":">","threshold":80,"duration":5,"level":"warning","enabled":true,"channels":["Email"]}]'
                        },
                        null
                      )
                    ]
                  }
                ),
                a('div', { class: 'mobile-alert-rules__modal-footer' }, [
                  a(f, { onClick: () => (W.value = !1) }, { default: () => [u('取消')] }),
                  a(f, { type: 'primary', onClick: ie }, { default: () => [u('导入')] })
                ])
              ]
            }
          )
        ])
    }
  })
export { $ as default }
