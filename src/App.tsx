import NaiveProvider from '@/components/common/NaiveProvider'
import { RouterView } from 'vue-router'

export default defineComponent({
  name: 'App',
  setup() {
    return () => (
      <NaiveProvider>
        <div id={'app-container'}>
          <RouterView />
        </div>
      </NaiveProvider>
    )
  }
})
