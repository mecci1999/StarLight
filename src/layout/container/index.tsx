import { RouterView } from 'vue-router'

export default defineComponent({
  name: 'HomeContainer',
  setup(props, { slots }) {
    return () => (
      <div class="flex-1 h-full bg-[--color-bg-1] overflow-hidden">
        <RouterView />
      </div>
    )
  }
})
