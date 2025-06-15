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
import { NIcon, NTabPane, NTabs } from 'naive-ui'
import { computed, defineComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import './tabs.scss'

export default defineComponent({
  name: 'ContainerTabs',
  setup() {
    const router = useRouter()
    const route = useRoute()

    const activeTab = ref('')

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
      return subMenuConfig[currentModule.value as keyof typeof subMenuConfig] || []
    })

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

    // 渲染页签标签
    const renderTabLabel = (menu: any) => {
      return (
        <div class="tab-label">
          <NIcon size={14}>{h(menu.icon)}</NIcon>
          <span>{menu.label}</span>
        </div>
      )
    }

    return () => {
      // 如果当前模块没有子菜单，则不显示页签
      if (currentSubMenus.value.length === 0) {
        return null
      }

      return (
        <div class="container-tabs">
          <NTabs
            value={activeTab.value}
            onUpdateValue={handleTabChange}
            type="line"
            size="medium"
            paneWrapperStyle="display: none;"
            animated>
            {currentSubMenus.value.map((menu) => (
              <NTabPane key={menu.key} name={menu.key} tab={() => renderTabLabel(menu)} />
            ))}
          </NTabs>
        </div>
      )
    }
  }
})
