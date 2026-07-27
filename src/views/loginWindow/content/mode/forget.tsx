/**
 * 忘记密码页面
 */
import { useNetwork } from '@vueuse/core'
import { NButton, NFlex, NInput } from 'naive-ui'
import * as api from '@/api'
import { encryptPassword } from '@/utils/Crypto'
import { throttle } from 'lodash-es'
import './forget.scss'

export default defineComponent({
  name: 'LoginWindowContentForget',
  props: {
    protocol: {
      type: Boolean,
      default: true
    }
  },
  emits: ['switchMode'],
  setup(props, { slots, emit }) {
    // 网络连接是否正常
    const { isOnline } = useNetwork()

    const state = reactive({
      loading: false, // 重置密码按钮加载状态
      // 重置密码信息
      info: {
        email: '',
        password: '',
        confirmPassword: ''
      },
      emailPH: '请输入邮箱',
      passwordPH: '请输入新密码',
      confirmPasswordPH: '请确认新密码',
      resetDisabled: !isOnline.value, // 重置密码按钮禁用状态
      emailValid: false, // 邮箱输入框是否有效
      passwordValid: false, // 密码输入框是否有效
      confirmPasswordValid: false, // 确认密码输入框是否有效
      passwordErrorMsg: '', // 密码错误信息
      confirmPasswordErrorMsg: '', // 确认密码错误信息
      validCode: '', // 邮箱验证码
      validCodeValid: false, // 验证码是否有效
      validCodeErrorMsg: '', // 验证码错误信息
      countdown: 0, // 验证码倒计时
      countdownTimer: null as any // 倒计时定时器
    })

    const resetText = computed(() => {
      return isOnline.value ? '重置密码' : '网络异常'
    })

    const validCodeText = computed(() => {
      return state.countdown > 0 ? `${state.countdown}秒后可重新发送` : '获取验证码'
    })

    // 重置密码按钮的禁用状态
    watchEffect(() => {
      state.resetDisabled = !(
        state.info.email &&
        state.info.password &&
        state.info.confirmPassword &&
        state.validCode &&
        isOnline.value
      )
    })

    // 监听网络连接状态
    watch(isOnline, (value) => {
      state.resetDisabled = !value
    })

    /**
     * 重置密码
     */
    const handleResetPassword = throttle(async () => {
      // 如果按钮处于禁用状态或正在加载中，不执行重置操作
      if (state.loading) return
      if (!props.protocol) {
        window.$message.warning('请先阅读并同意《星光服务协议》和《星光隐私保护指引》')
        return
      }

      // 重置错误状态
      state.emailValid = false
      state.passwordValid = false
      state.confirmPasswordValid = false
      state.validCodeValid = false

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

      // 验证密码强度（至少包含字母和数字）
      const passwordReg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,32}$/
      if (!passwordReg.test(state.info.password)) {
        state.passwordValid = true
        state.passwordErrorMsg = '密码必须包含字母和数字'
        return
      }

      // 验证确认密码
      if (state.info.password !== state.info.confirmPassword) {
        state.confirmPasswordValid = true
        state.confirmPasswordErrorMsg = '两次输入的密码不一致'
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

        // 从环境变量中获取密码加密密钥
        const secretKey = import.meta.env.VITE_PASSWORD_SECRET_KEY as string

        // 加密密码
        const hash = encryptPassword(state.info.password, secretKey)

        // 调用真实重置密码 API
        const resetData = {
          email: state.info.email,
          hash: hash,
          code: state.validCode
        }

        await api.forgetPassword(resetData)

        // 重置成功后的处理
        window.$message.success('密码重置成功，跳转到登录页面')

        // 清空表单
        state.info.email = ''
        state.info.password = ''
        state.info.confirmPassword = ''
        state.validCode = ''

        // 延迟1秒后切换到登录模式
        setTimeout(() => {
          emit('switchMode', 'login')
        }, 1000)
      } catch (error: any) {
        console.error('重置密码失败:', error)
        state.validCode = ''
      } finally {
        // 无论成功失败，都关闭加载状态
        state.loading = false
      }
    }, 500)

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
          type: 'forget' // 重置密码类型
        })
      } catch (error) {
        // 发送失败时清除倒计时
        clearInterval(state.countdownTimer)
        state.countdownTimer = null
        state.countdown = 0
        console.error('发送验证码失败:', error)
      }
    }, 500)

    // 组件卸载时清除定时器
    onUnmounted(() => {
      if (state.countdownTimer) {
        clearInterval(state.countdownTimer)
        state.countdownTimer = null
      }
    })

    return () => (
      <NFlex class="login-forget" size={0} vertical={true}>
        {/* 邮箱账号 */}
        <NInput
          class="email-input"
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
          onBlur={() => {
            // 判断邮箱是否有效
            if (state.info.email.length > 0) {
              const reg = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/
              if (!reg.test(state.info.email)) {
                state.emailValid = true
              } else {
                state.emailValid = false
              }
            } else {
              state.emailValid = false
            }
          }}
        />
        {/* 邮箱无效错误提示 */}
        {state.emailValid ? (
          <div class="login-forget__error login-forget__error--email">
            <span>请输入正确的邮箱地址</span>
          </div>
        ) : null}

        {/* 新密码 */}
        <NInput
          class="password-input password-input--spaced"
          size={'large'}
          maxlength={32}
          minlength={6}
          value={state.info.password}
          onUpdateValue={(value) => {
            state.info.password = value
            state.passwordValid = false
            // 如果确认密码已输入，重新验证确认密码
            if (state.info.confirmPassword) {
              state.confirmPasswordValid = false
            }
          }}
          type={'password'}
          placeholder={state.passwordPH}
          clearable={true}
          showPasswordOn={'click'}
          onBlur={() => {
            // 验证密码
            if (state.info.password.length > 0) {
              if (state.info.password.length < 6 || state.info.password.length > 32) {
                state.passwordValid = true
                state.passwordErrorMsg = '密码长度应为6-32位'
              } else {
                // 验证密码强度（至少包含字母和数字）
                const passwordReg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,32}$/
                if (!passwordReg.test(state.info.password)) {
                  state.passwordValid = true
                  state.passwordErrorMsg = '密码必须包含字母和数字'
                } else {
                  state.passwordValid = false
                  // 如果确认密码已输入，重新验证确认密码
                  if (state.info.confirmPassword && state.info.password !== state.info.confirmPassword) {
                    state.confirmPasswordValid = true
                    state.confirmPasswordErrorMsg = '两次输入的密码不一致'
                  }
                }
              }
            } else {
              state.passwordValid = false
            }
          }}
        />
        {/* 密码错误提示 */}
        {state.passwordValid ? (
          <div class="login-forget__error login-forget__error--password">
            <span>{state.passwordErrorMsg}</span>
          </div>
        ) : null}

        {/* 确认密码 */}
        <NInput
          class="password-input password-input--spaced"
          size={'large'}
          maxlength={32}
          minlength={6}
          value={state.info.confirmPassword}
          onUpdateValue={(value) => {
            state.info.confirmPassword = value
            state.confirmPasswordValid = false
          }}
          showPasswordOn={'click'}
          type={'password'}
          placeholder={state.confirmPasswordPH}
          clearable={true}
        />
        {/* 确认密码错误提示 */}
        {state.confirmPasswordValid ? (
          <div class="login-forget__error login-forget__error--confirm">
            <span>{state.confirmPasswordErrorMsg}</span>
          </div>
        ) : null}

        {/* 验证码 */}
        <NInput
          class="password-input password-input--compact"
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
              <div onClick={handleValidCode}>
                <span class={['login-forget__code-action', state.countdown > 0 ? 'is-waiting' : 'is-ready']}>
                  {validCodeText.value}
                </span>
              </div>
            )
          }}
        </NInput>
        {/* 验证码错误提示 */}
        {state.validCodeValid ? (
          <div class="login-forget__error login-forget__error--code">
            <span>{state.validCodeErrorMsg}</span>
          </div>
        ) : null}

        {/* 重置密码按钮 */}
        <NButton
          class="reset-btn login-forget__submit"
          type={'primary'}
          disabled={state.resetDisabled}
          loading={state.loading}
          onClick={handleResetPassword}>
          {resetText.value}
        </NButton>
      </NFlex>
    )
  }
})
