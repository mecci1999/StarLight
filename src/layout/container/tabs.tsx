import {
  CogOutline,
  ConstructOutline,
  DocumentTextOutline,
  EyeOutline,
  FlaskOutline,
  GitBranchOutline,
  GitNetworkOutline,
  GridOutline,
  LinkOutline,
  ListOutline,
  NotificationsOutline,
  PeopleOutline,
  ServerOutline,
  SettingsOutline,
  ShieldCheckmarkOutline,
  SpeedometerOutline,
  StatsChartOutline
} from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { computed, defineComponent, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import './tabs.scss'

export default defineComponent({
  name: 'ContainerTabs',
  setup() {
    const router = useRouter()
    const route = useRoute()

    const activeTab = ref('')
    const tabsContainer = ref<HTMLElement>()
    const draggedTab = ref<HTMLElement | null>(null)
    const draggedIndex = ref(-1)
    const dropIndex = ref(-1)
    const isDragging = ref(false)
    const tabOrder = ref<string[]>([])

    // 二级菜单配置
    const subMenuConfig = {
      'service-overview': [
        {
          key: 'service-topology',
          label: '服务拓扑图',
          icon: GitNetworkOutline,
          route: '/home/service-topology'
        },
        {
          key: 'service-list',
          label: '服务列表',
          icon: ListOutline,
          route: '/home/service-list'
        },
        {
          key: 'instance-monitor',
          label: '实例监控',
          icon: EyeOutline,
          route: '/home/instance-monitor'
        }
      ],
      performance: [
        {
          key: 'real-time-monitor',
          label: '实时监控',
          icon: StatsChartOutline,
          route: '/home/real-time-monitor'
        },
        {
          key: 'metrics-analysis',
          label: '指标分析',
          icon: SpeedometerOutline,
          route: '/home/metrics-analysis'
        },
        {
          key: 'custom-dashboard',
          label: '自定义看板',
          icon: GridOutline,
          route: '/home/custom-dashboard'
        }
      ],
      alert: [
        {
          key: 'alert-list',
          label: '告警列表',
          icon: NotificationsOutline,
          route: '/home/alert-list'
        },
        {
          key: 'alert-rules',
          label: '告警规则',
          icon: SettingsOutline,
          route: '/home/alert-rules'
        },
        {
          key: 'notification-history',
          label: '通知历史',
          icon: DocumentTextOutline,
          route: '/home/notification-history'
        }
      ],
      log: [
        {
          key: 'service-logs',
          label: '服务日志',
          icon: DocumentTextOutline,
          route: '/home/service-logs'
        },
        {
          key: 'exception-analysis',
          label: '异常分析',
          icon: ShieldCheckmarkOutline,
          route: '/home/exception-analysis'
        }
      ],
      tracing: [
        {
          key: 'tracing',
          label: '链路追踪',
          icon: GitBranchOutline,
          route: '/home/tracing'
        },
        {
          key: 'slow-analysis',
          label: '慢调用分析',
          icon: SpeedometerOutline,
          route: '/home/slow-analysis'
        }
      ],
      config: [
        {
          key: 'config-center',
          label: '配置中心',
          icon: CogOutline,
          route: '/home/config-center'
        },
        {
          key: 'config-list',
          label: '配置列表',
          icon: ListOutline,
          route: '/home/config-list'
        },
        {
          key: 'config-history',
          label: '变更历史',
          icon: DocumentTextOutline,
          route: '/home/config-history'
        }
      ],
      registry: [
        {
          key: 'registry-view',
          label: '注册中心',
          icon: ServerOutline,
          route: '/home/registry-view'
        },
        {
          key: 'service-registry',
          label: '服务注册',
          icon: LinkOutline,
          route: '/home/service-registry'
        }
      ],
      user: [
        {
          key: 'user-management',
          label: '用户管理',
          icon: PeopleOutline,
          route: '/home/user-management'
        },
        {
          key: 'team-collaboration',
          label: '团队协作',
          icon: PeopleOutline,
          route: '/home/team-collaboration'
        },
        {
          key: 'role-management',
          label: '角色管理',
          icon: ShieldCheckmarkOutline,
          route: '/home/role-management'
        }
      ],
      system: [
        {
          key: 'data-source',
          label: '数据源配置',
          icon: SettingsOutline,
          route: '/home/data-source'
        },
        {
          key: 'plugin-management',
          label: '插件管理',
          icon: ConstructOutline,
          route: '/home/plugin-management'
        },
        {
          key: 'system-settings',
          label: '系统设置',
          icon: CogOutline,
          route: '/home/system-settings'
        }
      ],
      audit: [
        {
          key: 'audit-logs',
          label: '操作审计',
          icon: DocumentTextOutline,
          route: '/home/audit-logs'
        },
        {
          key: 'system-events',
          label: '系统事件',
          icon: NotificationsOutline,
          route: '/home/system-events'
        }
      ],
      testing: [
        {
          key: 'api-testing',
          label: 'API测试',
          icon: FlaskOutline,
          route: '/home/api-testing'
        },
        {
          key: 'mock-service',
          label: 'Mock服务',
          icon: ServerOutline,
          route: '/home/mock-service'
        },
        {
          key: 'debug-tools',
          label: '调试工具',
          icon: ConstructOutline,
          route: '/home/debug-tools'
        }
      ]
    }

    // 获取当前激活的主模块
    const currentModule = computed(() => {
      const path = route.path
      const moduleMap: Record<string, string> = {
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
      return moduleMap[path] || 'service-overview'
    })

    // 当前模块的子菜单
    const currentSubMenus = computed(() => {
      const menus = subMenuConfig[currentModule.value as keyof typeof subMenuConfig] || []
      // 根据tabOrder排序菜单
      if (tabOrder.value.length > 0) {
        return tabOrder.value.map((key) => menus.find((menu) => menu.key === key)).filter(Boolean) as typeof menus
      }
      return menus
    })

    // 初始化tab顺序
    watch(
      () => subMenuConfig[currentModule.value as keyof typeof subMenuConfig],
      (newMenus) => {
        if (newMenus && tabOrder.value.length === 0) {
          tabOrder.value = newMenus.map((menu) => menu.key)
        }
      },
      { immediate: true }
    )

    // 监听路由变化更新激活的页签
    watch(
      () => route.path,
      (newPath) => {
        const pathToKey: Record<string, string> = {
          '/home/service-topology': 'service-topology',
          '/home/service-list': 'service-list',
          '/home/instance-monitor': 'instance-monitor',
          '/home/real-time-monitor': 'real-time-monitor',
          '/home/metrics-analysis': 'metrics-analysis',
          '/home/custom-dashboard': 'custom-dashboard',
          '/home/alert-list': 'alert-list',
          '/home/alert-rules': 'alert-rules',
          '/home/notification-history': 'notification-history',
          '/home/service-logs': 'service-logs',
          '/home/exception-analysis': 'exception-analysis',
          '/home/tracing': 'tracing',
          '/home/slow-analysis': 'slow-analysis',
          '/home/config-center': 'config-center',
          '/home/config-list': 'config-list',
          '/home/config-history': 'config-history',
          '/home/registry-view': 'registry-view',
          '/home/service-registry': 'service-registry',
          '/home/user-management': 'user-management',
          '/home/team-collaboration': 'team-collaboration',
          '/home/role-management': 'role-management',
          '/home/data-source': 'data-source',
          '/home/plugin-management': 'plugin-management',
          '/home/system-settings': 'system-settings',
          '/home/audit-logs': 'audit-logs',
          '/home/system-events': 'system-events',
          '/home/api-testing': 'api-testing',
          '/home/mock-service': 'mock-service',
          '/home/debug-tools': 'debug-tools'
        }
        activeTab.value = pathToKey[newPath] || ''
      },
      { immediate: true }
    )

    // 处理页签切换
    const handleTabChange = (tabKey: string) => {
      const targetMenu = currentSubMenus.value.find((menu) => menu.key === tabKey)
      if (targetMenu) {
        router.push(targetMenu.route)
      }
    }

    // 计算每个tab的宽度
    const calculateTabWidth = () => {
      if (!tabsContainer.value) return

      const containerWidth = tabsContainer.value.offsetWidth - 20 // 减去padding
      const tabCount = currentSubMenus.value.length
      const minWidth = 80 // 最小宽度
      const maxWidth = 200 // 最大宽度

      let tabWidth = Math.floor(containerWidth / tabCount)
      tabWidth = Math.max(minWidth, Math.min(maxWidth, tabWidth))

      const tabs = tabsContainer.value.querySelectorAll('.custom-tab')
      tabs.forEach((tab: Element) => {
        ;(tab as HTMLElement).style.width = `${tabWidth}px`
      })
    }

    // 拖拽相关方法
    const handleDragStart = (e: DragEvent, index: number) => {
      if (!e.dataTransfer) return

      draggedTab.value = e.target as HTMLElement
      draggedIndex.value = index
      isDragging.value = true

      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/html', '')

      // 添加拖拽样式
      draggedTab.value.classList.add('dragging')
    }

    const handleDragOver = (e: DragEvent, index: number) => {
      e.preventDefault()
      if (!e.dataTransfer) return

      e.dataTransfer.dropEffect = 'move'
      dropIndex.value = index

      // 添加拖拽悬停效果
      const tabs = tabsContainer.value?.querySelectorAll('.custom-tab')
      tabs?.forEach((tab, i) => {
        if (i === index && i !== draggedIndex.value) {
          tab.classList.add('drag-over')
        } else {
          tab.classList.remove('drag-over')
        }
      })
    }

    const handleDragLeave = (e: DragEvent) => {
      const target = e.target as HTMLElement
      target.classList.remove('drag-over')
    }

    const handleDrop = (e: DragEvent, index: number) => {
      e.preventDefault()

      if (draggedIndex.value === -1 || draggedIndex.value === index) return

      // 重新排列tab顺序
      const newOrder = [...tabOrder.value]
      const draggedKey = newOrder[draggedIndex.value]
      newOrder.splice(draggedIndex.value, 1)
      newOrder.splice(index, 0, draggedKey)

      tabOrder.value = newOrder

      // 清理拖拽状态
      cleanupDrag()
    }

    const handleDragEnd = () => {
      cleanupDrag()
    }

    const cleanupDrag = () => {
      isDragging.value = false
      draggedTab.value = null
      draggedIndex.value = -1
      dropIndex.value = -1

      // 清理所有拖拽样式
      const tabs = tabsContainer.value?.querySelectorAll('.custom-tab')
      tabs?.forEach((tab) => {
        tab.classList.remove('dragging', 'drag-over')
      })
    }

    // 监听窗口大小变化
    onMounted(() => {
      nextTick(() => {
        calculateTabWidth()
      })

      window.addEventListener('resize', calculateTabWidth)
    })

    // 监听子菜单变化重新计算宽度
    watch(
      () => currentSubMenus.value.length,
      () => {
        nextTick(() => {
          calculateTabWidth()
        })
      }
    )

    return () => {
      // 如果当前模块没有子菜单，则不显示页签
      if (currentSubMenus.value.length === 0) {
        return null
      }

      return (
        <div class="container-tabs">
          <div class="custom-tabs" ref={tabsContainer}>
            {currentSubMenus.value.map((menu, index) => (
              <div
                key={menu.key}
                class={[
                  'custom-tab',
                  { active: activeTab.value === menu.key },
                  { dragging: isDragging.value && draggedIndex.value === index }
                ]}
                draggable="true"
                onDragstart={(e: DragEvent) => handleDragStart(e, index)}
                onDragover={(e: DragEvent) => handleDragOver(e, index)}
                onDragleave={handleDragLeave}
                onDrop={(e: DragEvent) => handleDrop(e, index)}
                onDragend={handleDragEnd}
                onClick={() => handleTabChange(menu.key)}>
                <div class="tab-content">
                  <div class="tab-icon">
                    <NIcon size={14}>{h(menu.icon)}</NIcon>
                  </div>
                  <span class="tab-label">{menu.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  }
})
