import {
  p as e,
  a8 as o,
  x as a,
  a0 as i,
  y as s,
  a1 as l,
  z as r,
  a2 as n,
  a9 as t,
  Z as d,
  a3 as c,
  a4 as u,
  w as m,
  aa as g,
  ab as w,
  ac as p,
  ad as f,
  ae as v,
  af as _,
  ag as h,
  ah as C,
  $ as y,
  ai as k,
  t as T,
  aj as V,
  X as x,
  ak as b,
  al as z
} from './invariable-DewVS0br.js'
import { u as A, W as q } from './index-BoGL2l6m.js'
import { u as P, g as E, a as S, b as M, p as Z, r as L, c as I, s as D, Q as $ } from './index-DFkcx8xz.js'
import { u as H, e as O, h as j, p as B, L as U } from './Crypto-BAGNQh5_.js'
import './request-BiInMBwl.js'
import { l as N, v as R, g as W, a as F, r as Q, f as K } from './auth-CpdnJA9r.js'
import { g as X } from './user-CjErkjef.js'
import './useMitt-UjCuZB1B.js'
const G = e({
    name: 'LoginWindowContentEmail',
    props: { protocol: { type: Boolean, default: !0 } },
    emits: ['switchMode'],
    setup(e, { emit: V }) {
      const { loginHistories: x, addLoginHistory: b, removeLoginHistory: z } = H(),
        { isOnline: q } = o(),
        $ = P(),
        { login: j } = a($),
        B = y(),
        { createWebviewWindow: U } = A(),
        W = S(),
        F = E(),
        Q = i(F.accessToken),
        K = i(F.refreshToken),
        G = i(j.value.autoLogin && Q.value && K.value),
        J = s({
          loading: !1,
          arrowStatus: !1,
          info: { email: '', password: '', avatar: '', nickname: '', userId: '', remember: !0 },
          emailPH: '请输入邮箱',
          passwordPH: '请输入密码',
          loginDisabled: !q.value,
          emailValid: !1,
          passwordValid: !1,
          passwordErrorMsg: '',
          validCode: '',
          validCodeValid: !1,
          validCodeErrorMsg: '',
          countdown: 0,
          countdownTimer: null,
          showLoginError: !1
        }),
        Y = l(() => (q.value ? (G.value ? '自动登录' : '登录') : '网络异常')),
        ee = l(() => (J.countdown > 0 ? `${J.countdown}秒后可重新发送` : '获取验证码'))
      r(() => {
        J.loginDisabled = !(J.info.email && J.info.password && J.validCode && q.value)
      }),
        n(
          q,
          (e) => {
            ;(J.loginDisabled = !e), e || window.$message.error('网络连接异常，请检查网络设置后重试')
          },
          { immediate: !0 }
        )
      const oe = t(async () => {
          if (!J.loading)
            if (e.protocol)
              if (
                ((J.emailValid = !1),
                (J.passwordValid = !1),
                (J.validCodeValid = !1),
                (J.showLoginError = !1),
                /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/.test(J.info.email))
              ) {
                if (J.info.password.length < 6 || J.info.password.length > 32)
                  return (J.passwordValid = !0), void (J.passwordErrorMsg = '密码长度应为6-32位')
                if (!J.validCode || 6 !== J.validCode.length)
                  return (J.validCodeValid = !0), void (J.validCodeErrorMsg = '请输入6位验证码')
                try {
                  J.loading = !0
                  const e = O(J.info.password, 'E9CC7F1A9661D6824589279A8D465'),
                    a = await N({ email: J.info.email, hash: e, code: J.validCode }),
                    i = a.token || a.accessToken || a.access_token,
                    s = a.refreshToken || a.refresh_token,
                    l = i,
                    r = s
                  I({ accessToken: l, refreshToken: r }), (l || r) && (await D({ accessToken: l, refreshToken: r }))
                  const n = a.userId || J.info.userId,
                    t = M()
                  let d = a.userInfo || ((null == t ? void 0 : t.userId) === n ? t : void 0)
                  if (!(null == d ? void 0 : d.userId) && n)
                    try {
                      d = await X(n)
                    } catch (o) {}
                  const c = {
                    userId: (null == d ? void 0 : d.userId) || n,
                    email: J.info.email,
                    hash: J.info.remember ? J.info.password : void 0,
                    avatar: (null == d ? void 0 : d.avatar) || J.info.avatar || 'star_1',
                    nickName:
                      (null == d ? void 0 : d.nickName) ||
                      (null == d ? void 0 : d.nickname) ||
                      J.info.nickname ||
                      J.info.email,
                    client: (null == d ? void 0 : d.client) || 'desktop',
                    isAdmin: (null == d ? void 0 : d.isAdmin) || !1,
                    status: (null == d ? void 0 : d.status) || 'active',
                    lastActiveAt: (null == d ? void 0 : d.lastActiveAt) || new Date().toISOString(),
                    isOnboardingCompleted: null == d ? void 0 : d.isOnboardingCompleted
                  }
                  Z(c), J.info.remember && b(c), ($.login.autoLogin = J.info.remember)
                  const u = (() => {
                      try {
                        const e = T()
                        return 'windows' === e || 'linux' === e || 'macos' === e
                      } catch (o) {
                        return !0
                      }
                    })(),
                    m = L(u, c)
                  setTimeout(async () => {
                    if (u) {
                      const e = C()
                      if ('StarLight' === e.label || 'home' === e.label || 'onboarding' === e.label) B.push({ name: m })
                      else {
                        const e = await U('StarLight', m, 1080, 720, 'login', !0)
                        ;(l || r) && (await e.emit('auth-token', { accessToken: l, refreshToken: r }))
                      }
                    } else B.push({ name: m })
                  }, 1e3)
                } catch (a) {
                  ;(J.validCode = ''), (J.showLoginError = !0)
                } finally {
                  J.loading = !1
                }
              } else J.emailValid = !0
            else window.$message.warning('请先阅读并同意《星光服务协议》和《星光隐私保护指引》')
        }, 500),
        ae = () => {
          V('switchMode', 'forget')
        },
        ie = t(async () => {
          if (!(J.countdown > 0)) {
            if (!/^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/.test(J.info.email))
              return (J.emailValid = !0), void window.$message.error('请填写正确的邮箱帐号')
            ;(J.countdown = 60),
              (J.countdownTimer = setInterval(() => {
                J.countdown--, J.countdown <= 0 && (clearInterval(J.countdownTimer), (J.countdownTimer = null))
              }, 1e3))
            try {
              await R({ email: J.info.email, type: 'login' })
            } catch (e) {
              clearInterval(J.countdownTimer), (J.countdownTimer = null), (J.countdown = 0)
            }
          }
        }, 500)
      d(() => {
        J.countdownTimer && (clearInterval(J.countdownTimer), (J.countdownTimer = null)),
          document.removeEventListener('keydown', se)
      }),
        c(async () => {
          G.value &&
            (async () => {
              if (e.protocol && G.value)
                try {
                  J.loading = !0
                  const e = M()
                  if (!(null == e ? void 0 : e.userId)) throw new Error('missing cached user info')
                  const o = await X(e.userId),
                    a = {
                      ...e,
                      ...o,
                      isAdmin: 'boolean' == typeof (null == o ? void 0 : o.isAdmin) ? o.isAdmin : Boolean(e.isAdmin)
                    }
                  Z(a)
                  const i = L(!0, a)
                  setTimeout(async () => {
                    await U('StarLight', i, 1080, 720, 'login', !0), (J.loading = !1)
                  }, 1e3)
                } catch (o) {
                  J.loading = !1
                }
            })(),
            document.addEventListener('keydown', se),
            W.addListener(
              u('auth-token-request', async () => {
                const { accessToken: e, refreshToken: o } = E()
                ;(e || o) && (await D({ accessToken: e, refreshToken: o }))
              })
            )
        })
      const se = (e) => {
        'Enter' === e.key && oe()
      }
      return () => {
        let e
        return m(
          g,
          { class: 'login-email', size: 0, vertical: !0 },
          {
            default: () => {
              return [
                m('div', { class: 'email-input' }, [
                  m(
                    w,
                    {
                      size: 'large',
                      maxlength: 32,
                      minlength: 6,
                      value: J.info.email,
                      onUpdateValue: (e) => {
                        ;(J.info.email = e), (J.emailValid = !1)
                      },
                      type: 'text',
                      placeholder: J.emailPH,
                      clearable: !0,
                      inputProps: { inputmode: 'email' },
                      onBlur: () => {
                        J.info.email.length > 0
                          ? /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/.test(J.info.email)
                            ? (J.emailValid = !1)
                            : (J.emailValid = !0)
                          : (J.emailValid = !1)
                      }
                    },
                    {
                      suffix: () =>
                        x.length > 0
                          ? m(
                              'div',
                              {
                                class: 'login-email__history-toggle',
                                onClick: () => {
                                  J.arrowStatus = !J.arrowStatus
                                }
                              },
                              [
                                J.arrowStatus
                                  ? m('svg', { class: 'down login-email__history-arrow' }, [
                                      m('use', { href: '#up' }, null)
                                    ])
                                  : m('svg', { class: 'down login-email__history-arrow' }, [
                                      m('use', { href: '#down' }, null)
                                    ])
                              ]
                            )
                          : null
                    }
                  )
                ]),
                J.emailValid
                  ? m('div', { class: 'login-email__error login-email__error--email' }, [
                      m('span', null, [p('请输入有效的邮箱账号')])
                    ])
                  : null,
                x.length > 0 && J.arrowStatus
                  ? m('div', { class: 'account-box login-email__history-box' }, [
                      m(
                        f,
                        { style: { maxHeight: '176px' }, trigger: 'hover' },
                        ((o = e =
                          x.map((e, o) =>
                            m(
                              g,
                              {
                                key: e.userId || o,
                                vertical: !0,
                                class: 'login-history-item login-email__history-item'
                              },
                              {
                                default: () => [
                                  m(
                                    'div',
                                    {
                                      class: 'account-item login-email__account-row',
                                      onClick: () => {
                                        var o
                                        ;(o = e),
                                          (J.info.email = o.email),
                                          (J.info.password = o.hash || ''),
                                          (J.info.avatar = o.avatar),
                                          (J.info.nickname = o.nickName),
                                          (J.info.userId = o.userId),
                                          (J.arrowStatus = !1)
                                      }
                                    },
                                    [
                                      m('div', { class: 'login-email__account-main' }, [
                                        m(v, { class: 'login-email__account-avatar', src: e.avatar }, null),
                                        m('div', { class: 'login-email__account-text' }, [
                                          m('p', { class: 'login-email__account-name' }, [e.nickName || e.email]),
                                          m('p', { class: 'login-email__account-email' }, [e.email])
                                        ])
                                      ]),
                                      m(
                                        'svg',
                                        {
                                          class: 'login-email__account-delete',
                                          onClick: (o) => {
                                            var a
                                            ;(a = e),
                                              o.stopPropagation(),
                                              window.$dialog.warning({
                                                title: '删除账号',
                                                content: `确定要删除账号 ${a.email} 吗？`,
                                                positiveText: '确定',
                                                negativeText: '取消',
                                                onPositiveClick: () => {
                                                  z(a), window.$message.success('删除成功')
                                                }
                                              })
                                          }
                                        },
                                        [m('use', { href: '#close' }, null)]
                                      )
                                    ]
                                  )
                                ]
                              }
                            )
                          )),
                        'function' == typeof o || ('[object Object]' === Object.prototype.toString.call(o) && !k(o))
                          ? e
                          : { default: () => [e] })
                      )
                    ])
                  : null,
                m('div', { class: 'password-input password-input--spaced' }, [
                  m(
                    w,
                    {
                      size: 'large',
                      maxlength: 32,
                      minlength: 6,
                      value: J.info.password,
                      onUpdateValue: (e) => {
                        ;(J.info.password = e), (J.passwordValid = !1)
                      },
                      showPasswordOn: 'click',
                      type: 'password',
                      placeholder: J.passwordPH,
                      clearable: !0
                    },
                    null
                  )
                ]),
                J.passwordValid
                  ? m('div', { class: 'login-email__error login-email__error--password' }, [
                      m('span', null, [J.passwordErrorMsg])
                    ])
                  : null,
                m('div', { class: 'password-input password-input--compact' }, [
                  m(
                    w,
                    {
                      size: 'large',
                      maxlength: 6,
                      value: J.validCode,
                      onUpdateValue: (e) => {
                        ;(J.validCode = e), (J.validCodeValid = !1)
                      },
                      type: 'text',
                      placeholder: '请输入验证码',
                      clearable: !0
                    },
                    {
                      suffix: () =>
                        m('div', { class: 'login-email__code-action-wrap', onClick: ie }, [
                          m(
                            'span',
                            { class: ['login-email__code-action', J.countdown > 0 ? 'is-waiting' : 'is-ready'] },
                            [ee.value]
                          )
                        ])
                    }
                  )
                ]),
                J.validCodeValid
                  ? m('div', { class: 'login-email__error login-email__error--code' }, [
                      m('span', null, [J.validCodeErrorMsg])
                    ])
                  : null,
                m(
                  g,
                  {
                    justify: 'space-between',
                    class: ['login-email__options', J.validCodeValid ? 'has-code-error' : '']
                  },
                  {
                    default: () => [
                      m(
                        g,
                        { justify: 'left', size: 6 },
                        {
                          default: () => [
                            m(
                              _,
                              {
                                checked: J.info.remember,
                                onUpdateChecked: (e) => {
                                  J.info.remember = e
                                }
                              },
                              null
                            ),
                            m('div', { class: 'login-email__option-text' }, [
                              m('span', { class: 'login-email__option-link' }, [p('记住密码')])
                            ])
                          ]
                        }
                      ),
                      m('div', { class: 'login-email__option-text', onClick: ae }, [
                        m('span', { class: 'login-email__option-link' }, [p('忘记密码')])
                      ])
                    ]
                  }
                ),
                m(
                  h,
                  {
                    loading: J.loading,
                    class: 'login-email__submit',
                    onClick: oe,
                    type: 'primary',
                    disabled: J.loginDisabled
                  },
                  { default: () => [m('span', null, [Y.value])] }
                )
              ]
              var o
            }
          }
        )
      }
    }
  }),
  J = e({
    name: 'LoginWindowContentQRCode',
    props: { protocol: { type: Boolean, default: !0 } },
    setup(e, { slots: l }) {
      const { isOnline: r } = o(),
        n = P(),
        { login: t } = a(n),
        { createWebviewWindow: w } = A(),
        f = S(),
        v = E()
      i(v.accessToken), i(v.refreshToken)
      const _ = y(),
        k = s({
          loading: !1,
          QRCode: '',
          qrStatus: 'loading',
          statusText: '正在生成二维码...',
          qrCodeKey: '',
          pollingTimer: null,
          retryCount: 0,
          maxRetryCount: 3,
          statusFailureCount: 0,
          expirationTimer: null,
          retryTimer: null
        })
      let x = 0,
        b = null
      const z = async () => {
          O()
          const e = ++x
          try {
            ;(k.loading = !0), (k.qrStatus = 'loading'), (k.statusText = '正在生成二维码...')
            const o = await W()
            if (e !== x) return
            if (!(null == o ? void 0 : o.code)) throw new Error('获取二维码失败')
            ;(k.QRCode = o.code),
              (k.qrCodeKey = o.code),
              (k.qrStatus = 'waiting'),
              (k.statusText = ''),
              (k.retryCount = 0),
              (k.statusFailureCount = 0),
              q(e)
          } catch (o) {
            if (e !== x) return
            ;(k.qrStatus = 'error'),
              (k.statusText = '生成二维码失败，请重试'),
              k.retryCount++,
              k.retryCount < k.maxRetryCount &&
                (k.retryTimer && (clearTimeout(k.retryTimer), (k.retryTimer = null)),
                (k.retryTimer = setTimeout(() => {
                  e === x && z()
                }, 3e3)))
          } finally {
            k.loading = !1
          }
        },
        q = (o) => {
          H(),
            (k.pollingTimer = setInterval(() => {
              ;(async (a) => {
                var i
                if (a === x && k.qrCodeKey && b !== a) {
                  b = a
                  try {
                    const s = await F({ code: k.qrCodeKey })
                    if (a !== x) return
                    if (s)
                      switch (((k.statusFailureCount = 0), s.status)) {
                        case $.PENDING:
                          ;(k.qrStatus = 'waiting'), (k.statusText = '')
                          break
                        case $.SCANNED:
                          ;(k.qrStatus = 'scanned'), (k.statusText = '已扫描，请在手机上确认')
                          break
                        case $.CONFIRMED:
                          if (!e.protocol) {
                            ;(k.qrStatus = 'scanned'),
                              (k.statusText = '请先阅读并同意服务协议与隐私保护指引后重新扫码'),
                              H(),
                              window.$message.warning('请先阅读并同意《星光服务协议》和《星光隐私保护指引》')
                            break
                          }
                          ;(k.qrStatus = 'success'), (k.statusText = '登录成功'), H()
                          const a = s.token || s.accessToken || s.access_token,
                            l = s.refreshToken || s.refresh_token
                          I({ accessToken: a, refreshToken: l }),
                            (a || l) && (await D({ accessToken: a, refreshToken: l }))
                          const r = (null == (i = s.userInfo) ? void 0 : i.userId) || s.userId || '',
                            n = M()
                          let t = s.userInfo || ((null == n ? void 0 : n.userId) === r ? n : void 0)
                          if (r)
                            try {
                              t = await X(r)
                            } catch (o) {}
                          if (r) {
                            const e = {
                              userId: (null == t ? void 0 : t.userId) || r,
                              email: (null == t ? void 0 : t.email) || '',
                              avatar: (null == t ? void 0 : t.avatar) || 'star_1',
                              nickName:
                                (null == t ? void 0 : t.nickName) ||
                                (null == t ? void 0 : t.nickname) ||
                                (null == t ? void 0 : t.email) ||
                                '',
                              client: (null == t ? void 0 : t.client) || 'desktop',
                              isAdmin: (null == t ? void 0 : t.isAdmin) || !1,
                              status: (null == t ? void 0 : t.status) || 'active',
                              lastActiveAt: (null == t ? void 0 : t.lastActiveAt) || new Date().toISOString(),
                              isOnboardingCompleted: null == t ? void 0 : t.isOnboardingCompleted
                            }
                            Z(e)
                            const o = (() => {
                                try {
                                  const e = T()
                                  return 'windows' === e || 'linux' === e || 'macos' === e
                                } catch (e) {
                                  return !0
                                }
                              })(),
                              i = L(o, e)
                            setTimeout(async () => {
                              if (o) {
                                const e = C()
                                if ('StarLight' === e.label || 'home' === e.label || 'onboarding' === e.label)
                                  _.push({ name: i })
                                else {
                                  const e = await w('StarLight', i, 1080, 720, 'login', !0)
                                  ;(a || l) && (await e.emit('auth-token', { accessToken: a, refreshToken: l }))
                                }
                              } else _.push({ name: i })
                            }, 1e3)
                          }
                          break
                        case $.EXPIRED:
                          ;(k.qrStatus = 'expired'), (k.statusText = '二维码已过期，点击刷新'), H()
                          break
                        case $.CANCELLED:
                          ;(k.qrStatus = 'waiting'), (k.statusText = '已取消，请重新扫描')
                      }
                  } catch (o) {
                    if (a !== x) return
                    ;(k.statusFailureCount += 1),
                      k.statusFailureCount >= k.maxRetryCount
                        ? ((k.qrStatus = 'error'), (k.statusText = '二维码状态更新失败，请刷新后重试'), H())
                        : (k.statusText = '状态更新失败，正在重试…')
                  } finally {
                    b === a && (b = null)
                  }
                }
              })(o)
            }, 2e3)),
            k.expirationTimer && (clearTimeout(k.expirationTimer), (k.expirationTimer = null)),
            (k.expirationTimer = setTimeout(() => {
              if ('waiting' === k.qrStatus || 'scanned' === k.qrStatus) {
                if (o !== x) return
                ;(k.qrStatus = 'expired'), (k.statusText = '二维码已过期，点击刷新'), H()
              }
            }, 12e4))
        },
        H = () => {
          k.pollingTimer && (clearInterval(k.pollingTimer), (k.pollingTimer = null))
        },
        O = () => {
          k.pollingTimer && (clearInterval(k.pollingTimer), (k.pollingTimer = null)),
            k.expirationTimer && (clearTimeout(k.expirationTimer), (k.expirationTimer = null)),
            k.retryTimer && (clearTimeout(k.retryTimer), (k.retryTimer = null))
        }
      d(() => {
        ;(x += 1), O()
      })
      const j = () => {
          H(), z()
        },
        B = () => 'expired' === k.qrStatus || 'error' === k.qrStatus,
        U = () => {
          switch (k.qrStatus) {
            case 'loading':
              return m('div', { class: 'login-qrcode__status-icon login-qrcode__status-icon--loading' }, [
                m('svg', { viewBox: '0 0 24 24', fill: 'none' }, [
                  m(
                    'circle',
                    {
                      cx: '12',
                      cy: '12',
                      r: '10',
                      stroke: 'currentColor',
                      'stroke-width': '2',
                      'stroke-dasharray': '31.416',
                      'stroke-dashoffset': '31.416',
                      opacity: '0.3'
                    },
                    null
                  ),
                  m(
                    'circle',
                    {
                      cx: '12',
                      cy: '12',
                      r: '10',
                      stroke: 'currentColor',
                      'stroke-width': '2',
                      'stroke-dasharray': '31.416',
                      'stroke-dashoffset': '23.562',
                      'stroke-linecap': 'round'
                    },
                    null
                  )
                ])
              ])
            case 'scanned':
              return m('div', { class: 'login-qrcode__status-icon login-qrcode__status-icon--scanned' }, [
                m('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
                  m(
                    'path',
                    {
                      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
                    },
                    null
                  )
                ])
              ])
            case 'expired':
              return m('div', { class: 'login-qrcode__status-icon login-qrcode__status-icon--expired' }, [
                m('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
                  m(
                    'path',
                    {
                      d: 'M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z'
                    },
                    null
                  )
                ])
              ])
            case 'error':
              return m('div', { class: 'login-qrcode__status-icon login-qrcode__status-icon--error' }, [
                m('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
                  m(
                    'path',
                    { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z' },
                    null
                  )
                ])
              ])
            case 'success':
              return m('div', { class: 'login-qrcode__status-icon login-qrcode__status-icon--success' }, [
                m('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
                  m(
                    'path',
                    {
                      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
                    },
                    null
                  )
                ])
              ])
            default:
              return null
          }
        },
        N = () => {
          switch (k.qrStatus) {
            case 'loading':
              return 'login-qrcode__status--loading'
            case 'scanned':
              return 'login-qrcode__status--scanned'
            case 'expired':
              return 'login-qrcode__status--expired'
            case 'error':
              return 'login-qrcode__status--error'
            case 'success':
              return 'login-qrcode__status--success'
            default:
              return 'login-qrcode__status--waiting'
          }
        }
      return (
        d(() => {
          H()
        }),
        c(async () => {
          if (
            (f.addListener(
              u('auth-token-request', async () => {
                const { accessToken: e, refreshToken: o } = E()
                ;(e || o) && (await D({ accessToken: e, refreshToken: o }))
              })
            ),
            !r.value)
          )
            return (k.qrStatus = 'error'), void (k.statusText = '网络连接异常，请检查网络')
          await z()
        }),
        () =>
          m(
            g,
            { class: 'login-qrcode', size: 0, vertical: !0 },
            {
              default: () => [
                m('div', { class: 'title login-qrcode__title' }, [
                  p('请打开'),
                  m('span', { class: 'login-qrcode__title-link' }, [p('星光 App')]),
                  p('扫一扫')
                ]),
                m('div', { class: 'login-qrcode__stage', 'aria-label': '登录二维码区域' }, [
                  k.loading
                    ? m('div', { class: 'login-qrcode__placeholder', role: 'status', 'aria-label': '正在生成二维码' }, [
                        m('div', { class: 'login-qrcode__placeholder-spinner' }, [
                          m(
                            'svg',
                            {
                              class: 'login-qrcode__placeholder-spinner-icon',
                              viewBox: '0 0 24 24',
                              fill: 'none',
                              'aria-hidden': 'true'
                            },
                            [
                              m(
                                'circle',
                                {
                                  cx: '12',
                                  cy: '12',
                                  r: '10',
                                  stroke: 'currentColor',
                                  'stroke-width': '2',
                                  opacity: '0.3'
                                },
                                null
                              ),
                              m(
                                'circle',
                                {
                                  cx: '12',
                                  cy: '12',
                                  r: '10',
                                  stroke: 'currentColor',
                                  'stroke-width': '2',
                                  'stroke-linecap': 'round'
                                },
                                null
                              )
                            ]
                          )
                        ])
                      ])
                    : k.QRCode
                      ? m('div', { class: ['login-qrcode__qr-slot', { 'login-qrcode__qr-slot--obscured': B() }] }, [
                          m(
                            V,
                            {
                              size: 168,
                              padding: 12,
                              value: k.QRCode,
                              iconSrc: '/logo.png',
                              errorCorrectionLevel: 'H',
                              class: 'login-qrcode__qr'
                            },
                            null
                          )
                        ])
                      : m('div', { class: 'login-qrcode__placeholder', 'aria-hidden': 'true' }, null),
                  B() &&
                    m('div', { class: 'login-qrcode__refresh-overlay', role: 'group', 'aria-label': '二维码已失效' }, [
                      m('div', { class: 'login-qrcode__refresh-copy' }, [
                        m('strong', null, ['expired' === k.qrStatus ? '二维码已过期' : '二维码状态异常']),
                        m('span', null, [p('请刷新后重新扫码')])
                      ]),
                      m(
                        h,
                        { class: 'login-qrcode__refresh', type: 'primary', size: 'small', onClick: j },
                        { default: () => [p('重新生成二维码')] }
                      )
                    ])
                ]),
                m('div', { class: ['login-qrcode__status', N()], role: 'status', 'aria-live': 'polite' }, [
                  'waiting' !== k.qrStatus && U(),
                  m('div', { class: 'login-qrcode__status-copy' }, [k.statusText || '请使用星光 App 扫描二维码登录'])
                ]),
                !r.value &&
                  m('div', { class: 'login-qrcode__network-error' }, [
                    m('div', { class: 'login-qrcode__network-error-content' }, [
                      m(
                        'svg',
                        { class: 'login-qrcode__network-error-icon', viewBox: '0 0 24 24', fill: 'currentColor' },
                        [
                          m(
                            'path',
                            {
                              d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
                            },
                            null
                          )
                        ]
                      ),
                      m('span', { class: 'login-qrcode__network-error-text' }, [p('网络连接异常，请检查网络设置')])
                    ])
                  ])
              ]
            }
          )
      )
    }
  }),
  Y = e({
    name: 'LoginWindowContentRegister',
    props: { protocol: { type: Boolean, default: !0 } },
    emits: ['switchMode'],
    setup(e, { slots: a, emit: i }) {
      const { isOnline: c } = o(),
        u = s({
          loading: !1,
          info: { email: '', password: '', confirmPassword: '' },
          emailPH: '请输入邮箱',
          passwordPH: '请输入密码',
          confirmPasswordPH: '请确认密码',
          registerDisabled: !c.value,
          emailValid: !1,
          passwordValid: !1,
          confirmPasswordValid: !1,
          passwordErrorMsg: '',
          confirmPasswordErrorMsg: '',
          validCode: '',
          validCodeValid: !1,
          validCodeErrorMsg: '',
          countdown: 0,
          countdownTimer: null
        }),
        f = l(() => (c.value ? '注册' : '网络异常')),
        v = l(() => (u.countdown > 0 ? `${u.countdown}秒后可重新发送` : '获取验证码'))
      r(() => {
        u.registerDisabled = !(u.info.email && u.info.password && u.info.confirmPassword && u.validCode && c.value)
      }),
        n(c, (e) => {
          u.registerDisabled = !e
        })
      const _ = t(async () => {
          if (!u.loading)
            if (e.protocol)
              if (
                ((u.emailValid = !1),
                (u.passwordValid = !1),
                (u.confirmPasswordValid = !1),
                (u.validCodeValid = !1),
                /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/.test(u.info.email))
              ) {
                if (u.info.password.length < 6 || u.info.password.length > 32)
                  return (u.passwordValid = !0), void (u.passwordErrorMsg = '密码长度应为6-32位')
                if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,32}$/.test(u.info.password))
                  return (u.passwordValid = !0), void (u.passwordErrorMsg = '密码必须包含字母和数字')
                if (u.info.password !== u.info.confirmPassword)
                  return (u.confirmPasswordValid = !0), void (u.confirmPasswordErrorMsg = '两次输入的密码不一致')
                if (!u.validCode || 6 !== u.validCode.length)
                  return (u.validCodeValid = !0), void (u.validCodeErrorMsg = '请输入6位验证码')
                try {
                  u.loading = !0
                  const e = 'E9CC7F1A9661D6824589279A8D465',
                    o = O(u.info.password, e),
                    a = { email: u.info.email, hash: o, code: u.validCode }
                  await Q(a),
                    window.$message.success('注册成功，跳转到登录页面'),
                    (u.info.email = ''),
                    (u.info.password = ''),
                    (u.info.confirmPassword = ''),
                    (u.validCode = ''),
                    setTimeout(() => {
                      i('switchMode', 'login')
                    }, 1e3)
                } catch (o) {
                  u.validCode = ''
                } finally {
                  u.loading = !1
                }
              } else u.emailValid = !0
            else window.$message.warning('请先阅读并同意《星光服务协议》和《星光隐私保护指引》')
        }, 500),
        C = t(async () => {
          if (!(u.countdown > 0)) {
            if (!/^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/.test(u.info.email))
              return (u.emailValid = !0), void window.$message.error('请填写正确的邮箱帐号')
            ;(u.countdown = 60),
              (u.countdownTimer = setInterval(() => {
                u.countdown--, u.countdown <= 0 && (clearInterval(u.countdownTimer), (u.countdownTimer = null))
              }, 1e3))
            try {
              await R({ email: u.info.email, type: 'register' })
            } catch (e) {
              clearInterval(u.countdownTimer), (u.countdownTimer = null), (u.countdown = 0)
            }
          }
        }, 500)
      return (
        d(() => {
          u.countdownTimer && (clearInterval(u.countdownTimer), (u.countdownTimer = null))
        }),
        () =>
          m(
            g,
            { class: 'login-register', size: 0, vertical: !0 },
            {
              default: () => [
                m(
                  w,
                  {
                    class: 'email-input',
                    size: 'large',
                    maxlength: 32,
                    minlength: 6,
                    value: u.info.email,
                    onUpdateValue: (e) => {
                      ;(u.info.email = e), (u.emailValid = !1)
                    },
                    type: 'text',
                    placeholder: u.emailPH,
                    clearable: !0,
                    onBlur: () => {
                      u.info.email.length > 0
                        ? /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/.test(u.info.email)
                          ? (u.emailValid = !1)
                          : (u.emailValid = !0)
                        : (u.emailValid = !1)
                    }
                  },
                  null
                ),
                u.emailValid
                  ? m('div', { class: 'login-register__error login-register__error--email' }, [
                      m('span', null, [p('请输入有效的邮箱账号')])
                    ])
                  : null,
                m(
                  w,
                  {
                    class: 'password-input password-input--spaced',
                    size: 'large',
                    maxlength: 32,
                    minlength: 6,
                    value: u.info.password,
                    onUpdateValue: (e) => {
                      ;(u.info.password = e), (u.passwordValid = !1)
                    },
                    showPasswordOn: 'click',
                    type: 'password',
                    placeholder: u.passwordPH,
                    clearable: !0
                  },
                  null
                ),
                u.passwordValid
                  ? m('div', { class: 'login-register__error login-register__error--password' }, [
                      m('span', null, [u.passwordErrorMsg])
                    ])
                  : null,
                m(
                  w,
                  {
                    class: 'password-input password-input--spaced',
                    size: 'large',
                    maxlength: 32,
                    minlength: 6,
                    value: u.info.confirmPassword,
                    onUpdateValue: (e) => {
                      ;(u.info.confirmPassword = e), (u.confirmPasswordValid = !1)
                    },
                    showPasswordOn: 'click',
                    type: 'password',
                    placeholder: u.confirmPasswordPH,
                    clearable: !0
                  },
                  null
                ),
                u.confirmPasswordValid
                  ? m('div', { class: 'login-register__error login-register__error--confirm' }, [
                      m('span', null, [u.confirmPasswordErrorMsg])
                    ])
                  : null,
                m(
                  w,
                  {
                    class: 'password-input password-input--compact',
                    size: 'large',
                    maxlength: 6,
                    value: u.validCode,
                    onUpdateValue: (e) => {
                      ;(u.validCode = e), (u.validCodeValid = !1)
                    },
                    type: 'text',
                    placeholder: '请输入验证码',
                    clearable: !0
                  },
                  {
                    suffix: () =>
                      m('div', { onClick: C }, [
                        m(
                          'span',
                          { class: ['login-register__code-action', u.countdown > 0 ? 'is-waiting' : 'is-ready'] },
                          [v.value]
                        )
                      ])
                  }
                ),
                u.validCodeValid
                  ? m('div', { class: 'login-register__error login-register__error--code' }, [
                      m('span', null, [u.validCodeErrorMsg])
                    ])
                  : null,
                m(
                  h,
                  {
                    loading: u.loading,
                    class: 'login-register__submit',
                    onClick: _,
                    type: 'primary',
                    disabled: u.registerDisabled
                  },
                  { default: () => [m('span', null, [f.value])] }
                )
              ]
            }
          )
      )
    }
  }),
  ee = e({
    name: 'LoginWindowContentForget',
    props: { protocol: { type: Boolean, default: !0 } },
    emits: ['switchMode'],
    setup(e, { slots: a, emit: i }) {
      const { isOnline: c } = o(),
        u = s({
          loading: !1,
          info: { email: '', password: '', confirmPassword: '' },
          emailPH: '请输入邮箱',
          passwordPH: '请输入新密码',
          confirmPasswordPH: '请确认新密码',
          resetDisabled: !c.value,
          emailValid: !1,
          passwordValid: !1,
          confirmPasswordValid: !1,
          passwordErrorMsg: '',
          confirmPasswordErrorMsg: '',
          validCode: '',
          validCodeValid: !1,
          validCodeErrorMsg: '',
          countdown: 0,
          countdownTimer: null
        }),
        f = l(() => (c.value ? '重置密码' : '网络异常')),
        v = l(() => (u.countdown > 0 ? `${u.countdown}秒后可重新发送` : '获取验证码'))
      r(() => {
        u.resetDisabled = !(u.info.email && u.info.password && u.info.confirmPassword && u.validCode && c.value)
      }),
        n(c, (e) => {
          u.resetDisabled = !e
        })
      const _ = t(async () => {
          if (!u.loading)
            if (e.protocol)
              if (
                ((u.emailValid = !1),
                (u.passwordValid = !1),
                (u.confirmPasswordValid = !1),
                (u.validCodeValid = !1),
                /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/.test(u.info.email))
              ) {
                if (u.info.password.length < 6 || u.info.password.length > 32)
                  return (u.passwordValid = !0), void (u.passwordErrorMsg = '密码长度应为6-32位')
                if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,32}$/.test(u.info.password))
                  return (u.passwordValid = !0), void (u.passwordErrorMsg = '密码必须包含字母和数字')
                if (u.info.password !== u.info.confirmPassword)
                  return (u.confirmPasswordValid = !0), void (u.confirmPasswordErrorMsg = '两次输入的密码不一致')
                if (!u.validCode || 6 !== u.validCode.length)
                  return (u.validCodeValid = !0), void (u.validCodeErrorMsg = '请输入6位验证码')
                try {
                  u.loading = !0
                  const e = 'E9CC7F1A9661D6824589279A8D465',
                    o = O(u.info.password, e),
                    a = { email: u.info.email, hash: o, code: u.validCode }
                  await K(a),
                    window.$message.success('密码重置成功，跳转到登录页面'),
                    (u.info.email = ''),
                    (u.info.password = ''),
                    (u.info.confirmPassword = ''),
                    (u.validCode = ''),
                    setTimeout(() => {
                      i('switchMode', 'login')
                    }, 1e3)
                } catch (o) {
                  u.validCode = ''
                } finally {
                  u.loading = !1
                }
              } else u.emailValid = !0
            else window.$message.warning('请先阅读并同意《星光服务协议》和《星光隐私保护指引》')
        }, 500),
        C = t(async () => {
          if (!(u.countdown > 0)) {
            if (!/^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/.test(u.info.email))
              return (u.emailValid = !0), void window.$message.error('请填写正确的邮箱帐号')
            ;(u.countdown = 60),
              (u.countdownTimer = setInterval(() => {
                u.countdown--, u.countdown <= 0 && (clearInterval(u.countdownTimer), (u.countdownTimer = null))
              }, 1e3))
            try {
              await R({ email: u.info.email, type: 'forget' })
            } catch (e) {
              clearInterval(u.countdownTimer), (u.countdownTimer = null), (u.countdown = 0)
            }
          }
        }, 500)
      return (
        d(() => {
          u.countdownTimer && (clearInterval(u.countdownTimer), (u.countdownTimer = null))
        }),
        () =>
          m(
            g,
            { class: 'login-forget', size: 0, vertical: !0 },
            {
              default: () => [
                m(
                  w,
                  {
                    class: 'email-input',
                    size: 'large',
                    maxlength: 32,
                    minlength: 6,
                    value: u.info.email,
                    onUpdateValue: (e) => {
                      ;(u.info.email = e), (u.emailValid = !1)
                    },
                    type: 'text',
                    placeholder: u.emailPH,
                    clearable: !0,
                    onBlur: () => {
                      u.info.email.length > 0
                        ? /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/.test(u.info.email)
                          ? (u.emailValid = !1)
                          : (u.emailValid = !0)
                        : (u.emailValid = !1)
                    }
                  },
                  null
                ),
                u.emailValid
                  ? m('div', { class: 'login-forget__error login-forget__error--email' }, [
                      m('span', null, [p('请输入正确的邮箱地址')])
                    ])
                  : null,
                m(
                  w,
                  {
                    class: 'password-input password-input--spaced',
                    size: 'large',
                    maxlength: 32,
                    minlength: 6,
                    value: u.info.password,
                    onUpdateValue: (e) => {
                      ;(u.info.password = e),
                        (u.passwordValid = !1),
                        u.info.confirmPassword && (u.confirmPasswordValid = !1)
                    },
                    type: 'password',
                    placeholder: u.passwordPH,
                    clearable: !0,
                    showPasswordOn: 'click',
                    onBlur: () => {
                      u.info.password.length > 0
                        ? u.info.password.length < 6 || u.info.password.length > 32
                          ? ((u.passwordValid = !0), (u.passwordErrorMsg = '密码长度应为6-32位'))
                          : /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,32}$/.test(u.info.password)
                            ? ((u.passwordValid = !1),
                              u.info.confirmPassword &&
                                u.info.password !== u.info.confirmPassword &&
                                ((u.confirmPasswordValid = !0), (u.confirmPasswordErrorMsg = '两次输入的密码不一致')))
                            : ((u.passwordValid = !0), (u.passwordErrorMsg = '密码必须包含字母和数字'))
                        : (u.passwordValid = !1)
                    }
                  },
                  null
                ),
                u.passwordValid
                  ? m('div', { class: 'login-forget__error login-forget__error--password' }, [
                      m('span', null, [u.passwordErrorMsg])
                    ])
                  : null,
                m(
                  w,
                  {
                    class: 'password-input password-input--spaced',
                    size: 'large',
                    maxlength: 32,
                    minlength: 6,
                    value: u.info.confirmPassword,
                    onUpdateValue: (e) => {
                      ;(u.info.confirmPassword = e), (u.confirmPasswordValid = !1)
                    },
                    showPasswordOn: 'click',
                    type: 'password',
                    placeholder: u.confirmPasswordPH,
                    clearable: !0
                  },
                  null
                ),
                u.confirmPasswordValid
                  ? m('div', { class: 'login-forget__error login-forget__error--confirm' }, [
                      m('span', null, [u.confirmPasswordErrorMsg])
                    ])
                  : null,
                m(
                  w,
                  {
                    class: 'password-input password-input--compact',
                    size: 'large',
                    maxlength: 6,
                    value: u.validCode,
                    onUpdateValue: (e) => {
                      ;(u.validCode = e), (u.validCodeValid = !1)
                    },
                    type: 'text',
                    placeholder: '请输入验证码',
                    clearable: !0
                  },
                  {
                    suffix: () =>
                      m('div', { onClick: C }, [
                        m(
                          'span',
                          { class: ['login-forget__code-action', u.countdown > 0 ? 'is-waiting' : 'is-ready'] },
                          [v.value]
                        )
                      ])
                  }
                ),
                u.validCodeValid
                  ? m('div', { class: 'login-forget__error login-forget__error--code' }, [
                      m('span', null, [u.validCodeErrorMsg])
                    ])
                  : null,
                m(
                  h,
                  {
                    class: 'reset-btn login-forget__submit',
                    type: 'primary',
                    disabled: u.resetDisabled,
                    loading: u.loading,
                    onClick: _
                  },
                  { default: () => [f.value] }
                )
              ]
            }
          )
      )
    }
  }),
  oe = e({
    name: 'LoginWindowContent',
    setup(e, { slots: r }) {
      const { isOnline: t } = o(),
        u = P(),
        { login: w } = a(u),
        f = i(null),
        v = s({ mode: 'login', loginDisabled: !t.value, protocol: j(), activeLegalDocument: null }),
        C = l(() => {
          switch (v.mode) {
            case 'login':
              return '账号登录'
            case 'scan':
              return '扫码登录'
            case 'forget':
              return '忘记密码'
            case 'register':
              return '注册账号'
          }
        })
      n(t, (e) => {
        v.loginDisabled = !e
      }),
        c(async () => {
          try {
            x() && (f.value = await b())
          } catch {
            f.value = null
          }
        }),
        d(() => {})
      const y = (e) => {
          v.mode = e
        },
        k = (e) => {
          v.activeLegalDocument = e
        }
      return () =>
        m('div', { class: 'login-window-content' }, [
          m('div', { class: 'header' }, [
            m('div', { class: 'title' }, [C.value]),
            m('div', { class: 'sub-title' }, [p('还有永不落幕的星光✨，给你宇宙级别的浪漫～')])
          ]),
          m('div', { class: 'content' }, [
            'login' === v.mode ? m(G, { protocol: v.protocol, onSwitchMode: y }, null) : null,
            'scan' === v.mode ? m(J, { protocol: v.protocol }, null) : null,
            'register' === v.mode ? m(Y, { protocol: v.protocol, onSwitchMode: y }, null) : null,
            'forget' === v.mode ? m(ee, { protocol: v.protocol, onSwitchMode: y }, null) : null
          ]),
          m('div', { class: 'footer' }, [
            m(
              g,
              { justify: 'center', class: 'footer-switches', size: 10 },
              {
                default: () => [
                  m(
                    'div',
                    {
                      class: 'footer-switch-item',
                      onClick: () => {
                        'forget' === v.mode
                          ? (v.mode = 'login')
                          : 'register' !== v.mode
                            ? (v.mode = 'register')
                            : (v.mode = 'login')
                      }
                    },
                    [
                      m('span', { class: 'footer-switch-link' }, [
                        ' ',
                        'register' === v.mode ? '返回登录' : 'forget' === v.mode ? '账号登录' : '注册账号'
                      ])
                    ]
                  ),
                  m('div', { class: 'footer-switch-divider' }, null),
                  m(
                    'div',
                    {
                      class: 'footer-switch-item',
                      onClick: () => {
                        'scan' !== v.mode ? (v.mode = 'scan') : (v.mode = 'login')
                      }
                    },
                    [m('span', { class: 'footer-switch-link' }, ['scan' === v.mode ? '账号登录' : '扫码登录'])]
                  )
                ]
              }
            ),
            m(
              g,
              { justify: 'center', size: 6 },
              {
                default: () => [
                  m(
                    _,
                    {
                      checked: v.protocol,
                      onUpdateChecked: (e) => {
                        ;(v.protocol = e), B(e)
                      }
                    },
                    null
                  ),
                  m('div', { class: 'footer-agreement' }, [
                    m('span', null, [p('已阅读并同意')]),
                    m('button', { type: 'button', class: 'footer-agreement__link', onClick: () => k('service') }, [
                      p('服务协议')
                    ]),
                    m('span', null, [p('和')]),
                    m('button', { type: 'button', class: 'footer-agreement__link', onClick: () => k('privacy') }, [
                      p('星光隐私保护指引')
                    ])
                  ])
                ]
              }
            ),
            f.value && m('div', { class: 'footer-version' }, [p('版本 v'), f.value])
          ]),
          m(
            z,
            {
              show: null !== v.activeLegalDocument,
              onUpdateShow: (e) => {
                e || (v.activeLegalDocument = null)
              },
              preset: 'card',
              title: 'service' === v.activeLegalDocument ? '星光服务协议' : '星光隐私保护指引',
              class: 'login-window-content__legal-modal',
              style: { width: 'min(680px, calc(100vw - 48px))' },
              closable: !0,
              maskClosable: !1
            },
            {
              default: () =>
                m('div', { class: 'login-window-content__legal-scroll' }, [
                  v.activeLegalDocument && m(U, { kind: v.activeLegalDocument }, null)
                ]),
              action: () => m(h, { onClick: () => (v.activeLegalDocument = null) }, { default: () => [p('关闭')] })
            }
          )
        ])
    }
  }),
  ae = e({
    name: 'LoginWindow',
    setup: (e, { slots: o }) => (
      c(async () => {
        try {
          const e = C()
          await e.show(), await e.setFocus()
        } catch (e) {}
      }),
      () =>
        m('main', { class: 'login-window' }, [
          m(q, { maxW: !1, shrink: !1, plain: !0 }, null),
          m('section', { class: 'login-window__container' }, [m(oe, null, null)])
        ])
    )
  })
export { ae as default }
