import './MobileUI.scss'

export type MobileTagType = 'success' | 'warning' | 'danger' | 'info' | 'default'
export type MobileTagSize = 'small' | 'medium'

export interface MobileTagProps {
  type?: MobileTagType
  size?: MobileTagSize
  plain?: boolean
  round?: boolean
  closable?: boolean
  onClick?: (event: MouseEvent) => void
}

export default defineComponent({
  name: 'MobileTag',
  props: {
    type: { type: String as PropType<MobileTagType>, default: 'default' },
    size: { type: String as PropType<MobileTagSize>, default: 'medium' },
    plain: { type: Boolean, default: false },
    round: { type: Boolean, default: false },
    closable: { type: Boolean, default: false },
    onClick: { type: Function as PropType<(event: MouseEvent) => void>, default: null }
  },
  emits: ['close'],
  setup(props, { slots, emit }) {
    const classNames = computed(() => [
      'mobile-tag',
      `mobile-tag--${props.type}`,
      `mobile-tag--${props.size}`,
      props.plain && 'mobile-tag--plain',
      props.round && 'mobile-tag--round',
      props.closable && 'mobile-tag--closable'
    ])

    const handleClose = (event: MouseEvent) => {
      event.stopPropagation()
      emit('close')
    }

    const handleClick = (event: MouseEvent) => {
      props.onClick?.(event)
    }

    return () => (
      <span class={classNames.value} onClick={handleClick}>
        {slots.default?.()}
        {props.closable && (
          <span class="mobile-tag__close" onClick={handleClose}>
            ✕
          </span>
        )}
      </span>
    )
  }
})
