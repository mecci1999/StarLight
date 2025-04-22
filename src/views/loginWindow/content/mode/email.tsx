import { useLoginHistoriesStore } from '@/store/loginHistory'
import { useSettingStore } from '@/store/setting'
import { useNetwork } from '@vueuse/core'
import { NAvatar, NButton, NCheckbox, NFlex, NInput, NScrollbar } from 'naive-ui'
import { getCookie } from '@/utils/Cookie'

export default defineComponent({
  name: 'LoginWindowContentEmail',
  props: {
    protocol: {
      type: Boolean,
      default: true
    }
  },
  setup(props, { slots }) {
    const { loginHistories } = useLoginHistoriesStore()
    // 网络连接是否正常
    const { isOnline } = useNetwork()
    const settingStore = useSettingStore()
    const { login } = storeToRefs(settingStore)

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
      validCode: '', // 邮箱验证码
      countdown: 0, // 验证码倒计时
      countdownTimer: null as any // 倒计时定时器
    })

    const loginText = computed(() => {
      return isOnline.value ? (isAutoLogin.value ? '登录' : '登录') : '网络异常'
    })

    const validCodeText = computed(() => {
      return state.countdown > 0 ? `${state.countdown}秒后重新发送` : '获取验证码'
    })

    // 登录按钮的禁用状态
    watchEffect(() => {
      state.loginDisabled = !(state.info.email && state.info.password && props.protocol && isOnline.value)
    })

    // 监听网络连接状态
    watch(isOnline, (value) => {
      state.loginDisabled = !value
    })

    /**
     * 选择账号
     */
    const giveAccount = (item: any) => {
      state.info.email = item.email
    }

    /**
     * 删除账号
     */
    const deleteAccount = (item: any) => {}

    /**
     * 登录
     */
    const normalLogin = async () => {}

    /**
     * 忘记密码
     */
    const handleForget = () => {}

    /**
     * 发送验证码
     */
    const handleValidCode = () => {
      // 如果倒计时大于0，不允许再次发送
      if (state.countdown > 0) return

      // 判断邮箱是否正确
      const reg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
      if (!reg.test(state.info.email)) {
        state.emailValid = true
        return
      }

      // 发送验证码
      // TODO: 这里添加发送验证码的API调用

      // 开始倒计时
      state.countdown = 60
      state.countdownTimer = setInterval(() => {
        state.countdown--
        if (state.countdown <= 0) {
          clearInterval(state.countdownTimer)
          state.countdownTimer = null
        }
      }, 1000)
    }

    // 组件卸载时清除定时器
    onUnmounted(() => {
      if (state.countdownTimer) {
        clearInterval(state.countdownTimer)
        state.countdownTimer = null
      }
    })

    onMounted(async () => {})

    return () => (
      <NFlex class="ma text-center h-full" size={0} vertical={true}>
        {/* 邮箱账号 */}
        <NInput
          class={{ 'email-input': true, 'pl-16px': loginHistories.length > 0, 'mb-22px': true }}
          size={'large'}
          maxlength={32}
          minlength={6}
          value={state.info.email}
          onUpdateValue={(value) => {
            state.info.email = value
          }}
          type={'text'}
          placeholder={state.emailPH}
          clearable={true}
          onBlur={() => {
            // 判断邮箱是否有效
            if (state.info.email.length > 0) {
              // 使用正则判断邮箱
              const reg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
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
                  onClick={() => {
                    state.arrowStatus = !state.arrowStatus
                  }}>
                  {!state.arrowStatus ? (
                    <svg class="down w-18px h-18px color-#505050 cursor-pointer">
                      <use href="#down"></use>
                    </svg>
                  ) : (
                    <svg class="down w-18px h-18px color-#505050 cursor-pointer">
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
          <div class="account-box absolute min-w-36px max-h-140px bg-#fdfdfd mt-45px z-99 rounded-8px p-8px box-border">
            <NScrollbar style={{ maxHeight: '120px' }} trigger={'none'}>
              {loginHistories.map((item) => (
                <NFlex vertical class={'p-8px cursor-pointer hover:bg-#f3f3f3 hover:rounded-6px'}>
                  <div
                    class="account-item flex-between-center"
                    onClick={() => {
                      giveAccount(item)
                    }}>
                    <NAvatar class="size-28px bg-#ccc rounded-50%"></NAvatar>
                    <p class="text-14px color-[--color-text-2]">{item.email}</p>
                    <svg
                      class="w-12px h-12px"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteAccount(item)
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
          }}
          showPasswordOn={'click'}
          type={'password'}
          placeholder={state.passwordPH}
          clearable={true}></NInput>

        {/* 验证码 */}
        <NInput
          class={'password-input mb-12px'}
          size={'large'}
          maxlength={6}
          value={state.validCode}
          onUpdateValue={(value) => {
            state.validCode = value
          }}
          type={'text'}
          placeholder={'请输入验证码'}
          clearable={true}>
          {{
            suffix: () => (
              <div onClick={handleValidCode}>
                <span class={'text-14px color-[--color-primary-6] cursor-pointer'}>{validCodeText.value}</span>
              </div>
            )
          }}
        </NInput>

        <NFlex justify={'space-between'} class={'mb-12px'}>
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

        {/* 按钮 */}
        <NButton loading={state.loading} class="w-full h-40px mt-8px mb-24px" onClick={normalLogin} type={'primary'}>
          <span>{loginText.value}</span>
        </NButton>
      </NFlex>
    )
  }
})
