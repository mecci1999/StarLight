import logoImage from '@/assets/images/avatar/star_1.svg'
import { NFlex, NProgress, NSpin } from 'naive-ui'

export default defineComponent({
  name: 'NavieProvider',
  props: {
    percentage: {
      type: Number
    },
    loadingText: {
      type: String
    }
  },
  setup(props, { slots }) {
    return () => (
      <div data-tauri-drag-region class={'flex-col-center gap-30px size-full'}>
        <NFlex vertical justify="center" size={20}>
          <div class="logo-container">
            <img src={logoImage} class="logo-image" alt="Starlight Logo" loading="eager" />
          </div>

          <NProgress
            type="line"
            showIndicator={false}
            color="#165dff"
            railColor="#165dff30"
            percentage={props.percentage}
          />

          <NFlex justify="center" align="center" size={12}>
            <NSpin size={12} stroke="#165dff" />
            <span class="text-[14px] text-[#666]">{props.loadingText}</span>
          </NFlex>
        </NFlex>
      </div>
    )
  }
})
