import './MobileUI.scss'

export interface MobileGridProps {
  cols?: number
  gap?: string
}

export default defineComponent({
  name: 'MobileGrid',
  props: {
    cols: { type: Number, default: 2 },
    gap: { type: String, default: 'var(--spacing-3)' }
  },
  setup(props, { slots }) {
    const gridStyle = computed(() => ({
      gridTemplateColumns: `repeat(${props.cols}, 1fr)`,
      gap: props.gap
    }))

    return () => (
      <div class="mobile-grid" style={gridStyle.value}>
        {slots.default?.()}
      </div>
    )
  }
})
