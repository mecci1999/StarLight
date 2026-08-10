import { h } from 'vue'
import { MobileAvatar, MobileButton, MobileCheckbox, MobileInput, MobileSheet } from '@/mobile/ui'
import { PhCaretDown, PhCaretUp } from '@phosphor-icons/vue'
import { encryptPassword } from '@/utils/Crypto'
import * as api from '@/api'
import {
  persistAuthTokens,
  syncAuthTokensToTauri,
  getStoredUserInfo,
  persistStoredUserInfo,
  resolveAuthLandingRoute
} from '@/services/authSession'
import { useLoginHistoriesStore } from '@/store/loginHistory'
import { useSettingStore } from '@/store/setting'
import { useKeyboardAvoid } from '@/mobile/hooks/useKeyboardAvoid'
import { mobileFeedback } from '@/mobile/services/mobileFeedback'
import MobileVantProvider from '@/mobile/providers/MobileVantProvider'
import LegalDocumentContent from '@/shared/legal/LegalDocumentContent'
import type { LegalDocumentKind } from '@/shared/legal/agreements'
import { hasAcceptedLegalAgreements, persistLegalAgreementAcceptance } from '@/shared/legal/agreementAcceptance'
import type { UserInfoType } from '@/types/userInfo'
import './Login.scss'

type LoginResponse = {
  userId?: string
  token?: string
  accessToken?: string
  access_token?: string
  refreshToken?: string
  refresh_token?: string
  userInfo?: unknown
}

const getErrorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const getString = (record: Record<string, unknown>, key: string) =>
  typeof record[key] === 'string' ? record[key] : undefined

const toLoginResponse = (value: unknown): LoginResponse => {
  if (!isRecord(value)) return {}
  return {
    userId: getString(value, 'userId'),
    token: getString(value, 'token'),
    accessToken: getString(value, 'accessToken'),
    access_token: getString(value, 'access_token'),
    refreshToken: getString(value, 'refreshToken'),
    refresh_token: getString(value, 'refresh_token'),
    userInfo: value.userInfo
  }
}

const toPartialUserInfo = (value: unknown): Partial<UserInfoType> | undefined => {
  if (!isRecord(value)) return undefined
  const isAdmin = typeof value.isAdmin === 'boolean' ? value.isAdmin : undefined
  const isOnboardingCompleted =
    typeof value.isOnboardingCompleted === 'boolean' ? value.isOnboardingCompleted : undefined
  return {
    userId: getString(value, 'userId'),
    email: getString(value, 'email'),
    avatar: getString(value, 'avatar'),
    nickName: getString(value, 'nickName') || getString(value, 'nickname'),
    client: getString(value, 'client'),
    isAdmin,
    status: getString(value, 'status'),
    lastActiveAt: getString(value, 'lastActiveAt'),
    isOnboardingCompleted
  }
}

export default defineComponent({
  name: 'MobileLogin',
  setup() {
    const router = useRouter()
    const settingStore = useSettingStore()
    const { loginHistories, addLoginHistory, removeLoginHistory } = useLoginHistoriesStore()

    const state = reactive({
      email: '',
      password: '',
      confirmPassword: '',
      validCode: '',
      avatar: '',
      nickname: '',
      userId: '',
      remember: true,
      protocol: hasAcceptedLegalAgreements(),
      loading: false,
      mode: 'login' as 'login' | 'register' | 'forget',
      countdown: 0,
      arrowStatus: false,
      countdownTimer: null as ReturnType<typeof setInterval> | null,
      emailValid: false,
      passwordValid: false,
      passwordErrorMsg: '',
      confirmPasswordValid: false,
      confirmPasswordErrorMsg: '',
      validCodeValid: false,
      validCodeErrorMsg: '',
      validCodeRequestError: '',
      loginDiagnostic: ''
    })

    const emailReg = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/
    const passwordReg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,32}$/

    const isLoginMode = computed(() => state.mode === 'login')
    const isRegisterMode = computed(() => state.mode === 'register')
    const isForgetMode = computed(() => state.mode === 'forget')

    const submitDisabled = computed(() => {
      if (state.loading) return true
      if (!state.email || !state.validCode) return true
      if (isRegisterMode.value || isForgetMode.value) {
        if (!state.password || !state.confirmPassword) return true
      } else {
        if (!state.password) return true
      }
      return false
    })

    const submitText = computed(() => {
      if (isRegisterMode.value) return '注册'
      if (isForgetMode.value) return '重置密码'
      return '登录'
    })

    const loginTitle = computed(() => {
      switch (state.mode) {
        case 'register':
          return '注册账号'
        case 'forget':
          return '忘记密码'
        default:
          return '账号登录'
      }
    })

    const passwordPlaceholder = computed(() => {
      if (isForgetMode.value) return '请输入新密码'
      return '请输入密码'
    })

    const confirmPasswordPlaceholder = computed(() => {
      if (isForgetMode.value) return '请确认新密码'
      return '请确认密码'
    })

    const validCodeText = computed(() => {
      return state.countdown > 0 ? `${state.countdown}秒后可重新发送` : '获取验证码'
    })
    const activeLegalDocument = ref<LegalDocumentKind | null>(null)

    const showMobileFeedback = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
      const messageApi = window.$message
      if (messageApi) {
        try {
          messageApi[type](message)
          return
        } catch (error) {
          console.warn(`Naive ${type} feedback failed; falling back to Vant.`, error)
        }
      }

      try {
        mobileFeedback[type](message)
      } catch (error) {
        console.error(`Mobile ${type} feedback failed.`, error)
      }
    }

    const showLegalDocument = (kind: LegalDocumentKind) => {
      activeLegalDocument.value = kind
    }

    const ensureProtocolAccepted = () => {
      if (state.protocol) return true
      showMobileFeedback('warning', '请先阅读并同意《星光服务协议》和《星光隐私保护指引》')
      return false
    }

    // ── 历史账号 ──────────────────────────────────────────
    const giveAccount = (item: UserInfoType) => {
      state.email = item.email
      state.password = item.hash || ''
      state.avatar = item.avatar
      state.nickname = item.nickName
      state.userId = item.userId
      state.arrowStatus = false
    }

    const deleteAccount = (item: UserInfoType, e: Event) => {
      e.stopPropagation()
      window.$dialog.warning({
        title: '删除账号',
        content: `确定要删除账号 ${item.email} 吗？`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => {
          removeLoginHistory(item)
          showMobileFeedback('success', '删除成功')
        }
      })
    }

    // ── 重置校验状态 ──────────────────────────────────────
    const resetValidations = () => {
      state.emailValid = false
      state.passwordValid = false
      state.confirmPasswordValid = false
      state.validCodeValid = false
    }

    // ── 切换模式时清空表单 ──────────────────────────────────
    const switchMode = (mode: 'login' | 'register' | 'forget') => {
      state.mode = mode
      state.password = ''
      state.confirmPassword = ''
      state.validCode = ''
      resetValidations()
      if (state.countdownTimer) {
        clearInterval(state.countdownTimer)
        state.countdownTimer = null
      }
      state.countdown = 0
    }

    // ── 验证码 ────────────────────────────────────────────
    const getVerifyCodeType = () => {
      if (isRegisterMode.value) return 'register'
      if (isForgetMode.value) return 'forget'
      return 'login'
    }

    const handleValidCode = () => {
      if (state.countdown > 0) return
      if (!emailReg.test(state.email)) {
        state.emailValid = true
        showMobileFeedback('error', '请填写正确的邮箱帐号')
        return
      }
      state.validCodeRequestError = ''
      state.countdown = 60
      state.countdownTimer = setInterval(() => {
        state.countdown--
        if (state.countdown <= 0 && state.countdownTimer) {
          clearInterval(state.countdownTimer)
          state.countdownTimer = null
        }
      }, 1000)
      api
        .verifyCode({ email: state.email, type: getVerifyCodeType() }, { suppressSuccessMessage: true })
        .then(() => {
          mobileFeedback.success('验证码已发送，请查收邮箱')
        })
        .catch((err) => {
          const timedOut = err instanceof Error && err.message === '请求超时，请稍后重试'
          const errorMessage = getErrorMessage(err, '发送验证码失败，请检查网络连接')
          if (state.countdownTimer) {
            clearInterval(state.countdownTimer)
            state.countdownTimer = null
          }
          state.countdown = timedOut ? 60 : 0
          if (timedOut) {
            state.countdownTimer = setInterval(() => {
              state.countdown--
              if (state.countdown <= 0 && state.countdownTimer) {
                clearInterval(state.countdownTimer)
                state.countdownTimer = null
              }
            }, 1000)
          }
          console.warn('发送验证码失败:', err)
          state.validCodeRequestError = timedOut ? '请求超时，邮件可能已发送，请先查收验证码' : errorMessage
          showMobileFeedback('error', state.validCodeRequestError)
        })
    }

    // ── 通用校验 ──────────────────────────────────────────
    const validateCommon = () => {
      resetValidations()
      if (!emailReg.test(state.email)) {
        state.emailValid = true
        return false
      }
      if (state.password.length < 6 || state.password.length > 32) {
        state.passwordValid = true
        state.passwordErrorMsg = '密码长度应为6-32位'
        return false
      }
      if (!passwordReg.test(state.password)) {
        state.passwordValid = true
        state.passwordErrorMsg = '密码必须包含字母和数字'
        return false
      }
      if (isRegisterMode.value || isForgetMode.value) {
        if (state.password !== state.confirmPassword) {
          state.confirmPasswordValid = true
          state.confirmPasswordErrorMsg = '两次输入的密码不一致'
          return false
        }
      }
      if (!state.validCode || state.validCode.length !== 6) {
        state.validCodeValid = true
        state.validCodeErrorMsg = '请输入6位验证码'
        return false
      }
      return true
    }

    // ── 登录 ──────────────────────────────────────────────
    const handleLogin = async () => {
      if (state.loading) return
      if (!ensureProtocolAccepted()) return
      if (!validateCommon()) return
      try {
        state.loading = true
        state.loginDiagnostic = 'LOGIN_REQUEST_STARTED'
        const hash = encryptPassword(state.password, import.meta.env.VITE_PASSWORD_SECRET_KEY)
        const response = await api.login({ email: state.email, hash, code: state.validCode })
        const res = toLoginResponse(response)
        const token = res.token || res.accessToken || res.access_token
        const refreshTokenVal = res.refreshToken || res.refresh_token
        state.loginDiagnostic = `API_OK userId=${res.userId ? 'present' : 'missing'} token=${token ? 'present' : 'missing'}`
        try {
          persistAuthTokens({
            accessToken: token,
            refreshToken: refreshTokenVal
          })
        } catch (error) {
          console.error('登录成功后保存令牌失败:', error)
          state.loginDiagnostic = `TOKEN_PERSIST_FAILED error=${getErrorMessage(error, 'unknown')}`
          showMobileFeedback('error', '登录成功，但无法保存登录状态，请重试')
          return
        }
        state.loginDiagnostic = 'TOKENS_PERSISTED'
        syncAuthTokensToTauri().catch(() => {})
        state.loginDiagnostic = 'TAURI_SYNC_STARTED'
        const loginUserId = res.userId || ''
        let cached: Partial<UserInfoType> | null = null
        try {
          cached = getStoredUserInfo()
        } catch (error) {
          console.warn('读取已缓存的用户信息失败，将使用登录响应中的资料。', error)
        }
        const resolved: Partial<UserInfoType> | undefined =
          toPartialUserInfo(res.userInfo) || (cached?.userId === loginUserId ? cached : undefined)
        const userInfo: UserInfoType = {
          userId: resolved?.userId || loginUserId,
          email: state.email,
          hash: state.remember ? state.password : undefined,
          avatar: resolved?.avatar || state.avatar || 'star_1',
          nickName: resolved?.nickName || state.nickname || state.email,
          client: resolved?.client || 'mobile',
          isAdmin: resolved?.isAdmin || false,
          status: resolved?.status || 'active',
          lastActiveAt: resolved?.lastActiveAt || new Date().toISOString(),
          isOnboardingCompleted: resolved?.isOnboardingCompleted
        }
        const targetRoute = resolveAuthLandingRoute(false, userInfo)
        state.loginDiagnostic = `USER_INFO_BUILT admin=${String(userInfo.isAdmin)} onboarding=${String(
          Boolean(userInfo.isOnboardingCompleted)
        )} target=${targetRoute}`
        try {
          persistStoredUserInfo(userInfo)
          if (state.remember) addLoginHistory(userInfo)
          settingStore.login.autoLogin = state.remember
        } catch (error) {
          console.warn('登录成功后保存用户偏好失败，不影响本次登录。', error)
          state.loginDiagnostic = `USER_INFO_PERSIST_WARN target=${targetRoute}`
        }
        if (!state.loginDiagnostic.startsWith('USER_INFO_PERSIST_WARN'))
          state.loginDiagnostic = `USER_INFO_PERSISTED target=${targetRoute}`
        showMobileFeedback('success', '登录成功')
        state.loginDiagnostic = `NAVIGATION_START target=${targetRoute}`
        try {
          await router.push({ name: targetRoute })
          state.loginDiagnostic = `NAVIGATION_RESOLVED target=${targetRoute}`
        } catch (error: unknown) {
          console.error('登录成功后跳转页面失败:', error)
          state.loginDiagnostic = `NAVIGATION_FAILED target=${targetRoute} error=${getErrorMessage(error, 'unknown')}`
          showMobileFeedback('error', '登录成功，但页面跳转失败，请重试')
          return
        }

        if (!resolved?.userId && loginUserId) {
          void api
            .getUserInfo(loginUserId)
            .then((freshUser) => {
              const fresh = toPartialUserInfo(freshUser)
              if (!fresh?.userId) return
              persistStoredUserInfo({
                ...userInfo,
                ...fresh,
                email: fresh.email || userInfo.email,
                nickName: fresh.nickName || userInfo.nickName,
                avatar: fresh.avatar || userInfo.avatar,
                lastActiveAt: fresh.lastActiveAt || userInfo.lastActiveAt
              })
            })
            .catch((error: unknown) => {
              console.warn('登录成功后刷新用户信息失败，将保留登录响应中的资料。', error)
            })
        }
      } catch (error: unknown) {
        console.error('登录失败:', error)
        state.loginDiagnostic = `LOGIN_FLOW_FAILED stage=${state.loginDiagnostic || 'unknown'} error=${getErrorMessage(
          error,
          'unknown'
        )}`
        state.validCode = ''
        showMobileFeedback('error', getErrorMessage(error, '登录失败，请检查邮箱和密码'))
      } finally {
        state.loading = false
      }
    }

    // ── 注册 ──────────────────────────────────────────────
    const handleRegister = async () => {
      if (state.loading) return
      if (!ensureProtocolAccepted()) return
      if (!validateCommon()) return
      try {
        state.loading = true
        const hash = encryptPassword(state.password, import.meta.env.VITE_PASSWORD_SECRET_KEY)
        await api.registerUser({ email: state.email, hash, code: state.validCode })
        showMobileFeedback('success', '注册成功，跳转到登录页面')
        switchMode('login')
      } catch (error: unknown) {
        console.error('注册失败:', error)
        state.validCode = ''
        showMobileFeedback('error', getErrorMessage(error, '注册失败，请稍后重试'))
      } finally {
        state.loading = false
      }
    }

    // ── 忘记密码 ──────────────────────────────────────────
    const handleResetPassword = async () => {
      if (state.loading) return
      if (!ensureProtocolAccepted()) return
      if (!validateCommon()) return
      try {
        state.loading = true
        const hash = encryptPassword(state.password, import.meta.env.VITE_PASSWORD_SECRET_KEY)
        await api.forgetPassword({ email: state.email, hash, code: state.validCode })
        showMobileFeedback('success', '密码重置成功，跳转到登录页面')
        switchMode('login')
      } catch (error: unknown) {
        console.error('重置密码失败:', error)
        state.validCode = ''
        showMobileFeedback('error', getErrorMessage(error, '重置密码失败，请稍后重试'))
      } finally {
        state.loading = false
      }
    }

    // ── 统一提交入口 ──────────────────────────────────────
    const handleSubmit = () => {
      if (isRegisterMode.value) handleRegister()
      else if (isForgetMode.value) handleResetPassword()
      else handleLogin()
    }

    onUnmounted(() => {
      if (state.countdownTimer) {
        clearInterval(state.countdownTimer)
        state.countdownTimer = null
      }
    })

    useKeyboardAvoid()

    return () => (
      <MobileVantProvider>
        <div class="mobile-login" data-login-v2="true">
          <div class="mobile-login__content">
            <div class="mobile-login__header">
              <div class="mobile-login__title">{loginTitle.value}</div>
              <div class="mobile-login__subtitle">还有永不落幕的星光✨，给你宇宙级别的浪漫～</div>
            </div>

            <form
              class="mobile-login__form"
              onSubmit={(event: Event) => {
                event.preventDefault()
                handleSubmit()
              }}>
              {/* 邮箱 */}
              <div class="mobile-login__input-wrap">
                <MobileInput
                  modelValue={state.email}
                  onUpdate:modelValue={(v: string) => {
                    state.email = v
                    state.emailValid = false
                  }}
                  type="email"
                  placeholder="请输入邮箱"
                  maxlength={32}
                  clearable
                  rightIcon={
                    loginHistories.length > 0
                      ? () => (
                          <button
                            type="button"
                            class="mobile-login__history-toggle"
                            aria-label={state.arrowStatus ? '收起历史账号' : '展开历史账号'}
                            aria-expanded={state.arrowStatus}
                            onClick={(e: Event) => {
                              e.preventDefault()
                              e.stopPropagation()
                              state.arrowStatus = !state.arrowStatus
                            }}>
                            {h(state.arrowStatus ? PhCaretUp : PhCaretDown, { size: 16 })}
                          </button>
                        )
                      : undefined
                  }
                />
                {loginHistories.length > 0 && state.arrowStatus ? (
                  <div class="mobile-login__history-box">
                    <div class="mobile-login__history-scroll">
                      {loginHistories.map((item) => (
                        <div key={item.email} class="mobile-login__history-item">
                          <button type="button" class="mobile-login__history-select" onClick={() => giveAccount(item)}>
                            <MobileAvatar class="mobile-login__history-avatar" src={item.avatar} size={44} />
                            <div class="mobile-login__history-info">
                              <div class="mobile-login__history-name">{item.nickName || item.email}</div>
                              <div class="mobile-login__history-email">{item.email}</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            class="mobile-login__history-delete"
                            aria-label={`删除历史账号 ${item.email}`}
                            onClick={(e: Event) => deleteAccount(item, e)}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              {state.emailValid && <div class="mobile-login__error">请输入有效的邮箱账号</div>}

              {/* 密码 */}
              <div class="mobile-login__input-wrap">
                <MobileInput
                  modelValue={state.password}
                  onUpdate:modelValue={(v: string) => {
                    state.password = v
                    state.passwordValid = false
                  }}
                  type="password"
                  placeholder={passwordPlaceholder.value}
                  maxlength={32}
                  clearable
                />
              </div>
              {state.passwordValid && <div class="mobile-login__error">{state.passwordErrorMsg}</div>}

              {/* 确认密码 — 注册和忘记密码时显示 */}
              {(isRegisterMode.value || isForgetMode.value) && (
                <>
                  <div class="mobile-login__input-wrap">
                    <MobileInput
                      maxlength={32}
                      modelValue={state.confirmPassword}
                      onUpdate:modelValue={(v: string) => {
                        state.confirmPassword = v
                        state.confirmPasswordValid = false
                      }}
                      type="password"
                      placeholder={confirmPasswordPlaceholder.value}
                      clearable
                    />
                  </div>
                  {state.confirmPasswordValid && <div class="mobile-login__error">{state.confirmPasswordErrorMsg}</div>}
                </>
              )}

              {/* 验证码 */}
              <div class="mobile-login__input-wrap">
                <MobileInput
                  modelValue={state.validCode}
                  onUpdate:modelValue={(v: string) => {
                    state.validCode = v
                    state.validCodeValid = false
                  }}
                  type="text"
                  placeholder="请输入验证码"
                  maxlength={6}
                  clearable
                  rightIcon={() => (
                    <button
                      type="button"
                      class={['mobile-login__code-text', state.countdown > 0 ? 'is-waiting' : 'is-ready']}
                      disabled={state.countdown > 0}
                      onClick={handleValidCode}>
                      {validCodeText.value}
                    </button>
                  )}
                />
              </div>
              {state.validCodeValid && <div class="mobile-login__error">{state.validCodeErrorMsg}</div>}
              {state.validCodeRequestError && (
                <div class="mobile-login__request-error">{state.validCodeRequestError}</div>
              )}

              {/* 记住密码 / 忘记密码 — 仅登录模式显示 */}
              {isLoginMode.value && (
                <div class="mobile-login__form-actions">
                  <div class="mobile-login__remember">
                    <MobileCheckbox
                      modelValue={state.remember}
                      onUpdate:modelValue={(v: boolean) => {
                        state.remember = v
                      }}
                    />
                    <span class="mobile-login__remember-text">记住密码</span>
                  </div>
                  <button type="button" class="mobile-login__forget-link" onClick={() => switchMode('forget')}>
                    忘记密码
                  </button>
                </div>
              )}

              <MobileButton
                class="mobile-login__submit"
                type="primary"
                loading={state.loading}
                disabled={submitDisabled.value}
                onClick={handleSubmit}
                block>
                {submitText.value}
              </MobileButton>
            </form>

            <div class="mobile-login__footer">
              <div class="mobile-login__footer-switches">
                <button
                  type="button"
                  class="mobile-login__footer-link"
                  onClick={() => switchMode(state.mode === 'register' ? 'login' : 'register')}>
                  {state.mode === 'register' ? '返回登录' : '注册账号'}
                </button>
                <div class="mobile-login__footer-divider" />
                <button
                  type="button"
                  class="mobile-login__footer-link"
                  onClick={() => switchMode(state.mode === 'forget' ? 'login' : 'forget')}>
                  {state.mode === 'forget' ? '账号登录' : '忘记密码'}
                </button>
              </div>
              <div class="mobile-login__agreement-row">
                <MobileCheckbox
                  modelValue={state.protocol}
                  onUpdate:modelValue={(v: boolean) => {
                    state.protocol = v
                    persistLegalAgreementAcceptance(v)
                  }}
                />
                <div class="mobile-login__footer-agreement">
                  <span>已阅读并同意</span>
                  <button
                    type="button"
                    class="mobile-login__footer-agreement-link"
                    onClick={() => showLegalDocument('service')}>
                    服务协议
                  </button>
                  <span>和</span>
                  <button
                    type="button"
                    class="mobile-login__footer-agreement-link"
                    onClick={() => showLegalDocument('privacy')}>
                    星光隐私保护指引
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <MobileSheet
          show={activeLegalDocument.value !== null}
          onUpdate:show={(show) => {
            if (!show) activeLegalDocument.value = null
          }}
          position="bottom"
          title={activeLegalDocument.value === 'service' ? '星光服务协议' : '星光隐私保护指引'}
          closeOnClickOverlay>
          <div class="mobile-login__legal-reader">
            {activeLegalDocument.value && <LegalDocumentContent kind={activeLegalDocument.value} />}
          </div>
        </MobileSheet>
      </MobileVantProvider>
    )
  }
})
