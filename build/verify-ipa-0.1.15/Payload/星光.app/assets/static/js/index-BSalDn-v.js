const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      'static/js/index-DdAVWnYT.js',
      'static/js/invariable-DewVS0br.js',
      'static/css/invariable-iNbeqmVx.css',
      'static/js/index-DFkcx8xz.js',
      'static/css/index-CHJV-hXo.css',
      'static/css/index-CkzhiLL2.css',
      'static/js/index-BBX-eGM8.js',
      'static/css/index-DWModA8h.css'
    ])
) => i.map((i) => d[i])
import { b as e, U as a, e as t, p as l, f as n, _ as s } from './index-DFkcx8xz.js'
import {
  p as i,
  w as r,
  cc as o,
  a6 as c,
  ac as u,
  a0 as d,
  a1 as v,
  a2 as p,
  a3 as m,
  Z as _,
  cd as h,
  ab as g,
  ar as f,
  ce as y,
  cf as b,
  ag as w,
  N as k,
  ae as C,
  av as S,
  cg as z,
  ch as A,
  ci as I,
  cj as L,
  ck as x,
  cl as N,
  cm as j,
  $ as M,
  j as T,
  cn as E,
  co as $,
  cp as D,
  cq as q,
  d as H,
  ah as U,
  cr as W,
  cs as K,
  ct as P,
  bm as F,
  cu as O,
  c0 as B
} from './invariable-DewVS0br.js'
import { W as R } from './index-BoGL2l6m.js'
import { d as J } from './auth-CpdnJA9r.js'
import { k as Q, l as V } from './alerts-CIHfuoAx.js'
import { A as Z, g as G, c as X, r as Y } from './AvatarCropUploader-DVFe0fD5.js'
import { g as ee, d as ae, r as te } from './notificationCenterModel-BUEljd8S.js'
import { a as le, c as ne, d as se, s as ie, p as re, b as oe, h as ce } from './clientNotifications-CmKa3qCA.js'
import './useMitt-UjCuZB1B.js'
import './request-BiInMBwl.js'
import './file-0gjKn95t.js'
import './user-CjErkjef.js'
const ue = i({
    name: 'LoadingSpinner',
    props: { percentage: { type: Number, default: 0 }, loadingText: { type: String, default: 'Loading...' } },
    setup: (e) => () =>
      r('div', { 'data-tauri-drag-region': !0, class: 'loading-spinner' }, [
        r('div', { class: 'loading-spinner__content' }, [
          r('div', { class: 'loading-spinner__logo-wrap' }, [
            r('div', { class: 'loading-spinner__glow' }, null),
            r('div', { class: 'loading-spinner__logo-card' }, [
              r('img', { src: '/static/svg/star_1-CMw9ntfH.svg', class: 'loading-spinner__logo', alt: 'Logo' }, null)
            ])
          ]),
          r('div', { class: 'loading-spinner__progress' }, [
            r('div', { class: 'loading-spinner__progress-track' }, [
              r(
                o,
                {
                  type: 'line',
                  showIndicator: !1,
                  color: 'var(--color-primary-6)',
                  railColor: 'var(--color-fill-2)',
                  percentage: e.percentage,
                  height: 6,
                  processing: !0,
                  class: 'loading-spinner__progress-bar'
                },
                null
              )
            ]),
            r('div', { class: 'loading-spinner__status' }, [
              e.percentage < 100 && r(c, { size: 16, stroke: 'var(--color-primary-6)' }, null),
              r('span', { class: 'loading-spinner__status-text' }, [e.loadingText]),
              e.percentage > 0 &&
                r('span', { class: 'loading-spinner__status-badge' }, [Math.round(e.percentage), u('%')])
            ])
          ])
        ])
      ])
  }),
  de = [
    { label: '服务目录', description: '按服务名称、实例或负责人搜索', route: '/home/services', keywordHint: 'service' },
    {
      label: '指标分析',
      description: '搜索 CPU、内存、QPS、延迟等指标',
      route: '/home/investigate/metrics',
      keywordHint: 'metric'
    },
    {
      label: '日志中心',
      description: '定位 error、traceId 或业务关键字',
      route: '/home/investigate/logs',
      keywordHint: 'log'
    },
    { label: '告警收件箱', description: '检索告警、通知和规则状态', route: '/home/alerts/inbox', keywordHint: 'alert' }
  ],
  ve = (e) => {
    if (!e) return '-'
    const a = new Date(e)
    if (Number.isNaN(a.getTime())) return e
    const t = Date.now() - a.getTime()
    return t < 6e4
      ? '刚刚'
      : t < 36e5
        ? `${Math.floor(t / 6e4)}分钟前`
        : t < 864e5
          ? `${Math.floor(t / 36e5)}小时前`
          : t < 6048e5
            ? `${Math.floor(t / 864e5)}天前`
            : a.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  },
  pe = {
    success: { label: '成功', type: 'success', icon: D },
    failed: { label: '失败', type: 'error', icon: $ },
    pending: { label: '发送中', type: 'warning', icon: E },
    unknown: { label: '未知', type: 'default', icon: T }
  },
  me = { critical: H, warning: q, info: k },
  _e = i({
    name: 'ContainerHeader',
    setup() {
      const s = M(),
        i = d(''),
        o = d(!1),
        T = d(!1),
        E = d(!1),
        $ = d(''),
        D = d(''),
        q = d([]),
        H = d(e() || {}),
        U = d(''),
        W = v(() => {
          const e = H.value
          return {
            userId: e.userId || '',
            name: e.nickName || e.nickname || e.email || '星光用户',
            email: e.email || '未绑定邮箱',
            avatar:
              ((a = e.avatar),
              (Boolean(
                a && (/^(https?:)?\/\//.test(a) || a.startsWith('/') || a.startsWith('data:') || a.startsWith('blob:'))
              ) &&
                e.avatar) ||
                ''),
            role: e.isAdmin ? '管理员' : '普通用户',
            scopeLabel: n(e),
            timezone: e.timezone || 'UTC+8',
            locale: e.locale || 'zh-CN'
          }
          var a
        }),
        K = v(() => q.value.filter((e) => 'pending' === e.status).length),
        P = v(() => q.value.filter((e) => 'failed' === e.status).length),
        F = v(() => Math.max(K.value + P.value, ne.value)),
        O = v(() => q.value.slice(0, 5)),
        B = v(() =>
          E.value
            ? '正在同步通知状态…'
            : $.value
              ? '通知状态暂不可用'
              : F.value
                ? `${P.value} 条失败，${K.value} 条发送中`
                : q.value.length
                  ? '最近通知状态正常'
                  : '暂无通知记录'
        ),
        R = (e, a) => {
          s.push(a ? { path: e, query: a } : e)
        },
        se = (e) => {
          'Enter' === e.key &&
            (() => {
              const e = i.value.trim()
              if (!e) return
              const a = e.toLowerCase()
              a.includes('trace') || a.includes('span') || a.includes('链路')
                ? R('/home/investigate/traces', { keyword: e })
                : a.includes('log') || a.includes('error') || a.includes('日志') || a.includes('错误')
                  ? R('/home/investigate/logs', { keyword: e })
                  : a.includes('alert') || a.includes('告警') || a.includes('通知')
                    ? R('/home/alerts/inbox', { keyword: e })
                    : a.includes('metric') ||
                        a.includes('cpu') ||
                        a.includes('memory') ||
                        a.includes('指标') ||
                        a.includes('内存')
                      ? R('/home/investigate/metrics', { keyword: e })
                      : R('/home/services', { keyword: e })
            })()
        },
        ie = (e) => {
          ;(e.metaKey || e.ctrlKey) &&
            'k' === e.key.toLowerCase() &&
            (e.preventDefault(),
            (() => {
              const e = document.querySelector('.header-search input')
              null == e || e.focus(), null == e || e.select()
            })())
        },
        re = (a) => {
          const t = a || e() || {}
          H.value = t
        },
        oe = (e) => {
          re(e.detail)
        },
        ce = (e) => {
          'user' === e.key && re()
        },
        ue = async () => {
          ;(E.value = !0), ($.value = '')
          try {
            const e = await Q()
            q.value = (e || []).map((e, a) =>
              ((e, a) => {
                const t = String(e.status || ''),
                  l = String(e.type || '')
                return {
                  key: String(e.key || e.id || `notification-${a}`),
                  serviceId: 'string' == typeof e.serviceId ? e.serviceId : void 0,
                  sendTime: ve(String(e.sentAt || e.sendTime || '')),
                  ruleName: String(e.ruleName || e.type || '系统通知'),
                  service: String(e.service || '系统'),
                  channel: String(e.channel || 'unknown'),
                  recipient: String(e.recipient || e.target || '-'),
                  status:
                    'sent' === t || 'delivered' === t
                      ? 'success'
                      : 'success' === t || 'failed' === t || 'pending' === t
                        ? t
                        : 'unknown',
                  alertLevel: 'critical' === l ? 'critical' : 'warning' === l ? 'warning' : 'info' === l ? 'info' : '',
                  retryCount: 'number' == typeof e.retryCount ? e.retryCount : 0,
                  content: String(e.content || '暂无通知内容'),
                  errorMessage: 'string' == typeof e.errorMessage ? e.errorMessage : ''
                }
              })(e, a)
            )
          } catch (e) {
            ;($.value = '通知加载失败，请稍后重试。'), (q.value = [])
          } finally {
            E.value = !1
          }
        },
        _e = async () => {
          try {
            await J()
          } catch (e) {}
          t(), (o.value = !1), await s.replace('/login')
        },
        he = () => {
          ;(o.value = !1), R('/home/profile')
        },
        ge = ({ avatar: e, user: a }) => {
          const t = a.avatar || e
          ;(H.value = { ...H.value, ...a, avatar: t }), l(H.value)
        }
      p(
        () => W.value.avatar,
        (e) => {
          if (!e) return void (U.value = '')
          const a = G(e)
          ;(U.value = a || (X(e) ? '' : e)),
            Y(e).then((a) => {
              W.value.avatar === e && (U.value = a)
            })
        },
        { immediate: !0 }
      )
      const fe = () =>
          r('div', { class: 'header-search-panel' }, [
            r('div', { class: 'header-search-panel__title' }, [u('快速搜索入口')]),
            r('div', { class: 'header-search-panel__list' }, [
              de.map((e) =>
                r(
                  'button',
                  {
                    key: e.route,
                    type: 'button',
                    class: 'header-search-target',
                    onClick: () => R(e.route, i.value.trim() ? { keyword: i.value.trim() } : void 0)
                  },
                  [
                    r('span', null, [r('strong', null, [e.label]), r('em', null, [e.description])]),
                    r('kbd', null, [e.keywordHint])
                  ]
                )
              )
            ])
          ]),
        ye = (e) => {
          const a = pe[e.status],
            t = a.icon,
            l =
              'critical' === e.alertLevel
                ? { type: 'error', label: '严重' }
                : 'warning' === e.alertLevel
                  ? { type: 'warning', label: '警告' }
                  : 'info' === e.alertLevel
                    ? { type: 'info', label: '提示' }
                    : null,
            n = l ? me[e.alertLevel] || me.info : t,
            s = l ? e.alertLevel : e.status
          return r('div', { class: 'header-notification-item', key: e.key }, [
            r('div', { class: ['header-notification-item__status', `is-${s}`] }, [
              r(f, { size: 16, component: n }, null)
            ]),
            r(
              'button',
              {
                type: 'button',
                class: 'header-notification-item__content',
                onClick: () => R('/home/alert-notifications', { keyword: e.ruleName })
              },
              [
                r('span', { class: 'header-notification-item__title' }, [e.ruleName]),
                r('span', { class: 'header-notification-item__meta' }, [
                  e.service,
                  u(' · '),
                  e.channel,
                  u(' · '),
                  e.sendTime
                ]),
                r('span', { class: 'header-notification-item__text' }, [e.errorMessage || e.content])
              ]
            ),
            r('div', { class: 'header-notification-item__actions' }, [
              l
                ? r(I, { size: 'small', bordered: !1, type: l.type }, { default: () => [l.label] })
                : r(I, { size: 'small', bordered: !1, type: a.type }, { default: () => [a.label] }),
              'failed' === e.status
                ? r(
                    w,
                    {
                      size: 'tiny',
                      secondary: !0,
                      type: 'warning',
                      loading: D.value === e.key,
                      onClick: () =>
                        (async (e) => {
                          const a = e.status,
                            t = e.retryCount
                          ;(e.status = 'pending'), (e.retryCount = ee(e.retryCount)), (D.value = e.key)
                          try {
                            const a = await V(e.key)
                            if (!ae(a)) throw new Error('notification resend rejected')
                            window.$message.success('通知已重新发送'), await ue()
                          } catch (l) {
                            ;(e.status = a), (e.retryCount = te(e.retryCount, t)), window.$message.error('通知重发失败')
                          } finally {
                            D.value = ''
                          }
                        })(e)
                    },
                    { default: () => [u('重发')] }
                  )
                : null
            ])
          ])
        },
        be = () =>
          r('div', { class: 'header-notification-panel' }, [
            r('div', { class: 'header-notification-panel__head' }, [
              r('div', null, [r('strong', null, [u('消息通知')]), r('span', null, [B.value])]),
              r(
                w,
                { quaternary: !0, circle: !0, size: 'small', onClick: ue, loading: E.value },
                { default: () => [r(f, { size: 16 }, { default: () => [r(S, null, null)] })] }
              )
            ]),
            r(z, { class: 'header-popover-divider' }, null),
            E.value
              ? r('div', { class: 'header-notification-panel__loading' }, [
                  r(c, { size: 'small' }, null),
                  r('span', null, [u('正在加载通知…')])
                ])
              : $.value
                ? r(
                    A,
                    { description: $.value, class: 'header-notification-panel__empty' },
                    {
                      extra: () =>
                        r(
                          w,
                          { size: 'small', type: 'primary', secondary: !0, onClick: ue },
                          { default: () => [u('重新加载')] }
                        )
                    }
                  )
                : O.value.length
                  ? r('div', { class: 'header-notification-panel__list' }, [O.value.map(ye)])
                  : r(A, { description: '暂无通知记录', class: 'header-notification-panel__empty' }, null),
            r(z, { class: 'header-popover-divider' }, null),
            r('div', { class: 'header-notification-panel__footer' }, [
              r(
                w,
                { size: 'small', secondary: !0, onClick: () => R('/home/alerts/inbox') },
                { default: () => [u('告警收件箱')] }
              ),
              r(
                w,
                { size: 'small', type: 'primary', onClick: () => R('/home/alert-notifications') },
                { default: () => [u('查看全部通知')] }
              )
            ])
          ]),
        we = () =>
          r('div', { class: 'header-user-popover' }, [
            r('div', { class: 'header-user-card' }, [
              r(
                Z,
                { userId: W.value.userId, disabled: !W.value.userId, onUploaded: ge },
                {
                  default: ({ open: e, uploading: a }) =>
                    r(
                      'button',
                      {
                        type: 'button',
                        class: 'header-user-card__avatar-action',
                        onClick: e,
                        disabled: a || !W.value.userId
                      },
                      [
                        U.value
                          ? r(
                              C,
                              {
                                key: U.value,
                                size: 46,
                                round: !0,
                                class: 'header-user-card__avatar',
                                src: U.value,
                                renderFallback: () =>
                                  r('span', { class: 'header-user-card__avatar header-user-card__avatar-fallback' }, [
                                    W.value.name.charAt(0)
                                  ])
                              },
                              null
                            )
                          : r(
                              'span',
                              {
                                key: W.value.name,
                                class: 'header-user-card__avatar header-user-card__avatar-fallback'
                              },
                              [W.value.name.charAt(0)]
                            ),
                        r('span', null, [a ? '上传中' : '更换'])
                      ]
                    )
                }
              ),
              r('div', { class: 'header-user-card__main' }, [
                r('div', { class: 'header-user-card__name' }, [W.value.name]),
                r('div', { class: 'header-user-card__email' }, [W.value.email]),
                r('div', { class: 'header-user-card__tags' }, [
                  r(I, { size: 'small', bordered: !1, type: 'info' }, { default: () => [W.value.role] }),
                  r(I, { size: 'small', bordered: !1, type: 'success' }, { default: () => [W.value.scopeLabel] })
                ])
              ])
            ]),
            r(z, { class: 'header-popover-divider' }, null),
            r('div', { class: 'header-user-menu', role: 'menu' }, [
              r('button', { type: 'button', class: 'header-user-menu__item', onClick: he }, [
                r('span', { class: 'header-user-menu__icon' }, [
                  r(f, { size: 17 }, { default: () => [r(L, null, null)] })
                ]),
                r('span', { class: 'header-user-menu__copy' }, [
                  r('strong', null, [u('编辑个人资料')]),
                  r('em', null, [u('修改昵称、时区与语言偏好')])
                ])
              ]),
              r('button', { type: 'button', class: 'header-user-menu__item', onClick: () => R('/home/settings') }, [
                r('span', { class: 'header-user-menu__icon' }, [
                  r(f, { size: 17 }, { default: () => [r(x, null, null)] })
                ]),
                r('span', { class: 'header-user-menu__copy' }, [
                  r('strong', null, [u('应用设置')]),
                  r('em', null, [u('主题、窗口、登录与启动偏好')])
                ])
              ]),
              r(
                'button',
                { type: 'button', class: 'header-user-menu__item', onClick: () => R('/home/alert-notifications') },
                [
                  r('span', { class: 'header-user-menu__icon' }, [
                    r(f, { size: 17 }, { default: () => [r(k, null, null)] })
                  ]),
                  r('span', { class: 'header-user-menu__copy' }, [
                    r('strong', null, [u('通知历史')]),
                    r('em', null, [u('查看告警通知投递和重试记录')])
                  ])
                ]
              ),
              r('button', { type: 'button', class: 'header-user-menu__item', onClick: () => R('/home/alert-rules') }, [
                r('span', { class: 'header-user-menu__icon' }, [
                  r(f, { size: 17 }, { default: () => [r(N, null, null)] })
                ]),
                r('span', { class: 'header-user-menu__copy' }, [
                  r('strong', null, [u('告警规则')]),
                  r('em', null, [u('管理阈值、渠道与触发策略')])
                ])
              ])
            ]),
            r(z, { class: 'header-popover-divider' }, null),
            r(
              'button',
              { type: 'button', class: 'header-user-menu__item header-user-menu__item--danger', onClick: _e },
              [
                r('span', { class: 'header-user-menu__icon' }, [
                  r(f, { size: 17 }, { default: () => [r(j, null, null)] })
                ]),
                r('span', { class: 'header-user-menu__copy' }, [
                  r('strong', null, [u('退出登录')]),
                  r('em', null, [u('清除本地会话并返回登录页')])
                ])
              ]
            )
          ])
      return (
        m(() => {
          window.addEventListener('keydown', ie),
            window.addEventListener(a, oe),
            window.addEventListener('storage', ce),
            ue()
        }),
        _(() => {
          window.removeEventListener('keydown', ie),
            window.removeEventListener(a, oe),
            window.removeEventListener('storage', ce)
        }),
        () =>
          r('div', { class: 'container-header', 'data-tauri-drag-region': !0 }, [
            r('div', { class: 'header-balance-zone', 'data-tauri-drag-region': !0 }, null),
            r('div', { class: 'header-search no-drag' }, [
              r(
                h,
                { trigger: 'click', placement: 'bottom-start', displayDirective: 'show' },
                {
                  trigger: () =>
                    r('div', { class: 'header-search__box' }, [
                      r(
                        g,
                        {
                          value: i.value,
                          placeholder: '搜索服务、日志、链路、指标或告警…',
                          'onUpdate:value': (e) => (i.value = e),
                          onKeydown: se
                        },
                        {
                          prefix: () =>
                            r(f, { size: 17, class: 'header-search__icon' }, { default: () => [r(y, null, null)] }),
                          suffix: () => r('kbd', { class: 'header-search__kbd' }, [u('⌘K')])
                        }
                      )
                    ]),
                  default: fe
                }
              )
            ]),
            r('div', { class: 'header-actions no-drag' }, [
              r(
                h,
                {
                  trigger: 'click',
                  placement: 'bottom-end',
                  displayDirective: 'show',
                  show: T.value,
                  onUpdateShow: (e) => {
                    ;(T.value = e), e && (le(), ue())
                  }
                },
                {
                  trigger: () =>
                    r('div', { class: 'header-notification-trigger' }, [
                      r(
                        b,
                        { value: F.value || void 0, max: 99, dot: F.value > 0 },
                        {
                          default: () => [
                            r(
                              w,
                              {
                                quaternary: !0,
                                class: 'header-icon-button header-icon-button--square',
                                'aria-label': '消息通知'
                              },
                              { default: () => [r(f, { size: 19 }, { default: () => [r(k, null, null)] })] }
                            )
                          ]
                        }
                      )
                    ]),
                  default: be
                }
              ),
              r(
                h,
                {
                  trigger: 'click',
                  placement: 'bottom-end',
                  show: o.value,
                  onUpdateShow: (e) => (o.value = e),
                  displayDirective: 'show'
                },
                {
                  trigger: () =>
                    r('button', { type: 'button', class: 'header-avatar-button', 'aria-label': '用户信息' }, [
                      U.value
                        ? r(
                            C,
                            {
                              key: U.value,
                              size: 30,
                              round: !0,
                              class: 'header-avatar-button__avatar',
                              src: U.value,
                              renderFallback: () =>
                                r(
                                  'span',
                                  { class: 'header-avatar-button__avatar header-avatar-button__avatar-fallback' },
                                  [W.value.name.charAt(0)]
                                )
                            },
                            null
                          )
                        : r(
                            'span',
                            {
                              key: W.value.name,
                              class: 'header-avatar-button__avatar header-avatar-button__avatar-fallback'
                            },
                            [W.value.name.charAt(0)]
                          )
                    ]),
                  default: we
                }
              )
            ])
          ])
      )
    }
  }),
  he = 'starlight_client_notification_seen_ids_v1',
  ge = (e, a) => String(e.id || e.key || `${e.alertId || e.ruleId || 'notification'}-${e.sentAt || e.updatedAt || a}`),
  fe = (e) => {
    if ('number' == typeof e.updatedAt && Number.isFinite(e.updatedAt)) return e.updatedAt
    const a = new Date(e.sentAt || e.sendTime || '').getTime()
    return Number.isFinite(a) ? a : Date.now()
  },
  ye = (e) =>
    'critical' === e.type || 'warning' === e.type || 'info' === e.type
      ? e.type
      : 'failed' === e.status
        ? 'critical'
        : 'warning',
  be = (e) => {
    const a = String(e.channel || '').toLowerCase(),
      t = String(e.status || '').toLowerCase()
    return ('inapp' === a || 'in-app' === a) && 'failed' !== t
  },
  we = { critical: H, warning: q, info: k, success: D },
  ke = { critical: '严重', warning: '警告', info: '提示', success: '完成' },
  Ce = i({
    name: 'ClientNotificationHost',
    props: { pollIntervalMs: { type: Number, default: 3e4 } },
    setup(e) {
      const a = d(
          (() => {
            if ('undefined' == typeof localStorage) return new Set()
            try {
              const e = localStorage.getItem(he),
                a = e ? JSON.parse(e) : []
              return new Set(Array.isArray(a) ? a.filter((e) => 'string' == typeof e) : [])
            } catch {
              return new Set()
            }
          })()
        ),
        t = d(!1),
        l = new Map()
      let n = null
      const s = v(() => oe.value.filter((e) => 'bottom-right' === e.placement).slice(0, 4)),
        i = (e) => {
          var t
          a.value.add(e),
            (t = a.value),
            'undefined' != typeof localStorage && localStorage.setItem(he, JSON.stringify(Array.from(t).slice(-300)))
        },
        o = async () => {
          try {
            const e = ((await Q({ channel: 'InApp' })) || []).filter(be)
            if (!t.value) return e.forEach((e, a) => i(ge(e, a))), (t.value = !0), void (await ie())
            const l = e
              .map((e, a) => ({ item: e, id: ge(e, a), createdAt: fe(e) }))
              .filter(({ id: e }) => !a.value.has(e))
              .sort((e, a) => e.createdAt - a.createdAt)
            for (const { item: a, id: t, createdAt: n } of l)
              i(t),
                await re({
                  id: t,
                  dedupeKey: t,
                  source: 'alerts',
                  level: ye(a),
                  title: a.mobileTitle || a.ruleName || '告警通知',
                  body: a.mobileBody || a.content || '有新的告警通知需要关注',
                  service: a.service,
                  createdAt: n,
                  native: !0,
                  badge: !0,
                  actions: [{ label: '查看通知', route: '/home/alert-notifications' }],
                  metadata: { alertId: a.alertId, ruleId: a.ruleId, channel: a.channel, status: a.status }
                })
          } catch (e) {}
        },
        c = (e) => {
          l.has(e.id) ||
            l.set(
              e.id,
              window.setTimeout(() => {
                l.delete(e.id), ce(e.id)
              }, e.durationMs)
            )
        }
      return (
        p(
          s,
          (e) => {
            e.forEach(c),
              Array.from(l.keys()).forEach((a) => {
                if (e.some((e) => e.id === a)) return
                const t = l.get(a)
                t && window.clearTimeout(t), l.delete(a)
              })
          },
          { immediate: !0 }
        ),
        m(() => {
          o(), (n = window.setInterval(o, e.pollIntervalMs))
        }),
        _(() => {
          n && window.clearInterval(n), l.forEach((e) => window.clearTimeout(e)), l.clear()
        }),
        () =>
          r('div', { class: 'client-notification-host', 'aria-live': 'polite', 'aria-atomic': 'false' }, [
            s.value.map((e) =>
              r(
                'article',
                {
                  class: ['client-notification', `is-${e.level}`],
                  key: e.id,
                  role: 'status',
                  style: { '--client-notification-duration': `${e.durationMs}ms` }
                },
                [
                  r('div', { class: 'client-notification__level-strip' }, null),
                  r('div', { class: 'client-notification__inner' }, [
                    r('div', { class: 'client-notification__icon', 'aria-hidden': 'true' }, [
                      r(f, { size: 18, component: we[e.level] }, null)
                    ]),
                    r('div', { class: 'client-notification__body' }, [
                      r('div', { class: 'client-notification__head' }, [
                        r(
                          'span',
                          { class: ['client-notification__level-tag', `client-notification__level-tag--${e.level}`] },
                          [ke[e.level]]
                        ),
                        e.service ? r('span', { class: 'client-notification__service' }, [e.service]) : null
                      ]),
                      r('div', { class: 'client-notification__title' }, [e.title]),
                      r('div', { class: 'client-notification__content' }, [e.body])
                    ])
                  ]),
                  r(
                    'button',
                    {
                      type: 'button',
                      class: 'client-notification__close',
                      'aria-label': '关闭通知',
                      onClick: () => se(e.id)
                    },
                    [
                      r(
                        f,
                        { size: 12 },
                        {
                          default: () => [
                            r(
                              'svg',
                              {
                                viewBox: '0 0 24 24',
                                fill: 'none',
                                stroke: 'currentColor',
                                'stroke-width': '2.5',
                                'stroke-linecap': 'round'
                              },
                              [
                                r('line', { x1: '18', y1: '6', x2: '6', y2: '18' }, null),
                                r('line', { x1: '6', y1: '6', x2: '18', y2: '18' }, null)
                              ]
                            )
                          ]
                        }
                      )
                    ]
                  ),
                  r('div', { class: 'client-notification__progress' }, [
                    r('div', { class: 'client-notification__progress-bar' }, null)
                  ])
                ]
              )
            )
          ])
      )
    }
  }),
  Se = i({
    name: 'Layout',
    setup() {
      const e = d(10),
        a = d('正在加载应用...'),
        t = O({
          loader: async () => {
            a.value = '正在加载左侧菜单...'
            const t = await s(() => import('./index-DdAVWnYT.js'), __vite__mapDeps([0, 1, 2, 3, 4, 5]))
            return (e.value = 50), t
          },
          delay: 600,
          timeout: 3e3
        }),
        l = O({
          loader: async () => {
            a.value = '正在加载内容面板...'
            const t = await s(() => import('./index-BBX-eGM8.js'), __vite__mapDeps([6, 1, 2, 7]))
            return (e.value = 100), B(() => {}), t
          },
          delay: 600,
          timeout: 3e3
        })
      return (
        m(async () => {
          await U().show()
          let e = await W()
          e || (e = 'granted' === (await K()))
        }),
        () =>
          r('div', { id: 'layout', class: 'layout-root', 'data-tauri-drag-region': !0 }, [
            r('div', { class: 'layout-root__action-bar', 'data-tauri-drag-region': !0 }, [
              r(
                R,
                { maxW: !0, shrink: !1, topWinLable: 'home', showSlot: !0, plain: !0 },
                { default: () => r(_e, null, null) }
              )
            ]),
            r(Ce, null, null),
            r(P, null, {
              default: () =>
                r('div', { class: 'layout-root__body' }, [
                  r(F, null, [r(t, null, null)]),
                  r(F, null, [r(l, null, null)])
                ]),
              fallback: () =>
                r('div', { class: 'layout-root__fallback' }, [
                  r(ue, { loadingText: a.value, percentage: e.value }, null)
                ])
            })
          ])
      )
    }
  })
export { Se as default }
