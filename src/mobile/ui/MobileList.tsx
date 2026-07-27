import './MobileUI.scss'

export interface MobileListProps {
  inset?: boolean
  border?: boolean
}

export default defineComponent({
  name: 'MobileList',
  props: {
    inset: { type: Boolean, default: false },
    border: { type: Boolean, default: false }
  },
  setup(props, { slots }) {
    const classNames = computed(() => [
      'mobile-list',
      props.inset && 'mobile-list--inset',
      props.border && 'mobile-list--border'
    ])

    return () => <div class={classNames.value}>{slots.default?.()}</div>
  }
})
