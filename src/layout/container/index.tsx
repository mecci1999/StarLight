import { defineComponent } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import ContainerTabs from './tabs'
import './index.scss'

export default defineComponent({
  name: 'HomeContainer',
  setup(props, { slots }) {
    const route = useRoute()
    const isMicroAppRuntime = computed(() => route.name === 'micro-app-runtime')

    return () => (
      <section class="home-container" data-tauri-drag-region>
        <ContainerTabs />
        {/* 主内容区域 */}
        <main class={['service-main', 'home-container__main', { 'is-micro-app-runtime': isMicroAppRuntime.value }]}>
          <RouterView />
        </main>
      </section>
    )
  }
})
