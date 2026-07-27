import { Badge } from 'vant'

export interface MobileBadgeProps {
  content?: string | number
  dot?: boolean
  max?: number
  color?: string
  offset?: [number, number]
  showZero?: boolean
}

export default defineComponent({
  name: 'MobileBadge',
  props: {
    content: { type: [String, Number], default: '' },
    dot: { type: Boolean, default: false },
    max: { type: Number, default: 99 },
    color: { type: String, default: '' },
    offset: { type: Array as unknown as PropType<[number, number]>, default: null },
    showZero: { type: Boolean, default: false }
  },
  setup(props, { slots }) {
    return () => (
      <Badge
        content={props.content || undefined}
        dot={props.dot}
        max={props.max}
        color={props.color || 'var(--color-danger-6)'}
        offset={props.offset || undefined}
        showZero={props.showZero}>
        {slots.default?.()}
      </Badge>
    )
  }
})
