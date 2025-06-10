import { NMenu, NIcon, NScrollbar } from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import {
  ServerOutline,
  GitNetworkOutline,
  ListOutline,
  EyeOutline,
  StatsChartOutline,
  SpeedometerOutline,
  GridOutline,
  NotificationsOutline,
  SettingsOutline,
  DocumentTextOutline,
  GitBranchOutline,
  LinkOutline,
  CogOutline,
  PeopleOutline,
  ShieldCheckmarkOutline,
  ConstructOutline,
  FlaskOutline
} from '@vicons/ionicons5'

export default defineComponent({
  name: 'HomeLeft',
  setup(props, { slots }) {
    const router = useRouter()
    const route = useRoute()

    const activeKey = ref('service-overview')

    // 监听路由变化更新激活状态
    watch(
      () => route.path,
      (newPath) => {
        const pathMap: Record<string, string> = {
          '/home/service-overview': 'service-overview',
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
        activeKey.value = pathMap[newPath] || 'service-overview'
      },
      { immediate: true }
    )

    const menuOptions = [
      {
        label: '📋 服务总览',
        key: 'service-overview-group',
        type: 'group',
        children: [
          {
            label: '服务拓扑图',
            key: 'service-topology',
            icon: () => h(NIcon, null, { default: () => h(GitNetworkOutline) })
          },
          {
            label: '服务列表',
            key: 'service-list',
            icon: () => h(NIcon, null, { default: () => h(ListOutline) })
          },
          {
            label: '实例监控',
            key: 'instance-monitor',
            icon: () => h(NIcon, null, { default: () => h(EyeOutline) })
          }
        ]
      },
      {
        label: '📊 性能监控',
        key: 'performance-group',
        type: 'group',
        children: [
          {
            label: '实时监控',
            key: 'real-time-monitor',
            icon: () => h(NIcon, null, { default: () => h(StatsChartOutline) })
          },
          {
            label: '指标分析',
            key: 'metrics-analysis',
            icon: () => h(NIcon, null, { default: () => h(SpeedometerOutline) })
          },
          {
            label: '自定义看板',
            key: 'custom-dashboard',
            icon: () => h(NIcon, null, { default: () => h(GridOutline) })
          }
        ]
      },
      {
        label: '🚨 告警管理',
        key: 'alert-group',
        type: 'group',
        children: [
          {
            label: '告警列表',
            key: 'alert-list',
            icon: () => h(NIcon, null, { default: () => h(NotificationsOutline) })
          },
          {
            label: '告警规则',
            key: 'alert-rules',
            icon: () => h(NIcon, null, { default: () => h(SettingsOutline) })
          },
          {
            label: '通知历史',
            key: 'notification-history',
            icon: () => h(NIcon, null, { default: () => h(DocumentTextOutline) })
          }
        ]
      },
      {
        label: '📝 日志中心',
        key: 'log-group',
        type: 'group',
        children: [
          {
            label: '服务日志',
            key: 'service-logs',
            icon: () => h(NIcon, null, { default: () => h(DocumentTextOutline) })
          },
          {
            label: '异常分析',
            key: 'exception-analysis',
            icon: () => h(NIcon, null, { default: () => h(ShieldCheckmarkOutline) })
          }
        ]
      },
      {
        label: '🔁 调用链追踪',
        key: 'tracing-group',
        type: 'group',
        children: [
          {
            label: '链路追踪',
            key: 'tracing',
            icon: () => h(NIcon, null, { default: () => h(GitBranchOutline) })
          },
          {
            label: '慢调用分析',
            key: 'slow-analysis',
            icon: () => h(NIcon, null, { default: () => h(SpeedometerOutline) })
          }
        ]
      },
      {
        label: '⚙️ 配置管理',
        key: 'config-group',
        type: 'group',
        children: [
          {
            label: '配置中心',
            key: 'config-center',
            icon: () => h(NIcon, null, { default: () => h(CogOutline) })
          },
          {
            label: '配置列表',
            key: 'config-list',
            icon: () => h(NIcon, null, { default: () => h(ListOutline) })
          },
          {
            label: '变更历史',
            key: 'config-history',
            icon: () => h(NIcon, null, { default: () => h(DocumentTextOutline) })
          }
        ]
      },
      {
        label: '🧱 服务注册',
        key: 'registry-group',
        type: 'group',
        children: [
          {
            label: '注册中心',
            key: 'registry-view',
            icon: () => h(NIcon, null, { default: () => h(ServerOutline) })
          },
          {
            label: '服务注册',
            key: 'service-registry',
            icon: () => h(NIcon, null, { default: () => h(LinkOutline) })
          }
        ]
      },
      {
        label: '👥 用户权限',
        key: 'user-group',
        type: 'group',
        children: [
          {
            label: '用户管理',
            key: 'user-management',
            icon: () => h(NIcon, null, { default: () => h(PeopleOutline) })
          },
          {
            label: '团队协作',
            key: 'team-collaboration',
            icon: () => h(NIcon, null, { default: () => h(PeopleOutline) })
          },
          {
            label: '角色管理',
            key: 'role-management',
            icon: () => h(NIcon, null, { default: () => h(ShieldCheckmarkOutline) })
          }
        ]
      },
      {
        label: '🔧 系统设置',
        key: 'system-group',
        type: 'group',
        children: [
          {
            label: '数据源配置',
            key: 'data-source',
            icon: () => h(NIcon, null, { default: () => h(SettingsOutline) })
          },
          {
            label: '插件管理',
            key: 'plugin-management',
            icon: () => h(NIcon, null, { default: () => h(ConstructOutline) })
          },
          {
            label: '系统设置',
            key: 'system-settings',
            icon: () => h(NIcon, null, { default: () => h(CogOutline) })
          }
        ]
      },
      {
        label: '📂 审计事件',
        key: 'audit-group',
        type: 'group',
        children: [
          {
            label: '操作审计',
            key: 'audit-logs',
            icon: () => h(NIcon, null, { default: () => h(DocumentTextOutline) })
          },
          {
            label: '系统事件',
            key: 'system-events',
            icon: () => h(NIcon, null, { default: () => h(NotificationsOutline) })
          }
        ]
      },
      {
        label: '🧪 测试调试',
        key: 'testing-group',
        type: 'group',
        children: [
          {
            label: 'API测试',
            key: 'api-testing',
            icon: () => h(NIcon, null, { default: () => h(FlaskOutline) })
          },
          {
            label: 'Mock服务',
            key: 'mock-service',
            icon: () => h(NIcon, null, { default: () => h(ServerOutline) })
          },
          {
            label: '调试工具',
            key: 'debug-tools',
            icon: () => h(NIcon, null, { default: () => h(ConstructOutline) })
          }
        ]
      }
    ]

    const handleMenuSelect = (key: string) => {
      activeKey.value = key
      const routeMap: Record<string, string> = {
        'service-overview': '/home/service-overview',
        'service-topology': '/home/service-topology',
        'service-list': '/home/service-list',
        'instance-monitor': '/home/instance-monitor',
        'real-time-monitor': '/home/real-time-monitor',
        'metrics-analysis': '/home/metrics-analysis',
        'custom-dashboard': '/home/custom-dashboard',
        'alert-list': '/home/alert-list',
        'alert-rules': '/home/alert-rules',
        'notification-history': '/home/notification-history',
        'service-logs': '/home/service-logs',
        'exception-analysis': '/home/exception-analysis',
        tracing: '/home/tracing',
        'slow-analysis': '/home/slow-analysis',
        'config-center': '/home/config-center',
        'config-list': '/home/config-list',
        'config-history': '/home/config-history',
        'registry-view': '/home/registry-view',
        'service-registry': '/home/service-registry',
        'user-management': '/home/user-management',
        'team-collaboration': '/home/team-collaboration',
        'role-management': '/home/role-management',
        'data-source': '/home/data-source',
        'plugin-management': '/home/plugin-management',
        'system-settings': '/home/system-settings',
        'audit-logs': '/home/audit-logs',
        'system-events': '/home/system-events',
        'api-testing': '/home/api-testing',
        'mock-service': '/home/mock-service',
        'debug-tools': '/home/debug-tools'
      }

      const targetRoute = routeMap[key]
      if (targetRoute) {
        router.push(targetRoute)
      }
    }

    return () => (
      <div class="w-280px h-full bg-[--color-bg-2] border-r border-[--color-border]">
        <div class="p-16px border-b border-[--color-border]">
          <h2 class="text-16px font-600 text-[--color-text-1] m-0">微服务监控平台</h2>
        </div>
        <NScrollbar class="h-[calc(100%-64px)]">
          <div class="p-8px">
            <NMenu
              value={activeKey.value}
              options={menuOptions}
              onUpdateValue={handleMenuSelect}
              accordion={false}
              collapsedWidth={64}
              collapsedIconSize={20}
              iconSize={18}
              rootIndent={12}
              indent={24}
            />
          </div>
        </NScrollbar>
      </div>
    )
  }
})
