import { NIcon, NPopover, NTooltip } from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import {
  ServerOutline,
  GitNetworkOutline,
  StatsChartOutline,
  NotificationsOutline,
  DocumentTextOutline,
  GitBranchOutline,
  CogOutline,
  PeopleOutline,
  SettingsOutline,
  ConstructOutline,
  EllipsisHorizontalOutline,
  GridOutline,
  WalletOutline
} from '@vicons/ionicons5'
import { VueDraggable } from 'vue-draggable-plus'
import { markRaw, defineComponent, ref, watch, computed, h } from 'vue'
import './index.scss'

export default defineComponent({
  name: 'HomeLeft',
  setup(props, { slots }) {
    const router = useRouter()
    const route = useRoute()

    const activeModule = ref('service-overview')
    const maxVisibleItems = 10

    watch(
      () => route.path,
      (newPath) => {
        const moduleMap: Record<string, string> = {
          '/home/service-overview': 'service-overview',
          '/home/service-topology': 'service-overview',
          '/home/service-list': 'service-overview',
          '/home/instance-monitor': 'service-overview',
          '/home/real-time-monitor': 'performance',
          '/home/metrics-analysis': 'performance',
          '/home/custom-dashboard': 'performance',
          '/home/alert-list': 'alert',
          '/home/alert-rules': 'alert',
          '/home/notification-history': 'alert',
          '/home/log-center': 'log',
          '/home/service-logs': 'log',
          '/home/exception-analysis': 'log',
          '/home/tracing': 'tracing',
          '/home/slow-analysis': 'tracing',
          '/home/config-center': 'config',
          '/home/config-list': 'config',
          '/home/config-history': 'config',
          '/home/registry-view': 'registry',
          '/home/service-registry': 'registry',
          '/home/user-management': 'user',
          '/home/team-collaboration': 'user',
          '/home/role-management': 'user',
          '/home/data-source': 'system',
          '/home/plugin-management': 'system',
          '/home/system-settings': 'system',
          '/home/audit-logs': 'audit',
          '/home/system-events': 'audit',
          '/home/api-testing': 'testing',
          '/home/mock-service': 'testing',
          '/home/debug-tools': 'testing',
          '/home/billing': 'billing'
        }
        activeModule.value = moduleMap[newPath] || 'service-overview'
      },
      { immediate: true }
    )

    const allModules = ref([
      {
        key: 'service-overview',
        label: 'Dashboards',
        icon: markRaw(GridOutline),
        route: '/home/service-overview'
      },
      {
        key: 'performance',
        label: 'Infrastructure',
        icon: markRaw(ServerOutline),
        route: '/home/real-time-monitor'
      },
      {
        key: 'tracing',
        label: 'APM',
        icon: markRaw(GitNetworkOutline),
        route: '/home/tracing'
      },
      {
        key: 'log',
        label: 'Logs',
        icon: markRaw(DocumentTextOutline),
        route: '/home/log-center'
      },
      {
        key: 'alert',
        label: 'Monitors',
        icon: markRaw(NotificationsOutline),
        route: '/home/alert-list'
      },
      {
        key: 'config',
        label: 'Config',
        icon: markRaw(SettingsOutline),
        route: '/home/config-center'
      },
      {
        key: 'registry',
        label: 'Registry',
        icon: markRaw(GitBranchOutline),
        route: '/home/registry-view'
      },
      {
        key: 'testing',
        label: 'Synthetics',
        icon: markRaw(ConstructOutline),
        route: '/home/api-testing'
      },
      {
        key: 'user',
        label: 'Organization',
        icon: markRaw(PeopleOutline),
        route: '/home/user-management'
      },
      {
        key: 'system',
        label: 'Integrations',
        icon: markRaw(CogOutline),
        route: '/home/data-source'
      },
      {
        key: 'audit',
        label: 'Audit Trail',
        icon: markRaw(DocumentTextOutline),
        route: '/home/audit-logs'
      },
      {
        key: 'billing',
        label: 'Billing',
        icon: markRaw(WalletOutline),
        route: '/home/billing'
      }
    ])

    const visibleModules = computed(() => allModules.value.slice(0, maxVisibleItems))
    const moreModules = computed(() => allModules.value.slice(maxVisibleItems))

    const handleModuleSelect = (module: any) => {
      activeModule.value = module.key
      router.push(module.route)
    }

    const onDragEnd = (evt: any) => {
      console.log('模块排序已更新:', allModules.value)
    }

    const renderModuleItem = (module: any, isInMore = false) => {
      const isActive = activeModule.value === module.key
      const itemContent = (
        <div
          class={[
            'module-item',
            'flex items-center justify-center',
            'w-40px h-40px rounded-md cursor-pointer transition-all duration-200',
            'hover:bg-[var(--color-fill-3)] hover:text-[var(--color-text-1)]',
            isActive ? 'bg-[var(--color-primary-6)] text-white' : 'text-[var(--color-text-3)]',
            isInMore ? 'mb-2' : ''
          ]}
          onClick={() => handleModuleSelect(module)}>
          <NIcon size={22}>{h(module.icon)}</NIcon>
        </div>
      )

      if (isInMore) return itemContent

      return (
        <NTooltip placement="right" trigger="hover">
          {{
            trigger: () => <div key={module.key}>{itemContent}</div>,
            default: () => module.label
          }}
        </NTooltip>
      )
    }

    return () => (
      <div class="app-home__left w-56px h-full bg-[#1e1e1e] flex flex-col items-center py-4 border-r border-[#333]">
        <div class="flex-1 w-full flex flex-col items-center gap-2">
          <VueDraggable
            modelValue={allModules.value}
            onEnd={onDragEnd}
            animation={200}
            ghostClass="ghost-item"
            chosenClass="chosen-item"
            class="flex flex-col gap-2">
            {visibleModules.value.map((module) => renderModuleItem(module))}
          </VueDraggable>
        </div>

        {moreModules.value.length > 0 && (
          <div class="mt-2">
            <NPopover
              trigger="hover"
              placement="right"
              style={{ padding: '8px', backgroundColor: 'var(--color-bg-5)' }}>
              {{
                trigger: () => (
                  <div class="flex items-center justify-center w-40px h-40px rounded-md cursor-pointer transition-all duration-200 hover:bg-[--color-fill-3] text-[--color-text-3] hover:text-[--color-text-1]">
                    <NIcon size={22}>
                      <EllipsisHorizontalOutline />
                    </NIcon>
                  </div>
                ),
                default: () => (
                  <div class="grid grid-cols-1 gap-2">
                    {moreModules.value.map((module) => renderModuleItem(module, true))}
                  </div>
                )
              }}
            </NPopover>
          </div>
        )}
      </div>
    )
  }
})
