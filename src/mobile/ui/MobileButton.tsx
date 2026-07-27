import { Button, Loading } from 'vant'
import type { ButtonType } from 'vant'
import type { VNode } from 'vue'
import './MobileUI.scss'

export type MobileButtonType = 'primary' | 'default' | 'danger' | 'ghost'
export type MobileButtonSize = 'small' | 'medium' | 'large'

export interface MobileButtonProps {
  type?: MobileButtonType
  size?: MobileButtonSize
  block?: boolean
  loading?: boolean
  disabled?: boolean
  icon?: () => VNode
  onClick?: (event: MouseEvent) => void
}

const TYPE_MAP: Record<MobileButtonType, ButtonType> = {
  primary: 'primary',
  default: 'default',
  danger: 'danger',
  ghost: 'default'
}

export default defineComponent({
  name: 'MobileButton',
  props: {
    type: { type: String as PropType<MobileButtonType>, default: 'default' },
    size: { type: String as PropType<MobileButtonSize>, default: 'medium' },
    block: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    icon: { type: Function as PropType<() => VNode>, default: null }
  },
  emits: ['click'],
  setup(props, { slots, emit }) {
    const classNames = computed(() => [
      'mobile-button',
      `mobile-button--${props.type}`,
      `mobile-button--${props.size}`,
      props.block && 'mobile-button--block',
      props.disabled && 'mobile-button--disabled',
      props.loading && 'mobile-button--loading'
    ])

    const handleClick = (event: MouseEvent) => {
      if (props.loading || props.disabled) return
      emit('click', event)
    }

    return () => (
      <Button
        type={TYPE_MAP[props.type]}
        size={props.size === 'medium' ? 'normal' : props.size === 'small' ? 'small' : 'large'}
        block={props.block}
        loading={props.loading}
        disabled={props.disabled}
        class={classNames.value}
        onClick={handleClick}
        v-slots={{
          default: () => slots.default?.(),
          icon: () => (props.icon ? <span class="mobile-button__icon">{props.icon()}</span> : null),
          loading: () => <Loading class="mobile-button__loading" size="18px" color="currentColor" />
        }}
      />
    )
  }
})
