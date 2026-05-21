import { NIcon, NPopover, NTooltip } from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import {
  EllipsisHorizontalOutline,
  ChevronForwardOutline,
  ChevronBackOutline,
  ReorderThreeOutline
} from '@vicons/ionicons5'
import { useDraggable } from 'vue-draggable-plus'
import { defineComponent, ref, watch, computed, h, nextTick, onBeforeUnmount, onMounted } from 'vue'
import {
  DEFAULT_HOME_SIDEBAR_KEY,
  getDefaultHomeSidebarModules,
  resolveHomeSidebarKey,
  type HomeSidebarModule
} from '@/app/navigation/homeRouteMeta'
import { getStoredUserInfo } from '@/services/authSession'
import './index.scss'

type SidebarMode = 'icon' | 'icon-text'

const STORAGE_KEY = 'starlight-sidebar-order'
const STORAGE_MODE_KEY = 'starlight-sidebar-mode'

export default defineComponent({
  name: 'HomeLeft',
  setup() {
    const router = useRouter()
    const route = useRoute()

    const activeModule = ref(DEFAULT_HOME_SIDEBAR_KEY)
    const isEditing = ref(false)
    const contentRef = ref<HTMLElement | null>(null)
    const draggableRef = ref<HTMLElement | null>(null)
    const visibleCount = ref(0)
    let resizeObserver: ResizeObserver | null = null

    const savedMode = localStorage.getItem(STORAGE_MODE_KEY) as SidebarMode | null
    const sidebarMode = ref<SidebarMode>(savedMode || 'icon-text')

    const defaultModules = getDefaultHomeSidebarModules().filter((module) => {
      if (module.group !== 'admin') return true
      return Boolean(getStoredUserInfo()?.isAdmin)
    })

    const loadOrder = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const order = JSON.parse(saved)
          const map = new Map(defaultModules.map((m) => [m.key, m]))
          const result: HomeSidebarModule[] = []
          for (const key of order) {
            const m = map.get(key)
            if (m) {
              result.push(m)
              map.delete(key)
            }
          }
          for (const m of map.values()) result.push(m)
          return result
        }
      } catch (e) {
        console.error('Load order failed:', e)
      }
      return [...defaultModules]
    }

    const allModules = ref(loadOrder())

    const saveOrder = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allModules.value.map((m) => m.key)))
    }

    const saveMode = () => {
      localStorage.setItem(STORAGE_MODE_KEY, sidebarMode.value)
    }

    watch(
      () => route.fullPath,
      () => {
        activeModule.value = resolveHomeSidebarKey(route.path, route.meta)
      },
      { immediate: true }
    )

    const visibleModules = computed(() => allModules.value.slice(0, visibleCount.value))
    const moreModules = computed(() => allModules.value.slice(visibleCount.value))

    const updateVisibleCount = () => {
      const container = contentRef.value
      if (!container) return

      const isIconMode = sidebarMode.value === 'icon'
      const itemHeight = isIconMode ? 40 : 40
      const gap = 4
      const moreHeight = isIconMode ? 48 : 44
      const availableHeight = container.clientHeight

      if (availableHeight <= 0) {
        visibleCount.value = allModules.value.length
        return
      }

      const totalCount = allModules.value.length
      const fullCapacity = Math.max(0, Math.floor((availableHeight + gap) / (itemHeight + gap)))

      if (totalCount <= fullCapacity) {
        visibleCount.value = totalCount
        return
      }

      const reservedCapacity = Math.max(0, Math.floor((availableHeight - moreHeight + gap) / (itemHeight + gap)))
      visibleCount.value = Math.min(totalCount, reservedCapacity)
    }

    const handleSelect = (module: any) => {
      if (isEditing.value) return
      activeModule.value = module.key
      router.push(module.route)
    }

    function onDragEnd() {
      saveOrder()
      nextTick(updateVisibleCount)
    }

    useDraggable(draggableRef, allModules, {
      animation: 200,
      ghostClass: 'ghost-item',
      chosenClass: 'chosen-item',
      disabled: !isEditing.value,
      onEnd: onDragEnd
    })

    const toggleMode = () => {
      sidebarMode.value = sidebarMode.value === 'icon' ? 'icon-text' : 'icon'
      saveMode()
      nextTick(updateVisibleCount)
    }

    const toggleEdit = () => {
      isEditing.value = !isEditing.value
      nextTick(updateVisibleCount)
    }

    const renderMoreTrigger = () => {
      const isIconMode = sidebarMode.value === 'icon'

      return (
        <div class={['sidebar-more-trigger', isIconMode ? 'sidebar-more-trigger--icon' : 'sidebar-more-trigger--text']}>
          <NIcon size={isIconMode ? 22 : 18} class={isIconMode ? '' : 'sidebar-more-trigger__icon'}>
            <EllipsisHorizontalOutline />
          </NIcon>
          {!isIconMode && <span class="sidebar-more-trigger__label">更多</span>}
        </div>
      )
    }

    onMounted(() => {
      nextTick(() => {
        updateVisibleCount()
        if (contentRef.value) {
          resizeObserver = new ResizeObserver(() => updateVisibleCount())
          resizeObserver.observe(contentRef.value)
        }
      })
    })

    onBeforeUnmount(() => {
      resizeObserver?.disconnect()
    })

    watch(allModules, () => nextTick(updateVisibleCount), { deep: true })
    watch(sidebarMode, () => nextTick(updateVisibleCount))

    const renderItem = (module: any, isInMore = false) => {
      const isActive = activeModule.value === module.key
      const isIconMode = sidebarMode.value === 'icon'

      if (isIconMode) {
        const content = (
          <div
            class={[
              'sidebar-item',
              'sidebar-item--icon',
              isActive ? 'is-active' : '',
              isInMore ? 'sidebar-item--more' : ''
            ]}
            onClick={() => handleSelect(module)}>
            <NIcon size={22} class="sidebar-item__icon">
              {h(module.icon)}
            </NIcon>
          </div>
        )
        if (isInMore) return content
        return (
          <NTooltip placement="right" trigger="hover">
            {{ trigger: () => <div key={module.key}>{content}</div>, default: () => module.label }}
          </NTooltip>
        )
      }

      return (
        <div
          key={module.key}
          class={['sidebar-item', 'sidebar-item--text', isActive ? 'is-active' : '']}
          onClick={() => handleSelect(module)}>
          {isEditing.value && (
            <NIcon size={16} class="sidebar-item__drag">
              <ReorderThreeOutline />
            </NIcon>
          )}
          <NIcon size={20} class="sidebar-item__icon">
            {h(module.icon)}
          </NIcon>
          <span class="sidebar-item__label">{module.label}</span>
        </div>
      )
    }

    return () => {
      const isIconMode = sidebarMode.value === 'icon'

      return (
        <div class={['app-home__left', isIconMode ? 'app-home__left--icon' : 'app-home__left--text']}>
          <div
            ref={contentRef}
            class={['app-home__left__content-shell', isIconMode ? 'app-home__left__content-shell--icon' : '']}>
            <div ref={draggableRef} class={['app-home__left__list', isIconMode ? 'app-home__left__list--icon' : '']}>
              {visibleModules.value.map((module) => renderItem(module))}
            </div>

            {moreModules.value.length > 0 && (
              <div
                class={[
                  'app-home__left__more',
                  isIconMode ? 'app-home__left__more--icon' : 'app-home__left__more--text'
                ]}>
                <NPopover
                  trigger="hover"
                  placement={isIconMode ? 'right' : 'right-start'}
                  style={{ padding: '8px', backgroundColor: 'var(--color-bg-5)' }}>
                  {{
                    trigger: () => renderMoreTrigger(),
                    default: () => (
                      <div
                        class={[
                          'sidebar-more-popover',
                          isIconMode ? 'sidebar-more-popover--icon' : 'sidebar-more-popover--text'
                        ]}>
                        {moreModules.value.map((module) => renderItem(module, true))}
                      </div>
                    )
                  }}
                </NPopover>
              </div>
            )}
          </div>

          <div
            class={[
              'app-home__left__footer',
              isIconMode ? 'app-home__left__footer--icon' : 'app-home__left__footer--text'
            ]}>
            <div
              class={[
                'sidebar-footer-action',
                isIconMode ? 'sidebar-footer-action--icon' : 'sidebar-footer-action--text'
              ]}
              onClick={toggleEdit}>
              <NIcon size={18} class="sidebar-footer-action__icon">
                <ReorderThreeOutline />
              </NIcon>
              {!isIconMode && (
                <span class="sidebar-footer-action__label">{isEditing.value ? '完成排序' : '自定义排序'}</span>
              )}
            </div>

            <div
              class={[
                'sidebar-footer-action',
                isIconMode ? 'sidebar-footer-action--icon' : 'sidebar-footer-action--text'
              ]}
              onClick={toggleMode}>
              <NIcon size={18} class="sidebar-footer-action__icon">
                {isIconMode ? <ChevronForwardOutline /> : <ChevronBackOutline />}
              </NIcon>
              {!isIconMode && <span class="sidebar-footer-action__label">收起</span>}
            </div>
          </div>
        </div>
      )
    }
  }
})
