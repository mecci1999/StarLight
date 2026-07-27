import type { VNode } from 'vue'
import './MobileUI.scss'

export type ArrowDirection = 'right' | 'left' | 'up' | 'down'

export interface MobileListItemProps {
  title?: string
  value?: string
  label?: string
  isLink?: boolean
  onClick?: (event: MouseEvent) => void
  icon?: () => VNode
  arrowDirection?: ArrowDirection
}

const ARROW_MAP: Record<ArrowDirection, string> = {
  right: '›',
  left: '‹',
  up: '⌃',
  down: '⌄'
}

export default defineComponent({
  name: 'MobileListItem',
  props: {
    title: { type: String, default: '' },
    value: { type: String, default: '' },
    label: { type: String, default: '' },
    isLink: { type: Boolean, default: false },
    onClick: { type: Function as PropType<(event: MouseEvent) => void>, default: null },
    icon: { type: Function as PropType<() => VNode>, default: null },
    arrowDirection: { type: String as PropType<ArrowDirection>, default: 'right' }
  },
  setup(props, { slots }) {
    const classNames = computed(() => [
      'mobile-list-item',
      (props.isLink || typeof props.onClick === 'function') && 'mobile-list-item--clickable'
    ])

    return () => (
      <div class={classNames.value} onClick={props.onClick}>
        {(typeof props.icon === 'function' || slots.icon) && (
          <div class="mobile-list-item__icon">{slots.icon ? slots.icon() : props.icon?.()}</div>
        )}
        <div class="mobile-list-item__content">
          {props.title && <div class="mobile-list-item__title">{props.title}</div>}
          {props.label && <div class="mobile-list-item__label">{props.label}</div>}
          {slots.default?.()}
        </div>
        {props.value && <div class="mobile-list-item__value">{props.value}</div>}
        {(props.isLink || slots.extra) && (
          <div class="mobile-list-item__arrow">{slots.extra ? slots.extra() : ARROW_MAP[props.arrowDirection]}</div>
        )}
      </div>
    )
  }
})
