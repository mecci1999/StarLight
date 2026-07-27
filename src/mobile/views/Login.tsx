import { h } from 'vue'
import { MobileAvatar, MobileButton, MobileCheckbox, MobileInput, MobileSheet } from '@/mobile/ui'
import { PhCaretDown, PhCaretUp } from '@phosphor-icons/vue'
import { encryptPassword } from '@/utils/Crypto'
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'
import * as api from '@/api'
import {
  getStoredAuthTokens,
  persistAuthTokens,
  syncAuthTokensToTauri,
  getStoredUserInfo,
  persistStoredUserInfo,
  resolveAuthLandingRoute
} from '@/services/authSession'
import { useLoginHistoriesStore } from '@/store/loginHistory'
import { useSettingStore } from '@/store/setting'
import { useKeyboardAvoid } from '@/mobile/hooks/useKeyboardAvoid'
import MobileVantProvider from '@/mobile/providers/MobileVantProvider'
import LegalDocumentContent from '@/shared/legal/LegalDocumentContent'
import type { LegalDocumentKind } from '@/shared/legal/agreements'
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
    const isOnline = ref(false)
    const checkingNetwork = ref(true)

    // 用 Tauri 原生 HTTP 检测真实网络连通性
    const checkNetwork = async () => {
      try {
        checkingNetwork.value = true
        const resp = await tauriFetch('https://www.apple.com/library/test/success.html', {
          method: 'GET',
          connectTimeout: 5000
        })
        isOnline.value = resp.ok
      } catch {
        isOnline.value = false
      } finally {
        checkingNetwork.value = false
      }
    }

    onMounted(() => {
      checkNetwork()
    })

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
      protocol: false,
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
      validCodeErrorMsg: ''
    })

    const emailReg = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/
    const passwordReg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,32}$/

    const isLoginMode = computed(() => state.mode === 'login')
    const isRegisterMode = computed(() => state.mode === 'register')
    const isForgetMode = computed(() => state.mode === 'forget')

    const submitDisabled = computed(() => {
      if (state.loading || !isOnline.value) return true
      if (!state.email || !state.validCode) return true
      if (isRegisterMode.value || isForgetMode.value) {
        if (!state.password || !state.confirmPassword) return true
      } else {
        if (!state.password) return true
      }
      return false
    })

    const submitText = computed(() => {
      if (!isOnline.value) return '网络异常'
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

    const showLegalDocument = (kind: LegalDocumentKind) => {
      activeLegalDocument.value = kind
    }

    const ensureProtocolAccepted = () => {
      if (state.protocol) return true
      window.$message.warning('请先阅读并同意《星光服务协议》和《星光隐私保护指引》')
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
          window.$message.success('删除成功')
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
        window.$message.error('请填写正确的邮箱帐号')
        return
      }
      state.countdown = 60
      state.countdownTimer = setInterval(() => {
        state.countdown--
        if (state.countdown <= 0 && state.countdownTimer) {
          clearInterval(state.countdownTimer)
          state.countdownTimer = null
        }
      }, 1000)
      api.verifyCode({ email: state.email, type: getVerifyCodeType() }).catch((err) => {
        if (state.countdownTimer) {
          clearInterval(state.countdownTimer)
          state.countdownTimer = null
        }
        state.countdown = 0
        console.warn('发送验证码失败:', err)
        window.$message.error('发送验证码失败，请检查网络连接')
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
        const hash = encryptPassword(state.password, import.meta.env.VITE_PASSWORD_SECRET_KEY)
        const response = await api.login({ email: state.email, hash, code: state.validCode })
        const res = toLoginResponse(response)
        const token = res.token || res.accessToken || res.access_token
        const refreshTokenVal = res.refreshToken || res.refresh_token
        persistAuthTokens({
          accessToken: token || getStoredAuthTokens().accessToken,
          refreshToken: refreshTokenVal || getStoredAuthTokens().refreshToken
        })
        syncAuthTokensToTauri().catch(() => {})
        const loginUserId = res.userId || ''
        const cached = getStoredUserInfo()
        let resolved: Partial<UserInfoType> | undefined =
          toPartialUserInfo(res.userInfo) || (cached?.userId === loginUserId ? cached : undefined)
        if (!resolved?.userId && loginUserId) {
          try {
            resolved = await api.getUserInfo(loginUserId)
          } catch {}
        }
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
        persistStoredUserInfo(userInfo)
        if (state.remember) addLoginHistory(userInfo)
        settingStore.login.autoLogin = state.remember
        router.push({ name: resolveAuthLandingRoute(false, userInfo) })
      } catch (error: unknown) {
        console.error('登录失败:', error)
        state.validCode = ''
        window.$message.error(getErrorMessage(error, '登录失败，请检查邮箱和密码'))
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
        window.$message.success('注册成功，跳转到登录页面')
        switchMode('login')
      } catch (error: unknown) {
        console.error('注册失败:', error)
        state.validCode = ''
        window.$message.error(getErrorMessage(error, '注册失败，请稍后重试'))
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
        window.$message.success('密码重置成功，跳转到登录页面')
        switchMode('login')
      } catch (error: unknown) {
        console.error('重置密码失败:', error)
        state.validCode = ''
        window.$message.error(getErrorMessage(error, '重置密码失败，请稍后重试'))
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
