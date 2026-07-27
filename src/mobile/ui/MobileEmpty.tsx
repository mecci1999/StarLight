import { Empty } from 'vant'
import './MobileUI.scss'

export interface MobileEmptyProps {
  description?: string
  image?: string
}

export default defineComponent({
  name: 'MobileEmpty',
  props: {
    description: { type: String, default: '暂无数据' },
    image: { type: String, default: 'default' }
  },
  setup(props, { slots }) {
    return () => (
      <div class="mobile-empty">
        <Empty
          description={props.description}
          image={props.image}
          class="mobile-empty__van"
          v-slots={{
            default: slots.default ? () => <div class="mobile-empty__action">{slots.default?.()}</div> : undefined
          }}
        />
      </div>
    )
  }
})
