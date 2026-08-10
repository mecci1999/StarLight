import { M as e } from './MobileButton-BKhxhz5A.js'
import { m as o } from './MobileToast-CIN42EDh.js'
import { M as a } from './MobileInput-OCuvcoNh.js'
import {
  p as i,
  a1 as l,
  w as r,
  bX as t,
  a3 as n,
  Z as s,
  y as d,
  a0 as c,
  ac as m,
  aR as u,
  bE as g,
  bw as v,
  aS as p,
  $ as w
} from './invariable-DewVS0br.js'
import { M as b } from './MobileAvatar-CtnV-C6Z.js'
import { M as _ } from './MobileSheet-BNn0TOks.js'
import { u as f, h, p as y, L as k, e as C } from './Crypto-BAGNQh5_.js'
import './request-BiInMBwl.js'
import { v as I, l as T, r as A, f as E } from './auth-CpdnJA9r.js'
import { g as V } from './user-CjErkjef.js'
import { u as S, c as D, s as N, b as P, r as R, p as M } from './index-DFkcx8xz.js'
import { M as O } from './MobileVantProvider-BmQB5FA8.js'
const $ = i({
    name: 'MobileCheckbox',
    props: {
      modelValue: { type: Boolean, default: !1 },
      disabled: { type: Boolean, default: !1 },
      label: { type: String, default: '' },
      shape: { type: String, default: 'round' },
      size: { type: String, default: 'small' }
    },
    emits: ['update:modelValue'],
    setup(e, { emit: o }) {
      const a = (e) => {
          o('update:modelValue', e)
        },
        i = l(() => ['mobile-checkbox', `mobile-checkbox--${e.size}`])
      return () =>
        r(
          t,
          {
            modelValue: e.modelValue,
            'onUpdate:modelValue': a,
            disabled: e.disabled,
            shape: e.shape,
            checkedColor: 'var(--color-primary-6)',
            class: i.value
          },
          { default: () => [e.label] }
        )
    }
  }),
  U = (e, o) => (e instanceof Error ? e.message : o),
  x = (e) => 'object' == typeof e && null !== e && !Array.isArray(e),
  L = (e, o) => ('string' == typeof e[o] ? e[o] : void 0),
  j = (e) => {
    if (!x(e)) return
    const o = 'boolean' == typeof e.isAdmin ? e.isAdmin : void 0,
      a = 'boolean' == typeof e.isOnboardingCompleted ? e.isOnboardingCompleted : void 0
    return {
      userId: L(e, 'userId'),
      email: L(e, 'email'),
      avatar: L(e, 'avatar'),
      nickName: L(e, 'nickName') || L(e, 'nickname'),
      client: L(e, 'client'),
      isAdmin: o,
      status: L(e, 'status'),
      lastActiveAt: L(e, 'lastActiveAt'),
      isOnboardingCompleted: a
    }
  },
  z = i({
    name: 'MobileLogin',
    setup() {
      const i = w(),
        t = S(),
        { loginHistories: z, addLoginHistory: F, removeLoginHistory: q } = f(),
        Z = d({
          email: '',
          password: '',
          confirmPassword: '',
          validCode: '',
          avatar: '',
          nickname: '',
          userId: '',
          remember: !0,
          protocol: h(),
          loading: !1,
          mode: 'login',
          countdown: 0,
          arrowStatus: !1,
          countdownTimer: null,
          emailValid: !1,
          passwordValid: !1,
          passwordErrorMsg: '',
          confirmPasswordValid: !1,
          confirmPasswordErrorMsg: '',
          validCodeValid: !1,
          validCodeErrorMsg: '',
          validCodeRequestError: '',
          loginDiagnostic: ''
        }),
        B = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/,
        G = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,32}$/,
        W = l(() => 'login' === Z.mode),
        H = l(() => 'register' === Z.mode),
        K = l(() => 'forget' === Z.mode),
        Q = l(() => {
          if (Z.loading) return !0
          if (!Z.email || !Z.validCode) return !0
          if (H.value || K.value) {
            if (!Z.password || !Z.confirmPassword) return !0
          } else if (!Z.password) return !0
          return !1
        }),
        X = l(() => (H.value ? '注册' : K.value ? '重置密码' : '登录')),
        Y = l(() => {
          switch (Z.mode) {
            case 'register':
              return '注册账号'
            case 'forget':
              return '忘记密码'
            default:
              return '账号登录'
          }
        }),
        J = l(() => (K.value ? '请输入新密码' : '请输入密码')),
        ee = l(() => (K.value ? '请确认新密码' : '请确认密码')),
        oe = l(() => (Z.countdown > 0 ? `${Z.countdown}秒后可重新发送` : '获取验证码')),
        ae = c(null),
        ie = (e, a) => {
          const i = window.$message
          if (i)
            try {
              return void i[e](a)
            } catch (l) {}
          try {
            o[e](a)
          } catch (l) {}
        },
        le = (e) => {
          ae.value = e
        },
        re = () => !!Z.protocol || (ie('warning', '请先阅读并同意《星光服务协议》和《星光隐私保护指引》'), !1),
        te = () => {
          ;(Z.emailValid = !1), (Z.passwordValid = !1), (Z.confirmPasswordValid = !1), (Z.validCodeValid = !1)
        },
        ne = (e) => {
          ;(Z.mode = e),
            (Z.password = ''),
            (Z.confirmPassword = ''),
            (Z.validCode = ''),
            te(),
            Z.countdownTimer && (clearInterval(Z.countdownTimer), (Z.countdownTimer = null)),
            (Z.countdown = 0)
        },
        se = () => {
          if (!(Z.countdown > 0)) {
            if (!B.test(Z.email)) return (Z.emailValid = !0), void ie('error', '请填写正确的邮箱帐号')
            ;(Z.validCodeRequestError = ''),
              (Z.countdown = 60),
              (Z.countdownTimer = setInterval(() => {
                Z.countdown--,
                  Z.countdown <= 0 && Z.countdownTimer && (clearInterval(Z.countdownTimer), (Z.countdownTimer = null))
              }, 1e3)),
              I(
                { email: Z.email, type: H.value ? 'register' : K.value ? 'forget' : 'login' },
                { suppressSuccessMessage: !0 }
              )
                .then(() => {
                  o.success('验证码已发送，请查收邮箱')
                })
                .catch((e) => {
                  const o = e instanceof Error && '请求超时，请稍后重试' === e.message,
                    a = U(e, '发送验证码失败，请检查网络连接')
                  Z.countdownTimer && (clearInterval(Z.countdownTimer), (Z.countdownTimer = null)),
                    (Z.countdown = o ? 60 : 0),
                    o &&
                      (Z.countdownTimer = setInterval(() => {
                        Z.countdown--,
                          Z.countdown <= 0 &&
                            Z.countdownTimer &&
                            (clearInterval(Z.countdownTimer), (Z.countdownTimer = null))
                      }, 1e3)),
                    (Z.validCodeRequestError = o ? '请求超时，邮件可能已发送，请先查收验证码' : a),
                    ie('error', Z.validCodeRequestError)
                })
          }
        },
        de = () => (
          te(),
          B.test(Z.email)
            ? Z.password.length < 6 || Z.password.length > 32
              ? ((Z.passwordValid = !0), (Z.passwordErrorMsg = '密码长度应为6-32位'), !1)
              : G.test(Z.password)
                ? (H.value || K.value) && Z.password !== Z.confirmPassword
                  ? ((Z.confirmPasswordValid = !0), (Z.confirmPasswordErrorMsg = '两次输入的密码不一致'), !1)
                  : !(!Z.validCode || 6 !== Z.validCode.length) ||
                    ((Z.validCodeValid = !0), (Z.validCodeErrorMsg = '请输入6位验证码'), !1)
                : ((Z.passwordValid = !0), (Z.passwordErrorMsg = '密码必须包含字母和数字'), !1)
            : ((Z.emailValid = !0), !1)
        ),
        ce = () => {
          H.value
            ? (async () => {
                if (!Z.loading && re() && de())
                  try {
                    Z.loading = !0
                    const e = C(Z.password, 'E9CC7F1A9661D6824589279A8D465')
                    await A({ email: Z.email, hash: e, code: Z.validCode }),
                      ie('success', '注册成功，跳转到登录页面'),
                      ne('login')
                  } catch (e) {
                    ;(Z.validCode = ''), ie('error', U(e, '注册失败，请稍后重试'))
                  } finally {
                    Z.loading = !1
                  }
              })()
            : K.value
              ? (async () => {
                  if (!Z.loading && re() && de())
                    try {
                      Z.loading = !0
                      const e = C(Z.password, 'E9CC7F1A9661D6824589279A8D465')
                      await E({ email: Z.email, hash: e, code: Z.validCode }),
                        ie('success', '密码重置成功，跳转到登录页面'),
                        ne('login')
                    } catch (e) {
                      ;(Z.validCode = ''), ie('error', U(e, '重置密码失败，请稍后重试'))
                    } finally {
                      Z.loading = !1
                    }
                })()
              : (async () => {
                  var e
                  if (!Z.loading && re() && de())
                    try {
                      ;(Z.loading = !0), (Z.loginDiagnostic = 'LOGIN_REQUEST_STARTED')
                      const a = C(Z.password, 'E9CC7F1A9661D6824589279A8D465'),
                        l = await T({ email: Z.email, hash: a, code: Z.validCode }),
                        r = x((e = l))
                          ? {
                              userId: L(e, 'userId'),
                              token: L(e, 'token'),
                              accessToken: L(e, 'accessToken'),
                              access_token: L(e, 'access_token'),
                              refreshToken: L(e, 'refreshToken'),
                              refresh_token: L(e, 'refresh_token'),
                              userInfo: e.userInfo
                            }
                          : {},
                        n = r.token || r.accessToken || r.access_token,
                        s = r.refreshToken || r.refresh_token
                      Z.loginDiagnostic = `API_OK userId=${r.userId ? 'present' : 'missing'} token=${n ? 'present' : 'missing'}`
                      try {
                        D({ accessToken: n, refreshToken: s })
                      } catch (o) {
                        return (
                          (Z.loginDiagnostic = `TOKEN_PERSIST_FAILED error=${U(o, 'unknown')}`),
                          void ie('error', '登录成功，但无法保存登录状态，请重试')
                        )
                      }
                      ;(Z.loginDiagnostic = 'TOKENS_PERSISTED'),
                        N().catch(() => {}),
                        (Z.loginDiagnostic = 'TAURI_SYNC_STARTED')
                      const d = r.userId || ''
                      let c = null
                      try {
                        c = P()
                      } catch (o) {}
                      const m = j(r.userInfo) || ((null == c ? void 0 : c.userId) === d ? c : void 0),
                        u = {
                          userId: (null == m ? void 0 : m.userId) || d,
                          email: Z.email,
                          hash: Z.remember ? Z.password : void 0,
                          avatar: (null == m ? void 0 : m.avatar) || Z.avatar || 'star_1',
                          nickName: (null == m ? void 0 : m.nickName) || Z.nickname || Z.email,
                          client: (null == m ? void 0 : m.client) || 'mobile',
                          isAdmin: (null == m ? void 0 : m.isAdmin) || !1,
                          status: (null == m ? void 0 : m.status) || 'active',
                          lastActiveAt: (null == m ? void 0 : m.lastActiveAt) || new Date().toISOString(),
                          isOnboardingCompleted: null == m ? void 0 : m.isOnboardingCompleted
                        },
                        g = R(!1, u)
                      Z.loginDiagnostic = `USER_INFO_BUILT admin=${String(u.isAdmin)} onboarding=${String(Boolean(u.isOnboardingCompleted))} target=${g}`
                      try {
                        M(u), Z.remember && F(u), (t.login.autoLogin = Z.remember)
                      } catch (o) {
                        Z.loginDiagnostic = `USER_INFO_PERSIST_WARN target=${g}`
                      }
                      Z.loginDiagnostic.startsWith('USER_INFO_PERSIST_WARN') ||
                        (Z.loginDiagnostic = `USER_INFO_PERSISTED target=${g}`),
                        ie('success', '登录成功'),
                        (Z.loginDiagnostic = `NAVIGATION_START target=${g}`)
                      try {
                        await i.push({ name: g }), (Z.loginDiagnostic = `NAVIGATION_RESOLVED target=${g}`)
                      } catch (o) {
                        return (
                          (Z.loginDiagnostic = `NAVIGATION_FAILED target=${g} error=${U(o, 'unknown')}`),
                          void ie('error', '登录成功，但页面跳转失败，请重试')
                        )
                      }
                      !(null == m ? void 0 : m.userId) &&
                        d &&
                        V(d)
                          .then((e) => {
                            const o = j(e)
                            ;(null == o ? void 0 : o.userId) &&
                              M({
                                ...u,
                                ...o,
                                email: o.email || u.email,
                                nickName: o.nickName || u.nickName,
                                avatar: o.avatar || u.avatar,
                                lastActiveAt: o.lastActiveAt || u.lastActiveAt
                              })
                          })
                          .catch((e) => {})
                    } catch (o) {
                      ;(Z.loginDiagnostic = `LOGIN_FLOW_FAILED stage=${Z.loginDiagnostic || 'unknown'} error=${U(o, 'unknown')}`),
                        (Z.validCode = ''),
                        ie('error', U(o, '登录失败，请检查邮箱和密码'))
                    } finally {
                      Z.loading = !1
                    }
                })()
        }
      return (
        s(() => {
          Z.countdownTimer && (clearInterval(Z.countdownTimer), (Z.countdownTimer = null))
        }),
        (function () {
          if ('undefined' == typeof window || !window.visualViewport) return
          let e = null
          const o = () => {
            e && clearTimeout(e),
              (e = setTimeout(() => {
                const e = document.activeElement
                !e ||
                  ('INPUT' !== e.tagName && 'TEXTAREA' !== e.tagName) ||
                  e.scrollIntoView({ block: 'nearest', behavior: 'instant' })
              }, 350))
          }
          n(() => {
            window.visualViewport.addEventListener('resize', o)
          }),
            s(() => {
              var a
              null == (a = window.visualViewport) || a.removeEventListener('resize', o), e && clearTimeout(e)
            })
        })(),
        () =>
          r(O, null, {
            default: () => [
              r('div', { class: 'mobile-login', 'data-login-v2': 'true' }, [
                r('div', { class: 'mobile-login__content' }, [
                  r('div', { class: 'mobile-login__header' }, [
                    r('div', { class: 'mobile-login__title' }, [Y.value]),
                    r('div', { class: 'mobile-login__subtitle' }, [m('还有永不落幕的星光✨，给你宇宙级别的浪漫～')])
                  ]),
                  r(
                    'form',
                    {
                      class: 'mobile-login__form',
                      onSubmit: (e) => {
                        e.preventDefault(), ce()
                      }
                    },
                    [
                      r('div', { class: 'mobile-login__input-wrap' }, [
                        r(
                          a,
                          {
                            modelValue: Z.email,
                            'onUpdate:modelValue': (e) => {
                              ;(Z.email = e), (Z.emailValid = !1)
                            },
                            type: 'email',
                            placeholder: '请输入邮箱',
                            maxlength: 32,
                            clearable: !0,
                            rightIcon:
                              z.length > 0
                                ? () =>
                                    r(
                                      'button',
                                      {
                                        type: 'button',
                                        class: 'mobile-login__history-toggle',
                                        'aria-label': Z.arrowStatus ? '收起历史账号' : '展开历史账号',
                                        'aria-expanded': Z.arrowStatus,
                                        onClick: (e) => {
                                          e.preventDefault(), e.stopPropagation(), (Z.arrowStatus = !Z.arrowStatus)
                                        }
                                      },
                                      [u(Z.arrowStatus ? g : v, { size: 16 })]
                                    )
                                : void 0
                          },
                          null
                        ),
                        z.length > 0 && Z.arrowStatus
                          ? r('div', { class: 'mobile-login__history-box' }, [
                              r('div', { class: 'mobile-login__history-scroll' }, [
                                z.map((e) =>
                                  r('div', { key: e.email, class: 'mobile-login__history-item' }, [
                                    r(
                                      'button',
                                      {
                                        type: 'button',
                                        class: 'mobile-login__history-select',
                                        onClick: () => {
                                          return (
                                            (o = e),
                                            (Z.email = o.email),
                                            (Z.password = o.hash || ''),
                                            (Z.avatar = o.avatar),
                                            (Z.nickname = o.nickName),
                                            (Z.userId = o.userId),
                                            void (Z.arrowStatus = !1)
                                          )
                                          var o
                                        }
                                      },
                                      [
                                        r(b, { class: 'mobile-login__history-avatar', src: e.avatar, size: 44 }, null),
                                        r('div', { class: 'mobile-login__history-info' }, [
                                          r('div', { class: 'mobile-login__history-name' }, [e.nickName || e.email]),
                                          r('div', { class: 'mobile-login__history-email' }, [e.email])
                                        ])
                                      ]
                                    ),
                                    r(
                                      'button',
                                      {
                                        type: 'button',
                                        class: 'mobile-login__history-delete',
                                        'aria-label': `删除历史账号 ${e.email}`,
                                        onClick: (o) => {
                                          return (
                                            (a = e),
                                            o.stopPropagation(),
                                            void window.$dialog.warning({
                                              title: '删除账号',
                                              content: `确定要删除账号 ${a.email} 吗？`,
                                              positiveText: '确定',
                                              negativeText: '取消',
                                              onPositiveClick: () => {
                                                q(a), ie('success', '删除成功')
                                              }
                                            })
                                          )
                                          var a
                                        }
                                      },
                                      [m('✕')]
                                    )
                                  ])
                                )
                              ])
                            ])
                          : null
                      ]),
                      Z.emailValid && r('div', { class: 'mobile-login__error' }, [m('请输入有效的邮箱账号')]),
                      r('div', { class: 'mobile-login__input-wrap' }, [
                        r(
                          a,
                          {
                            modelValue: Z.password,
                            'onUpdate:modelValue': (e) => {
                              ;(Z.password = e), (Z.passwordValid = !1)
                            },
                            type: 'password',
                            placeholder: J.value,
                            maxlength: 32,
                            clearable: !0
                          },
                          null
                        )
                      ]),
                      Z.passwordValid && r('div', { class: 'mobile-login__error' }, [Z.passwordErrorMsg]),
                      (H.value || K.value) &&
                        r(p, null, [
                          r('div', { class: 'mobile-login__input-wrap' }, [
                            r(
                              a,
                              {
                                maxlength: 32,
                                modelValue: Z.confirmPassword,
                                'onUpdate:modelValue': (e) => {
                                  ;(Z.confirmPassword = e), (Z.confirmPasswordValid = !1)
                                },
                                type: 'password',
                                placeholder: ee.value,
                                clearable: !0
                              },
                              null
                            )
                          ]),
                          Z.confirmPasswordValid &&
                            r('div', { class: 'mobile-login__error' }, [Z.confirmPasswordErrorMsg])
                        ]),
                      r('div', { class: 'mobile-login__input-wrap' }, [
                        r(
                          a,
                          {
                            modelValue: Z.validCode,
                            'onUpdate:modelValue': (e) => {
                              ;(Z.validCode = e), (Z.validCodeValid = !1)
                            },
                            type: 'text',
                            placeholder: '请输入验证码',
                            maxlength: 6,
                            clearable: !0,
                            rightIcon: () =>
                              r(
                                'button',
                                {
                                  type: 'button',
                                  class: ['mobile-login__code-text', Z.countdown > 0 ? 'is-waiting' : 'is-ready'],
                                  disabled: Z.countdown > 0,
                                  onClick: se
                                },
                                [oe.value]
                              )
                          },
                          null
                        )
                      ]),
                      Z.validCodeValid && r('div', { class: 'mobile-login__error' }, [Z.validCodeErrorMsg]),
                      Z.validCodeRequestError &&
                        r('div', { class: 'mobile-login__request-error' }, [Z.validCodeRequestError]),
                      W.value &&
                        r('div', { class: 'mobile-login__form-actions' }, [
                          r('div', { class: 'mobile-login__remember' }, [
                            r(
                              $,
                              {
                                modelValue: Z.remember,
                                'onUpdate:modelValue': (e) => {
                                  Z.remember = e
                                }
                              },
                              null
                            ),
                            r('span', { class: 'mobile-login__remember-text' }, [m('记住密码')])
                          ]),
                          r(
                            'button',
                            { type: 'button', class: 'mobile-login__forget-link', onClick: () => ne('forget') },
                            [m('忘记密码')]
                          )
                        ]),
                      r(
                        e,
                        {
                          class: 'mobile-login__submit',
                          type: 'primary',
                          loading: Z.loading,
                          disabled: Q.value,
                          onClick: ce,
                          block: !0
                        },
                        { default: () => [X.value] }
                      )
                    ]
                  ),
                  r('div', { class: 'mobile-login__footer' }, [
                    r('div', { class: 'mobile-login__footer-switches' }, [
                      r(
                        'button',
                        {
                          type: 'button',
                          class: 'mobile-login__footer-link',
                          onClick: () => ne('register' === Z.mode ? 'login' : 'register')
                        },
                        ['register' === Z.mode ? '返回登录' : '注册账号']
                      ),
                      r('div', { class: 'mobile-login__footer-divider' }, null),
                      r(
                        'button',
                        {
                          type: 'button',
                          class: 'mobile-login__footer-link',
                          onClick: () => ne('forget' === Z.mode ? 'login' : 'forget')
                        },
                        ['forget' === Z.mode ? '账号登录' : '忘记密码']
                      )
                    ]),
                    r('div', { class: 'mobile-login__agreement-row' }, [
                      r(
                        $,
                        {
                          modelValue: Z.protocol,
                          'onUpdate:modelValue': (e) => {
                            ;(Z.protocol = e), y(e)
                          }
                        },
                        null
                      ),
                      r('div', { class: 'mobile-login__footer-agreement' }, [
                        r('span', null, [m('已阅读并同意')]),
                        r(
                          'button',
                          {
                            type: 'button',
                            class: 'mobile-login__footer-agreement-link',
                            onClick: () => le('service')
                          },
                          [m('服务协议')]
                        ),
                        r('span', null, [m('和')]),
                        r(
                          'button',
                          {
                            type: 'button',
                            class: 'mobile-login__footer-agreement-link',
                            onClick: () => le('privacy')
                          },
                          [m('星光隐私保护指引')]
                        )
                      ])
                    ])
                  ])
                ])
              ]),
              r(
                _,
                {
                  show: null !== ae.value,
                  'onUpdate:show': (e) => {
                    e || (ae.value = null)
                  },
                  position: 'bottom',
                  title: 'service' === ae.value ? '星光服务协议' : '星光隐私保护指引',
                  closeOnClickOverlay: !0
                },
                {
                  default: () => [
                    r('div', { class: 'mobile-login__legal-reader' }, [ae.value && r(k, { kind: ae.value }, null)])
                  ]
                }
              )
            ]
          })
      )
    }
  })
export { z as default }
