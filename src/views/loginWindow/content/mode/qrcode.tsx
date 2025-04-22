/**
 * 扫码登录
 */
import { useSettingStore } from '@/store/setting'
import { useNetwork } from '@vueuse/core'
import { NAvatar, NButton, NCheckbox, NFlex, NInput, NQrCode, NScrollbar, NSkeleton } from 'naive-ui'
import { getCookie } from '@/utils/Cookie'

export default defineComponent({
  name: 'LoginWindowContentQRCode',
  props: {
    protocol: {
      type: Boolean,
      default: true
    }
  },
  setup(props, { slots }) {
    // 网络连接是否正常
    const { isOnline } = useNetwork()
    const settingStore = useSettingStore()
    const { login } = storeToRefs(settingStore)

    const TOKEN = ref(getCookie('ACCESS_TOKEN'))
    const REFRESH_TOKEN = ref(getCookie('REFRESH_TOKEN'))

    const state = reactive({
      loading: false, // 二维码加载状态
      QRCode: '' // 二维码base64
    })

    // 组件卸载时清除定时器
    onUnmounted(() => {})

    onMounted(async () => {})

    return () => (
      <NFlex class="ma text-center h-full" size={0} vertical={true} data-tauri-drag-region>
        {/* 二维码 */}
        <div class="title text-14px color-[--color-text-1]  mt-4px">
          请打开
          <span class={'color-[--color-primary-6] hover:color-[--color-primary-5] cursor-pointer ml-6px mr-6px'}>
            星光App
          </span>
          扫一扫
        </div>
        {/* 二维码 */}
        <NFlex justify={'center'} class={'qrcode mt-20px'}>
          {state.loading ? (
            // 占位图
            <NSkeleton style={'border-radius: 12px'} width={204} height={204} sharp={false} size={'medium'}></NSkeleton>
          ) : (
            // 二维码
            <NQrCode
              size={180}
              class={{ 'rounded-12px relative': true, blur: false }}
              value={state.QRCode}
              iconSrc="/logo.png"
              errorCorrectionLevel={'H'}></NQrCode>
          )}
          {/* 二维码状态 */}
          <NFlex
            vertical={true}
            size={12}
            align={'center'}
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <svg class="size-42px animate-pulse"></svg>
            <span class="text-(16px #e3e3e3)">{{}}</span>
          </NFlex>
        </NFlex>
      </NFlex>
    )
  }
})
