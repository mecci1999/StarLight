import { NIcon, NPopover, NButton } from 'naive-ui'
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
  EllipsisHorizontalOutline
} from '@vicons/ionicons5'
import { VueDraggable } from 'vue-draggable-plus'
import { markRaw } from 'vue'
import './index.scss'

export default defineComponent({
  name: 'HomeLeft',
  setup(props, { slots }) {
    const router = useRouter()
    const route = useRoute()

    const activeModule = ref('service-overview')
    const maxVisibleItems = 8 // 最多显示8个主模块

    // 监听路由变化更新激活状态
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
          '/home/debug-tools': 'testing'
        }
        activeModule.value = moduleMap[newPath] || 'service-overview'
      },
      { immediate: true }
    )

    // 主模块配置
    const allModules = ref([
      {
        key: 'service-overview',
        label: '服务总览',
        icon: markRaw(ServerOutline),
        route: '/home/service-overview'
      },
      {
        key: 'performance',
        label: '性能监控',
        icon: markRaw(StatsChartOutline),
        route: '/home/real-time-monitor'
      },
      {
        key: 'alert',
        label: '告警管理',
        icon: markRaw(NotificationsOutline),
        route: '/home/alert-list'
      },
      {
        key: 'log',
        label: '日志中心',
        icon: markRaw(DocumentTextOutline),
        route: '/home/service-logs'
      },
      {
        key: 'tracing',
        label: '调用链追踪',
        icon: markRaw(GitBranchOutline),
        route: '/home/tracing'
      },
      {
        key: 'config',
        label: '配置管理',
        icon: markRaw(SettingsOutline),
        route: '/home/config-center'
      },
      {
        key: 'registry',
        label: '服务注册',
        icon: markRaw(GitNetworkOutline),
        route: '/home/registry-view'
      },
      {
        key: 'user',
        label: '用户权限',
        icon: markRaw(PeopleOutline),
        route: '/home/user-management'
      },
      {
        key: 'system',
        label: '系统设置',
        icon: markRaw(SettingsOutline),
        route: '/home/data-source'
      },
      {
        key: 'audit',
        label: '审计事件',
        icon: markRaw(DocumentTextOutline),
        route: '/home/audit-logs'
      },
      {
        key: 'testing',
        label: '测试调试',
        icon: markRaw(ConstructOutline),
        route: '/home/api-testing'
      }
    ])

    // 可见的模块和更多模块
    const visibleModules = computed(() => allModules.value.slice(0, maxVisibleItems))
    const moreModules = computed(() => allModules.value.slice(maxVisibleItems))

    // 处理模块选择
    const handleModuleSelect = (module: any) => {
      activeModule.value = module.key
      router.push(module.route)
    }

    // 拖拽排序处理
    const onDragEnd = (evt: any) => {
      // 这里可以保存用户的排序偏好到本地存储或服务器
      console.log('模块排序已更新:', allModules.value)
    }

    // 渲染模块项
    const renderModuleItem = (module: any, isInMore = false) => {
      const isActive = activeModule.value === module.key
      return (
        <div
          key={module.key}
          class={[
            'module-item',
            'flex flex-col items-center justify-center',
            'w-64px h-64px rounded-8px cursor-pointer transition-all duration-200',
            'hover:bg-[--color-bg-5]  hover:text-[--color-primary-5]',
            isActive ? 'bg-[--color-bg-5] text-[--color-primary-6]' : 'text-[--color-text-2]',
            isInMore ? 'mb-8px' : ''
          ]}
          onClick={() => handleModuleSelect(module)}>
          <NIcon size={20} class="mb-4px">
            {h(module.icon)}
          </NIcon>
          <span class="text-10px font-medium leading-none">{module.label}</span>
        </div>
      )
    }

    return () => (
      <div class="app-home__left w-80px h-full bg-[--color-fill-2] flex flex-col">
        {/* 主模块区域 */}
        <div class="flex-1 p-8px pt-40px">
          <VueDraggable
            modelValue={allModules.value}
            onEnd={onDragEnd}
            animation={200}
            ghostClass="ghost-item"
            chosenClass="chosen-item">
            <div class="grid grid-cols-1 gap-8px">{visibleModules.value.map((module) => renderModuleItem(module))}</div>
          </VueDraggable>
        </div>

        {/* 更多模块 */}
        {moreModules.value.length > 0 && (
          <div class="p-8px">
            <NPopover trigger="hover" placement="right">
              {{
                trigger: () => (
                  <div class="flex flex-col items-center justify-center w-64px h-64px rounded-8px cursor-pointer transition-all duration-200 hover:bg-[--color-bg-5] text-[--color-text-2] hover:text-[--color-primary-5]">
                    <NIcon size={20} class="mb-4px">
                      {h(EllipsisHorizontalOutline)}
                    </NIcon>
                    <span class="text-10px font-medium leading-none">更多</span>
                  </div>
                ),
                default: () => (
                  <div class="p-8px min-w-80px">
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
