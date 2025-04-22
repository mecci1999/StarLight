import { useSettingStore } from '@/store/setting'
import { getCookie } from '@/utils/Cookie'
import { useNetwork } from '@vueuse/core'
import { NCheckbox, NFlex } from 'naive-ui'
import LoginWindowContentEmail from './mode/email'
import LoginWindowContentQRCode from './mode/qrcode'
import './index.scss'

export default defineComponent({
  name: 'LoginWindowContent',
  setup(props, { slots }) {
    // 网络连接是否正常
    const { isOnline } = useNetwork()
    const settingStore = useSettingStore()
    const { login } = storeToRefs(settingStore)

    const TOKEN = ref(getCookie('ACCESS_TOKEN'))
    const REFRESH_TOKEN = ref(getCookie('REFRESH_TOKEN'))
    const isAutoLogin = ref(login.value.autoLogin && TOKEN.value && REFRESH_TOKEN.value)

    const state = reactive({
      mode: 'login', // 页面模式 login 账号登录 scan 扫码登录 forget 忘记密码 register 注册账号
      loginDisabled: !isOnline.value, // 登录按钮禁用状态
      protocol: true // 是否同意协议
    })

    const loginText = computed(() => {
      switch (state.mode) {
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

    // 监听网络连接状态
    watch(isOnline, (value) => {
      state.loginDisabled = !value
    })

    onMounted(async () => {})

    // 组件卸载时清除定时器
    onUnmounted(() => {})

    return () => (
      <div class={'login-window-content rounded-25px'}>
        {/* 头部 */}
        <div class="header">
          <div class="title flex-center">{loginText.value}</div>
          <div class="sub-title flex-center">还有有不落幕的星光✨，给你宇宙级别的浪漫～</div>
        </div>
        {/* 内容 */}
        <div class="content">
          {state.mode === 'login' ? <LoginWindowContentEmail protocol={state.protocol} /> : null}
          {state.mode === 'scan' ? <LoginWindowContentQRCode protocol={state.protocol} /> : null}
        </div>
        {/* 底部 */}
        <div class="footer">
          <NFlex justify={'center'} class="mb-24px" size={10}>
            {/* 注册账号 */}
            <div
              class="text-14px "
              onClick={() => {
                if (state.mode !== 'register') {
                  state.mode = 'register'
                } else {
                  state.mode = 'login'
                }
              }}>
              <span class={'color-[--color-primary-6] hover:color-[--color-primary-5] cursor-pointer'}>
                {' '}
                {state.mode === 'register' ? '返回登录' : '注册账号'}
              </span>
            </div>
            <div class="w-1px bg-[--color-text-3]"></div>
            {/* 扫码登录 */}
            <div
              class="text-14px"
              onClick={() => {
                if (state.mode !== 'scan') {
                  state.mode = 'scan'
                } else {
                  state.mode = 'login'
                }
              }}>
              <span class={'color-[--color-primary-6] hover:color-[--color-primary-5] cursor-pointer'}>
                {state.mode === 'scan' ? '账号登录' : '扫码登录'}
              </span>
            </div>
          </NFlex>
          {/* 协议 */}
          <NFlex justify={'center'} size={6}>
            <NCheckbox
              checked={state.protocol}
              onUpdateChecked={(value) => {
                state.protocol = value
              }}
            />
            <div class="text-12px color-[--color-text-3] cursor-default lh-14px">
              <span>已阅读并同意</span>
              <span class={'color-[--color-primary-6] cursor-pointer'}>服务协议</span>
              <span>和</span>
              <span class={'color-[--color-primary-6] cursor-pointer'}>StarLight隐私保护指引</span>
            </div>
          </NFlex>
        </div>
      </div>
    )
  }
})
