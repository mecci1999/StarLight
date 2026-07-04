import { AddOutline, CloseOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { computed, defineComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import './tabs.scss'

type VisitedTab = {
  key: string
  path: string
  title: string
}

const fallbackTab: VisitedTab = {
  key: '/home/overview',
  path: '/home/overview',
  title: '看板'
}

export default defineComponent({
  name: 'ContainerTabs',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const tabs = ref<VisitedTab[]>([])

    const activeKey = computed(() => route.fullPath)

    const addCurrentRoute = () => {
      if (!route.path.startsWith('/home')) return
      const queryTitle = Array.isArray(route.query.title) ? route.query.title[0] : route.query.title
      const title = String(queryTitle || route.meta?.title || route.name || route.path)
      const nextTab = { key: route.fullPath, path: route.fullPath, title }
      const existingIndex = tabs.value.findIndex((tab) => tab.key === nextTab.key)
      if (existingIndex >= 0) {
        tabs.value[existingIndex] = nextTab
        return
      }
      tabs.value.push(nextTab)
    }

    const openTab = (tab: VisitedTab) => {
      if (tab.key !== route.fullPath) router.push(tab.path)
    }

    const openFallbackTab = () => {
      if (route.fullPath !== fallbackTab.path) router.push(fallbackTab.path)
    }

    const closeTab = (tab: VisitedTab, event: MouseEvent) => {
      event.stopPropagation()
      const index = tabs.value.findIndex((item) => item.key === tab.key)
      if (index < 0) return
      tabs.value.splice(index, 1)
      if (tabs.value.length === 0) tabs.value.push({ ...fallbackTab })
      if (tab.key !== route.fullPath) return
      const nextTab = tabs.value[index] || tabs.value[index - 1] || tabs.value[0] || fallbackTab
      router.push(nextTab.path)
    }

    const handleTabMouseup = (tab: VisitedTab, event: MouseEvent) => {
      if (event.button === 1) closeTab(tab, event)
    }

    watch(() => route.fullPath, addCurrentRoute, { immediate: true })

    return () => (
      <nav class="container-tabs" aria-label="已打开页面">
        <div class="container-tabs__track">
          {tabs.value.map((tab) => (
            <button
              key={tab.key}
              type="button"
              class={['container-tabs__item', tab.key === activeKey.value && 'is-active']}
              onClick={() => openTab(tab)}
              onMouseup={(event) => handleTabMouseup(tab, event)}>
              <span class="container-tabs__title">{tab.title}</span>
              <i
                class="container-tabs__close"
                onClick={(event) => closeTab(tab, event)}
                aria-label={`关闭${tab.title}`}
                title={`关闭 ${tab.title}`}>
                <NIcon size={13}>
                  <CloseOutline />
                </NIcon>
              </i>
            </button>
          ))}
          <button
            type="button"
            class="container-tabs__new"
            onClick={openFallbackTab}
            aria-label="打开看板"
            title="打开看板">
            <NIcon size={15}>
              <AddOutline />
            </NIcon>
          </button>
        </div>
      </nav>
    )
  }
})
