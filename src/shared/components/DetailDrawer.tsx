import { defineComponent } from 'vue'
import { NDrawer, NDrawerContent } from 'naive-ui'

export default defineComponent({
  name: 'DetailDrawer',
  props: {
    show: { type: Boolean, required: true },
    title: { type: String, required: true },
    width: { type: String as () => 'sm' | 'md' | 'lg' | 'xl', default: 'md' },
    loading: { type: Boolean, default: false },
    destroyOnClose: { type: Boolean, default: false }
  },
  emits: ['update:show', 'close'],
  setup(props, { emit, slots }) {
    const widthMap = {
      sm: 480,
      md: 720,
      lg: 960,
      xl: 1280
    }

    return () => (
      <NDrawer
        show={props.show}
        width={widthMap[props.width]}
        placement="right"
        onUpdateShow={(value) => emit('update:show', value)}
        onAfterLeave={() => emit('close')}>
        <NDrawerContent title={props.title} closable nativeScrollbar={false}>
          {slots.header?.()}
          {slots.default?.()}
          {slots.footer?.()}
        </NDrawerContent>
      </NDrawer>
    )
  }
})
