import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'
import ContainerTabs from './tabs'
import './index.scss'

export default defineComponent({
  name: 'HomeContainer',
  setup(props, { slots }) {
    return () => (
      <section class="home-container" data-tauri-drag-region>
        <ContainerTabs />
        {/* 主内容区域 */}
        <main class="service-main home-container__main">
          <RouterView />
        </main>
      </section>
    )
  }
})
