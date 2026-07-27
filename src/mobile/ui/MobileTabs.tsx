import { Tabs } from 'vant'
import type { TabsType } from 'vant'
import './MobileUI.scss'

export interface MobileTabsProps {
  active?: string | number
  type?: TabsType
  sticky?: boolean
  offsetTop?: number
  swipeable?: boolean
  animated?: boolean
  color?: string
}

export default defineComponent({
  name: 'MobileTabs',
  props: {
    active: { type: [String, Number], default: 0 },
    type: { type: String as PropType<TabsType>, default: 'line' },
    sticky: { type: Boolean, default: false },
    offsetTop: { type: Number, default: 0 },
    swipeable: { type: Boolean, default: false },
    animated: { type: Boolean, default: false },
    color: { type: String, default: '' }
  },
  emits: ['update:active', 'change'],
  setup(props, { slots, emit }) {
    const handleChange = (value: string | number) => {
      emit('update:active', value)
      emit('change', value)
    }

    return () => (
      <div class="mobile-tabs">
        <Tabs
          active={props.active}
          onChange={handleChange}
          type={props.type}
          sticky={props.sticky}
          offsetTop={props.offsetTop}
          swipeable={props.swipeable}
          animated={props.animated}
          color={props.color || 'var(--color-primary-6)'}>
          {slots.default?.()}
        </Tabs>
      </div>
    )
  }
})
