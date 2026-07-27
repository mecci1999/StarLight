import './MobileUI.scss'

export type MobileCardSize = 'small' | 'default'

export interface MobileCardProps {
  title?: string
  size?: MobileCardSize
  bordered?: boolean
  shadowed?: boolean
  onClick?: (event: MouseEvent) => void
  class?: string
}

export default defineComponent({
  name: 'MobileCard',
  props: {
    title: { type: String, default: '' },
    size: { type: String as PropType<MobileCardSize>, default: 'default' },
    bordered: { type: Boolean, default: true },
    shadowed: { type: Boolean, default: false },
    onClick: { type: Function as PropType<(event: MouseEvent) => void>, default: null }
  },
  setup(props, { slots }) {
    const classNames = computed(() => [
      'mobile-card',
      `mobile-card--${props.size}`,
      props.bordered && 'mobile-card--bordered',
      props.shadowed && 'mobile-card--shadowed',
      typeof props.onClick === 'function' && 'mobile-card--clickable'
    ])

    const handleClick = (event: MouseEvent) => {
      props.onClick?.(event)
    }

    return () => (
      <div class={classNames.value} onClick={handleClick}>
        {(props.title || slots.header || slots.extra) && (
          <div class="mobile-card__header">
            {slots.header ? slots.header() : props.title ? <span class="mobile-card__title">{props.title}</span> : null}
            {slots.extra && <div class="mobile-card__extra">{slots.extra()}</div>}
          </div>
        )}
        {slots.default && <div class="mobile-card__body">{slots.default()}</div>}
      </div>
    )
  }
})
