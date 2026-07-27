import { useLoginHistoriesStore } from '@/store/loginHistory'
import { useSettingStore } from '@/store/setting'
import { useNetwork } from '@vueuse/core'
import { NAvatar, NButton, NCheckbox, NFlex, NInput, NScrollbar } from 'naive-ui'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { listen } from '@tauri-apps/api/event'
import {
  clearStoredAuthSession,
  syncAuthTokensToTauri,
  getStoredAuthTokens,
  persistAuthTokens,
  getStoredUserInfo,
  persistStoredUserInfo,
  resolveAuthLandingRoute
} from '@/services/authSession'

import * as api from '@/api'
import { useRouter } from 'vue-router'
import { UserInfoType } from '@/types/userInfo'
import { useWindow } from '@/hooks/useWindow'
import { encryptPassword } from '@/utils/Crypto'
import { throttle } from 'lodash-es'
import { type } from '@tauri-apps/plugin-os'
import { useTauriListener } from '@/hooks/useTauriListener'
import './email.scss'

const getIsDesktop = () => {
  try {
    const osType = type()
    return osType === 'windows' || osType === 'linux' || osType === 'macos'
  } catch (e) {
    // 默认为桌面端
    return true
  }
}

export default defineComponent({
  name: 'LoginWindowContentEmail',
  props: {
    protocol: {
      type: Boolean,
      default: true
    }
  },
  emits: ['switchMode'], // 添加事件发射
  setup(props, { emit }) {
    const { loginHistories, addLoginHistory, removeLoginHistory } = useLoginHistoriesStore()
    // 网络连接是否正常
    const { isOnline } = useNetwork()
    const settingStore = useSettingStore()
    const { login } = storeToRefs(settingStore)
    const router = useRouter()
    const { createWebviewWindow } = useWindow()
    const tauriListener = useTauriListener()

    const storedTokens = getStoredAuthTokens()
    const TOKEN = ref(storedTokens.accessToken)
    const REFRESH_TOKEN = ref(storedTokens.refreshToken)
    const isAutoLogin = ref(login.value.autoLogin && TOKEN.value && REFRESH_TOKEN.value)

    const state = reactive({
      loading: false, // 登录按钮加载状态
      arrowStatus: false, // 下拉箭头状态
      // 账号信息
      info: {
        email: '',
        password: '',
        avatar: '',
        nickname: '',
        userId: '',
        remember: true
      },
      emailPH: '请输入邮箱',
      passwordPH: '请输入密码',
      loginDisabled: !isOnline.value, // 登录按钮禁用状态
      emailValid: false, // 邮箱输入框是否有效
      passwordValid: false, // 密码输入框是否有效
      passwordErrorMsg: '', // 密码错误信息
      validCode: '', // 邮箱验证码
      validCodeValid: false, // 验证码是否有效
      validCodeErrorMsg: '', // 验证码错误信息
      countdown: 0, // 验证码倒计时
      countdownTimer: null as any, // 倒计时定时器
      showLoginError: false // 是否显示登录错误
    })

    const loginText = computed(() => {
      return isOnline.value ? (isAutoLogin.value ? '自动登录' : '登录') : '网络异常'
    })

    const validCodeText = computed(() => {
      return state.countdown > 0 ? `${state.countdown}秒后可重新发送` : '获取验证码'
    })

    // 登录按钮的禁用状态
    watchEffect(() => {
      state.loginDisabled = !(state.info.email && state.info.password && state.validCode && isOnline.value)
    })

    // 监听网络连接状态
    watch(
      isOnline,
      (value) => {
        state.loginDisabled = !value
        if (!value) {
          window.$message.error('网络连接异常，请检查网络设置后重试')
        }
      },
      {
        immediate: true
      }
    )

    /**
     * 选择账号
     */
    const giveAccount = (item: UserInfoType) => {
      state.info.email = item.email
      state.info.password = item.hash || ''
      state.info.avatar = item.avatar
      state.info.nickname = item.nickName
      state.info.userId = item.userId
      state.arrowStatus = false
    }

    /**
     * 删除账号
     */
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

    /**
     * 登录
     */
    const normalLogin = throttle(async () => {
      // 如果按钮处于禁用状态或正在加载中，不执行登录操作
      if (state.loading) return
      if (!props.protocol) {
        window.$message.warning('请先阅读并同意《星光服务协议》和《星光隐私保护指引》')
        return
      }

      // 重置错误状态
      state.emailValid = false
      state.passwordValid = false
      state.validCodeValid = false
      state.showLoginError = false

      // 验证邮箱格式
      const emailReg = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/
      if (!emailReg.test(state.info.email)) {
        state.emailValid = true
        return
      }

      // 验证密码长度
      if (state.info.password.length < 6 || state.info.password.length > 32) {
        state.passwordValid = true
        state.passwordErrorMsg = '密码长度应为6-32位'
        return
      }

      // 验证验证码
      if (!state.validCode || state.validCode.length !== 6) {
        state.validCodeValid = true
        state.validCodeErrorMsg = '请输入6位验证码'
        return
      }

      try {
        // 设置加载状态
        state.loading = true

        // 加密密码
        const hash = encryptPassword(state.info.password, import.meta.env.VITE_PASSWORD_SECRET_KEY)

        // 调用登录API
        const response = await api.login({
          email: state.info.email,
          hash,
          code: state.validCode
        })

        // 登录成功后的处理
        console.log('登录成功', response)
        const res = response as any

        // 尝试提取 Token (如果后端在Body中也返回了)
        const token = res.token || res.accessToken || res.access_token
        const refreshTokenVal = res.refreshToken || res.refresh_token
        const accessToken = token || getStoredAuthTokens().accessToken
        const refreshToken = refreshTokenVal || getStoredAuthTokens().refreshToken

        persistAuthTokens({ accessToken, refreshToken })

        if (accessToken || refreshToken) {
          await syncAuthTokensToTauri({ accessToken, refreshToken })
        }

        const loginUserId = res.userId || state.info.userId
        const cachedUserInfo = getStoredUserInfo()
        let resolvedUserInfo =
          (res.userInfo as Partial<UserInfoType> | undefined) ||
          (cachedUserInfo?.userId === loginUserId ? cachedUserInfo : undefined)
        if (!resolvedUserInfo?.userId && loginUserId) {
          try {
            resolvedUserInfo = (await api.getUserInfo(loginUserId)) as Partial<UserInfoType>
          } catch (error) {
            console.warn('登录成功后刷新用户信息失败，将使用登录响应兜底信息。', error)
          }
        }

        const userInfo: UserInfoType = {
          userId: resolvedUserInfo?.userId || loginUserId,
          email: state.info.email,
          hash: state.info.remember ? state.info.password : undefined,
          avatar: resolvedUserInfo?.avatar || state.info.avatar || 'star_1',
          nickName:
            resolvedUserInfo?.nickName ||
            (resolvedUserInfo as any)?.nickname ||
            state.info.nickname ||
            state.info.email,
          client: resolvedUserInfo?.client || 'desktop',
          isAdmin: resolvedUserInfo?.isAdmin || false,
          status: resolvedUserInfo?.status || 'active',
          lastActiveAt: resolvedUserInfo?.lastActiveAt || new Date().toISOString(),
          isOnboardingCompleted: resolvedUserInfo?.isOnboardingCompleted
        }
        persistStoredUserInfo(userInfo)

        // 如果记住密码，保存登录信息到历史记录
        if (state.info.remember) {
          addLoginHistory(userInfo)
        }

        // 更新登录设置
        settingStore.login.autoLogin = state.info.remember

        // 跳转到主界面
        // 优先使用服务端返回的 isOnboardingCompleted 字段，兼容旧逻辑作为兜底
        const isDesktop = getIsDesktop()
        const targetRoute = resolveAuthLandingRoute(isDesktop, userInfo)

        setTimeout(async () => {
          if (isDesktop) {
            const win = getCurrentWebviewWindow()
            // 如果已经在主窗口（例如被踢出后的重新登录），直接路由跳转，不创建新窗口
            if (win.label === 'StarLight' || win.label === 'home' || win.label === 'onboarding') {
              router.push({ name: targetRoute })
            } else {
              const nextWin = await createWebviewWindow('StarLight', targetRoute, 1080, 720, 'login', true)
              if (accessToken || refreshToken) {
                await nextWin.emit('auth-token', { accessToken, refreshToken })
              }
            }
          } else {
            // Mobile navigation
            router.push({ name: targetRoute })
          }
        }, 1000)
      } catch (error: any) {
        console.error('登录失败:', error)
        // 清除验证码
        state.validCode = ''
        state.showLoginError = true
      } finally {
        // 无论成功失败，都关闭加载状态
        state.loading = false
      }
    }, 500)

    /**
     * 忘记密码
     */
    const handleForget = () => {
      emit('switchMode', 'forget')
    }

    /**
     * 发送验证码
     */
    const handleValidCode = throttle(async () => {
      // 如果倒计时大于0，不允许再次发送
      if (state.countdown > 0) return

      // 判断邮箱是否正确
      const reg = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/

      if (!reg.test(state.info.email)) {
        state.emailValid = true
        window.$message.error('请填写正确的邮箱帐号')
        return
      }

      // 开始倒计时
      state.countdown = 60
      state.countdownTimer = setInterval(() => {
        state.countdown--
        if (state.countdown <= 0) {
          clearInterval(state.countdownTimer)
          state.countdownTimer = null
        }
      }, 1000)

      try {
        // 发送验证码
        await api.verifyCode({
          email: state.info.email,
          type: 'login'
        })
      } catch (error) {
        // 发送失败时清除倒计时
        clearInterval(state.countdownTimer)
        state.countdownTimer = null
        state.countdown = 0
        console.warn('发送验证码失败，请确认服务端已启动并允许当前客户端访问。', error)
      }
    }, 500)

    // 自动登录
    const autoLogin = async () => {
      if (!props.protocol) return
      if (isAutoLogin.value) {
        try {
          state.loading = true

          const savedUser = getStoredUserInfo()
          if (!savedUser?.userId) {
            throw new Error('missing cached user info')
          }

          const freshUser = (await api.getUserInfo(savedUser.userId)) as Partial<UserInfoType>
          const nextUser = {
            ...savedUser,
            ...freshUser,
            isAdmin:
              typeof (freshUser as any)?.isAdmin === 'boolean' ? (freshUser as any).isAdmin : Boolean(savedUser.isAdmin)
          }
          persistStoredUserInfo(nextUser)
          const targetRoute = resolveAuthLandingRoute(true, nextUser)

          setTimeout(async () => {
            await createWebviewWindow('StarLight', targetRoute, 1080, 720, 'login', true)
            state.loading = false
          }, 1000)
        } catch (error) {
          clearStoredAuthSession()
          state.loading = false
          isAutoLogin.value = false
        }
      }
    }

    // 组件卸载时清除定时器和键盘事件监听
    onUnmounted(() => {
      if (state.countdownTimer) {
        clearInterval(state.countdownTimer)
        state.countdownTimer = null
      }
      // 移除键盘事件监听
      document.removeEventListener('keydown', handleKeyDown)
    })

    onMounted(async () => {
      // 如果设置了自动登录，则自动登录
      if (isAutoLogin.value) {
        autoLogin()
      }
      // 绑定键盘事件监听
      document.addEventListener('keydown', handleKeyDown)
      tauriListener.addListener(
        listen('auth-token-request', async () => {
          const { accessToken, refreshToken } = getStoredAuthTokens()
          if (accessToken || refreshToken) {
            await syncAuthTokensToTauri({ accessToken, refreshToken })
          }
        })
      )
    })

    // 处理回车键事件
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        normalLogin()
      }
    }

    return () => (
      <NFlex class="login-email" size={0} vertical={true}>
        {/* 邮箱账号 */}
        <div class="email-input">
          <NInput
            size={'large'}
            maxlength={32}
            minlength={6}
            value={state.info.email}
            onUpdateValue={(value) => {
              state.info.email = value
              state.emailValid = false
            }}
            type={'text'}
            placeholder={state.emailPH}
            clearable={true}
            // 添加 IME 输入法模式为禁用
            inputProps={{ inputmode: 'email' }}
            onBlur={() => {
              // 判断邮箱是否有效
              if (state.info.email.length > 0) {
                // 使用正则判断邮箱
                const reg = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/

                if (!reg.test(state.info.email)) {
                  state.emailValid = true
                } else {
                  state.emailValid = false
                }
              } else {
                state.emailValid = false
              }
            }}>
            {{
              suffix: () =>
                loginHistories.length > 0 ? (
                  <div
                    class="login-email__history-toggle"
                    onClick={() => {
                      state.arrowStatus = !state.arrowStatus
                    }}>
                    {!state.arrowStatus ? (
                      <svg class="down login-email__history-arrow">
                        <use href="#down"></use>
                      </svg>
                    ) : (
                      <svg class="down login-email__history-arrow">
                        <use href="#up"></use>
                      </svg>
                    )}
                  </div>
                ) : null
            }}
          </NInput>
        </div>
        {/* 邮箱无效错误提示 */}
        {state.emailValid ? (
          <div class="login-email__error login-email__error--email">
            <span>请输入有效的邮箱账号</span>
          </div>
        ) : null}

        {/* 账号选择框 */}
        {loginHistories.length > 0 && state.arrowStatus ? (
          <div class="account-box login-email__history-box">
            <NScrollbar style={{ maxHeight: '176px' }} trigger={'hover'}>
              {loginHistories.map((item, index) => (
                <NFlex key={item.userId || index} vertical class="login-history-item login-email__history-item">
                  <div
                    class="account-item login-email__account-row"
                    onClick={() => {
                      giveAccount(item)
                    }}>
                    <div class="login-email__account-main">
                      <NAvatar class="login-email__account-avatar" src={item.avatar} />
                      <div class="login-email__account-text">
                        <p class="login-email__account-name">{item.nickName || item.email}</p>
                        <p class="login-email__account-email">{item.email}</p>
                      </div>
                    </div>
                    <svg
                      class="login-email__account-delete"
                      onClick={(e) => {
                        deleteAccount(item, e)
                      }}>
                      <use href="#close" />
                    </svg>
                  </div>
                </NFlex>
              ))}
            </NScrollbar>
          </div>
        ) : null}

        {/* 邮箱密码 */}
        <div class="password-input password-input--spaced">
          <NInput
            size={'large'}
            maxlength={32}
            minlength={6}
            value={state.info.password}
            onUpdateValue={(value) => {
              state.info.password = value
              state.passwordValid = false
            }}
            showPasswordOn={'click'}
            type={'password'}
            placeholder={state.passwordPH}
            clearable={true}></NInput>
        </div>

        {/* 密码错误提示 */}
        {state.passwordValid ? (
          <div class="login-email__error login-email__error--password">
            <span>{state.passwordErrorMsg}</span>
          </div>
        ) : null}

        {/* 验证码 */}
        <div class="password-input password-input--compact">
          <NInput
            size={'large'}
            maxlength={6}
            value={state.validCode}
            onUpdateValue={(value) => {
              state.validCode = value
              state.validCodeValid = false
            }}
            type={'text'}
            placeholder={'请输入验证码'}
            clearable={true}>
            {{
              suffix: () => (
                <div class="login-email__code-action-wrap" onClick={handleValidCode}>
                  <span class={['login-email__code-action', state.countdown > 0 ? 'is-waiting' : 'is-ready']}>
                    {validCodeText.value}
                  </span>
                </div>
              )
            }}
          </NInput>
        </div>

        {/* 验证码错误提示 */}
        {state.validCodeValid ? (
          <div class="login-email__error login-email__error--code">
            <span>{state.validCodeErrorMsg}</span>
          </div>
        ) : null}

        <NFlex justify={'space-between'} class={['login-email__options', state.validCodeValid ? 'has-code-error' : '']}>
          {/* 记住密码 */}
          <NFlex justify={'left'} size={6}>
            <NCheckbox
              checked={state.info.remember}
              onUpdateChecked={(value) => {
                state.info.remember = value
              }}
            />
            <div class="login-email__option-text">
              <span class="login-email__option-link">记住密码</span>
            </div>
          </NFlex>
          {/* 忘记密码 */}
          <div class="login-email__option-text" onClick={handleForget}>
            <span class="login-email__option-link">忘记密码</span>
          </div>
        </NFlex>

        {/* 按钮 */}
        <NButton
          loading={state.loading}
          class="login-email__submit"
          onClick={normalLogin}
          type={'primary'}
          disabled={state.loginDisabled}>
          <span>{loginText.value}</span>
        </NButton>
      </NFlex>
    )
  }
})
