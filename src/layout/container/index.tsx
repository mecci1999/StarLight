import { defineComponent, h, KeepAlive, type Component } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import ContainerTabs from './tabs'
import './index.scss'

export default defineComponent({
  name: 'HomeContainer',
  setup() {
    const route = useRoute()
    const isMicroAppRuntime = computed(() => route.name === 'micro-app-runtime')

    return () => (
      <section class="home-container" data-tauri-drag-region>
        <ContainerTabs />
        {/* 主内容区域 */}
        <main class={['service-main', 'home-container__main', { 'is-micro-app-runtime': isMicroAppRuntime.value }]}>
          <RouterView>
            {{
              default: ({ Component }: { Component?: Component }) =>
                Component
                  ? h(
                      KeepAlive,
                      { max: 12 },
                      {
                        default: () => h(Component, { key: route.fullPath })
                      }
                    )
                  : null
            }}
          </RouterView>
        </main>
      </section>
    )
  }
})
