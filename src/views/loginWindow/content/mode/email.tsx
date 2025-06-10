import { useLoginHistoriesStore } from '@/store/loginHistory'
import { useSettingStore } from '@/store/setting'
import { useNetwork } from '@vueuse/core'
import { NAvatar, NButton, NCheckbox, NFlex, NInput, NScrollbar } from 'naive-ui'
import { getCookie } from '@/utils/Cookie'
import api from '@/api'
import { useRouter } from 'vue-router'
import { UserInfoType } from '@/types/userInfo'
import { useWindow } from '@/hooks/useWindow'
import { encryptPassword } from '@/utils/Crypto'
import { throttle } from 'lodash-es'

export default defineComponent({
  name: 'LoginWindowContentEmail',
  props: {
    protocol: {
      type: Boolean,
      default: true
    }
  },
  emits: ['switchMode'], // 添加事件发射
  setup(props, { slots, emit }) {
    const { loginHistories, addLoginHistory, removeLoginHistory } = useLoginHistoriesStore()
    // 网络连接是否正常
    const { isOnline } = useNetwork()
    const settingStore = useSettingStore()
    const { login } = storeToRefs(settingStore)
    const router = useRouter()
    const { createWebviewWindow } = useWindow()

    const TOKEN = ref(getCookie('ACCESS_TOKEN'))
    const REFRESH_TOKEN = ref(getCookie('REFRESH_TOKEN'))
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
      state.loginDisabled = !(
        state.info.email &&
        state.info.password &&
        state.validCode &&
        props.protocol &&
        isOnline.value
      )
    })

    // 监听网络连接状态
    watch(isOnline, (value) => {
      state.loginDisabled = !value
    })

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

        // 如果记住密码，保存登录信息到历史记录
        if (state.info.remember) {
          const userInfo: UserInfoType = {
            userId: response.userId || state.info.userId,
            email: state.info.email,
            hash: state.info.remember ? state.info.password : undefined,
            avatar: response.userInfo?.avatar || state.info.avatar || 'star_1',
            nickName: response.userInfo?.nickName || state.info.nickname || state.info.email,
            client: response.userInfo?.client || 'desktop',
            isAdmin: response.userInfo?.isAdmin || false,
            status: response.userInfo?.status || 'active',
            lastActiveAt: response.userInfo?.lastActiveAt || new Date().toISOString()
          }
          addLoginHistory(userInfo)
        }

        // 更新登录设置
        settingStore.login.autoLogin = state.info.remember

        // 跳转到主界面
        setTimeout(async () => {
          await createWebviewWindow('StarLight', 'home', 1080, 720, 'login', true)
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
        console.error('发送验证码失败:', error)
      }
    }, 500)

    // 自动登录
    const autoLogin = async () => {
      if (isAutoLogin.value) {
        try {
          state.loading = true
          // 这里可以添加自动登录的逻辑
          // 例如使用保存的token直接登录

          setTimeout(async () => {
            await createWebviewWindow('StarLight', 'home', 1080, 720, 'login', true)
            state.loading = false
          }, 1000)
        } catch (error) {
          state.loading = false
          isAutoLogin.value = false
        }
      }
    }

    // 组件卸载时清除定时器
    onUnmounted(() => {
      if (state.countdownTimer) {
        clearInterval(state.countdownTimer)
        state.countdownTimer = null
      }
    })

    onMounted(async () => {
      // 如果设置了自动登录，则自动登录
      if (isAutoLogin.value) {
        autoLogin()
      }
    })

    return () => (
      <NFlex class="ma text-center h-full" size={0} vertical={true}>
        {/* 邮箱账号 */}
        <NInput
          class={{ 'email-input': true, 'mb-22px': true }}
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
                  class="flex items-center justify-between"
                  onClick={() => {
                    state.arrowStatus = !state.arrowStatus
                  }}>
                  {!state.arrowStatus ? (
                    <svg class="down w-16px h-16px color-#505050 cursor-pointer">
                      <use href="#down"></use>
                    </svg>
                  ) : (
                    <svg class="down w-16px h-16px color-#505050 cursor-pointer">
                      <use href="#up"></use>
                    </svg>
                  )}
                </div>
              ) : null
          }}
        </NInput>
        {/* 邮箱无效错误提示 */}
        {state.emailValid ? (
          <div class="text-12px text-left absolute top-46px">
            <span class={'color-[--color-danger-6]'}>请输入有效的邮箱账号</span>
          </div>
        ) : null}

        {/* 账号选择框 */}
        {loginHistories.length > 0 && state.arrowStatus ? (
          <div class="account-box absolute w-full min-h-60px  bg-white mt-45px z-99 rounded-4px p-12px box-border shadow-lg border border-solid border-[--color-border-2]">
            <NScrollbar style={{ maxHeight: '176px' }} trigger={'hover'}>
              {loginHistories.map((item, index) => (
                <NFlex
                  key={item.userId || index}
                  vertical
                  class={
                    'p-8px cursor-pointer hover:bg-[--color-fill-2] rounded-8px transition-all duration-200 mb-4px last:mb-0'
                  }>
                  <div
                    class="account-item flex items-center w-full"
                    onClick={() => {
                      giveAccount(item)
                    }}>
                    <div class="flex items-center flex-1 min-w-0">
                      <NAvatar
                        class="size-32px bg-[--color-fill-3] rounded-50% mr-12px flex-shrink-0"
                        src={item.avatar}
                      />
                      <div class="flex-1 min-w-0">
                        <p class="text-14px color-[--color-text-1] font-medium truncate mb-2px">
                          {item.nickName || item.email}
                        </p>
                        <p class="text-12px color-[--color-text-3] truncate">{item.email}</p>
                      </div>
                    </div>
                    <svg
                      class="w-14px h-14px color-[--color-text-3] hover:color-[--color-danger-6] transition-colors duration-200 flex-shrink-0 ml-8px"
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
        <NInput
          class={'password-input mb-22px'}
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

        {/* 密码错误提示 */}
        {state.passwordValid ? (
          <div class="text-12px text-left absolute" style="top: 110px;">
            <span class={'color-[--color-danger-6]'}>{state.passwordErrorMsg}</span>
          </div>
        ) : null}

        {/* 验证码 */}
        <NInput
          class={'password-input mb-12px'}
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
                <span
                  class={`text-14px ${state.countdown > 0 ? 'color-[--color-text-3]' : 'color-[--color-primary-6] cursor-pointer'}`}>
                  {validCodeText.value}
                </span>
              </div>
            )
          }}
        </NInput>

        {/* 验证码错误提示 */}
        {state.validCodeValid ? (
          <div class="text-12px text-left absolute" style="top: 170px;">
            <span class={'color-[--color-danger-6]'}>{state.validCodeErrorMsg}</span>
          </div>
        ) : null}

        <NFlex justify={'space-between'} class={{ 'mb-12px': true, 'mt-12px': state.validCodeValid }}>
          {/* 记住密码 */}
          <NFlex justify={'left'} size={6}>
            <NCheckbox
              checked={state.info.remember}
              onUpdateChecked={(value) => {
                state.info.remember = value
              }}
            />
            <div class="text-12px lh-16px">
              <span class={'color-[--color-primary-6] cursor-pointer'}>记住密码</span>
            </div>
          </NFlex>
          {/* 忘记密码 */}
          <div class="text-12px lh-16px" onClick={handleForget}>
            <span class={'color-[--color-primary-6] hover:color-[--color-primary-5] cursor-pointer'}>忘记密码</span>
          </div>
        </NFlex>

        {/* 登录错误提示 */}
        {/* {state.showLoginError ? (
          <div class="text-12px text-center mb-8px">
            <span class={'color-[--color-danger-6]'}>{state.loginErrorMsg}</span>
          </div>
        ) : null} */}

        {/* 按钮 */}
        <NButton
          loading={state.loading}
          class="w-full h-40px mt-8px mb-24px"
          onClick={normalLogin}
          type={'primary'}
          // disabled={state.loginDisabled}
        >
          <span>{loginText.value}</span>
        </NButton>
      </NFlex>
    )
  }
})
