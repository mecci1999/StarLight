import { Loading } from 'vant'
import type { LoadingType } from 'vant'
import './MobileUI.scss'

export interface MobileLoadingProps {
  loading?: boolean
  size?: string | number
  type?: LoadingType
  color?: string
  vertical?: boolean
  text?: string
}

export default defineComponent({
  name: 'MobileLoading',
  props: {
    loading: { type: Boolean, default: true },
    size: { type: [String, Number], default: '24px' },
    type: { type: String as PropType<LoadingType>, default: 'circular' },
    color: { type: String, default: '' },
    vertical: { type: Boolean, default: false },
    text: { type: String, default: '' }
  },
  setup(props, { slots }) {
    return () => {
      if (!props.loading) {
        return slots.default?.()
      }

      return (
        <div class={['mobile-loading', props.vertical && 'mobile-loading--vertical']}>
          <Loading
            size={props.size}
            type={props.type}
            color={props.color || 'var(--color-text-3)'}
            vertical={props.vertical}
          />
          {(props.text || slots.default) && <span class="mobile-loading__text">{props.text || slots.default?.()}</span>}
        </div>
      )
    }
  }
})
