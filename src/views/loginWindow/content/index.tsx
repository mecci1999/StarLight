import { useSettingStore } from '@/store/setting'
import { useNetwork } from '@vueuse/core'
import { NButton, NCheckbox, NFlex, NModal } from 'naive-ui'
import LegalDocumentContent from '@/shared/legal/LegalDocumentContent'
import type { LegalDocumentKind } from '@/shared/legal/agreements'
import { hasAcceptedLegalAgreements, persistLegalAgreementAcceptance } from '@/shared/legal/agreementAcceptance'
import LoginWindowContentEmail from './mode/email'
import LoginWindowContentQRCode from './mode/qrcode'
import LoginWindowContentRegister from './mode/register'
import LoginWindowContentForget from './mode/forget'
import './index.scss'

export default defineComponent({
  name: 'LoginWindowContent',
  setup(props, { slots }) {
    // 网络连接是否正常
    const { isOnline } = useNetwork()
    const settingStore = useSettingStore()
    const { login } = storeToRefs(settingStore)

    const state = reactive({
      mode: 'login', // 页面模式 login 账号登录 scan 扫码登录 forget 忘记密码 register 注册账号
      loginDisabled: !isOnline.value, // 登录按钮禁用状态
      protocol: hasAcceptedLegalAgreements(), // 是否同意协议
      activeLegalDocument: null as LegalDocumentKind | null
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

    /**
     * 处理模式切换
     */
    const handleSwitchMode = (mode: string) => {
      state.mode = mode
    }

    const showLegalDocument = (kind: LegalDocumentKind) => {
      state.activeLegalDocument = kind
    }

    return () => (
      <div class="login-window-content">
        {/* 头部 */}
        <div class="header">
          <div class="title">{loginText.value}</div>
          <div class="sub-title">还有永不落幕的星光✨，给你宇宙级别的浪漫～</div>
        </div>
        {/* 内容 */}
        <div class="content">
          {state.mode === 'login' ? (
            <LoginWindowContentEmail protocol={state.protocol} onSwitchMode={handleSwitchMode} />
          ) : null}
          {state.mode === 'scan' ? <LoginWindowContentQRCode protocol={state.protocol} /> : null}
          {state.mode === 'register' ? (
            <LoginWindowContentRegister protocol={state.protocol} onSwitchMode={handleSwitchMode} />
          ) : null}
          {state.mode === 'forget' ? (
            <LoginWindowContentForget protocol={state.protocol} onSwitchMode={handleSwitchMode} />
          ) : null}
        </div>
        {/* 底部 */}
        <div class="footer">
          <NFlex justify={'center'} class="footer-switches" size={10}>
            {/* 注册账号 */}
            <div
              class="footer-switch-item"
              onClick={() => {
                if (state.mode === 'forget') {
                  state.mode = 'login'
                } else if (state.mode !== 'register') {
                  state.mode = 'register'
                } else {
                  state.mode = 'login'
                }
              }}>
              <span class="footer-switch-link">
                {' '}
                {state.mode === 'register' ? '返回登录' : state.mode === 'forget' ? '账号登录' : '注册账号'}
              </span>
            </div>
            <div class="footer-switch-divider"></div>
            {/* 扫码登录 */}
            <div
              class="footer-switch-item"
              onClick={() => {
                if (state.mode !== 'scan') {
                  state.mode = 'scan'
                } else {
                  state.mode = 'login'
                }
              }}>
              <span class="footer-switch-link">{state.mode === 'scan' ? '账号登录' : '扫码登录'}</span>
            </div>
          </NFlex>
          {/* 协议 */}
          <NFlex justify={'center'} size={6}>
            <NCheckbox
              checked={state.protocol}
              onUpdateChecked={(value) => {
                state.protocol = value
                persistLegalAgreementAcceptance(value)
              }}
            />
            <div class="footer-agreement">
              <span>已阅读并同意</span>
              <button type="button" class="footer-agreement__link" onClick={() => showLegalDocument('service')}>
                服务协议
              </button>
              <span>和</span>
              <button type="button" class="footer-agreement__link" onClick={() => showLegalDocument('privacy')}>
                星光隐私保护指引
              </button>
            </div>
          </NFlex>
        </div>
        <NModal
          show={state.activeLegalDocument !== null}
          onUpdateShow={(show) => {
            if (!show) state.activeLegalDocument = null
          }}
          preset="card"
          title={state.activeLegalDocument === 'service' ? '星光服务协议' : '星光隐私保护指引'}
          class="login-window-content__legal-modal"
          style={{ width: 'min(680px, calc(100vw - 48px))' }}
          closable
          maskClosable={false}
          v-slots={{
            default: () => (
              <div class="login-window-content__legal-scroll">
                {state.activeLegalDocument && <LegalDocumentContent kind={state.activeLegalDocument} />}
              </div>
            ),
            action: () => <NButton onClick={() => (state.activeLegalDocument = null)}>关闭</NButton>
          }}
        />
      </div>
    )
  }
})
