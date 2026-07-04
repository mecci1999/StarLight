import type { Component } from 'vue'
import { markRaw } from 'vue'
import {
  AlertCircleOutline,
  AnalyticsOutline,
  BugOutline,
  ChatboxEllipsesOutline,
  CloudUploadOutline,
  CubeOutline,
  DocumentTextOutline,
  FileTrayFullOutline,
  GitBranchOutline,
  GitNetworkOutline,
  GridOutline,
  LayersOutline,
  RocketOutline,
  NotificationsOutline,
  PulseOutline,
  ReceiptOutline,
  SparklesOutline,
  StatsChartOutline
} from '@vicons/ionicons5'

export type HomeRouteGroup = 'overview' | 'service' | 'monitor' | 'investigate' | 'alerts' | 'admin'
export type HomeRouteVisibility = 'sidebar' | 'hidden'

export interface HomeRouteMeta {
  [key: string]: unknown
  [key: symbol]: unknown
  title: string
  group: HomeRouteGroup
  icon?: Component
  order: number
  visibility: HomeRouteVisibility
  sidebarKey?: string
}

export interface HomeSidebarModule {
  key: string
  label: string
  group: HomeRouteGroup
  icon?: Component
  route: string
  order: number
  visibility: HomeRouteVisibility
  aliases?: string[]
}

const icons = {
  alerts: markRaw(NotificationsOutline),
  alertRules: markRaw(AlertCircleOutline),
  alertNotifications: markRaw(ChatboxEllipsesOutline),
  analytics: markRaw(AnalyticsOutline),
  exception: markRaw(BugOutline),
  ingestion: markRaw(CloudUploadOutline),
  instances: markRaw(CubeOutline),
  logs: markRaw(DocumentTextOutline),
  metricCatalog: markRaw(FileTrayFullOutline),
  media: markRaw(SparklesOutline),
  metrics: markRaw(StatsChartOutline),
  microApps: markRaw(RocketOutline),
  overview: markRaw(GridOutline),
  realtime: markRaw(PulseOutline),
  receipt: markRaw(ReceiptOutline),
  serviceList: markRaw(LayersOutline),
  topology: markRaw(GitNetworkOutline),
  trace: markRaw(GitBranchOutline)
} as const

const createSidebarModule = (
  key: string,
  route: string,
  aliases: string[] | undefined,
  meta: HomeRouteMeta
): HomeSidebarModule => ({
  key,
  label: meta.title,
  group: meta.group,
  icon: meta.icon,
  route,
  order: meta.order,
  visibility: meta.visibility,
  aliases
})

export const HOME_SIDEBAR_MODULES: HomeSidebarModule[] = [
  createSidebarModule('service-overview', '/home/overview', ['/home/overview-v2', '/home/service-overview'], {
    title: '看板',
    group: 'overview',
    icon: icons.overview,
    order: 10,
    visibility: 'sidebar',
    sidebarKey: 'service-overview'
  }),
  createSidebarModule('service-topology', '/home/services/topology', ['/home/service-topology'], {
    title: '服务拓扑图',
    group: 'service',
    icon: icons.topology,
    order: 20,
    visibility: 'sidebar',
    sidebarKey: 'service-topology'
  }),
  createSidebarModule('service-list', '/home/services', ['/home/services-v2', '/home/service-list'], {
    title: '服务目录',
    group: 'service',
    icon: icons.serviceList,
    order: 30,
    visibility: 'sidebar',
    sidebarKey: 'service-list'
  }),
  createSidebarModule('instance-monitor', '/home/instance-monitor', undefined, {
    title: '实例监控',
    group: 'service',
    icon: icons.instances,
    order: 40,
    visibility: 'sidebar',
    sidebarKey: 'instance-monitor'
  }),
  createSidebarModule('real-time-monitor', '/home/real-time-monitor', undefined, {
    title: '基础设施概览',
    group: 'monitor',
    icon: icons.realtime,
    order: 50,
    visibility: 'sidebar',
    sidebarKey: 'real-time-monitor'
  }),
  createSidebarModule('metrics-analysis', '/home/investigate/metrics', ['/home/metrics-v2', '/home/metrics-analysis'], {
    title: '指标分析',
    group: 'investigate',
    icon: icons.analytics,
    order: 60,
    visibility: 'sidebar',
    sidebarKey: 'metrics-analysis'
  }),
  createSidebarModule('metrics-catalog', '/home/investigate/metrics/catalog', undefined, {
    title: '指标目录',
    group: 'investigate',
    icon: icons.metricCatalog,
    order: 65,
    visibility: 'sidebar',
    sidebarKey: 'metrics-catalog'
  }),
  createSidebarModule('trace-explorer', '/home/investigate/traces', ['/home/trace-v2', '/home/trace-explorer'], {
    title: '链路追踪',
    group: 'investigate',
    icon: icons.trace,
    order: 80,
    visibility: 'sidebar',
    sidebarKey: 'trace-explorer'
  }),
  createSidebarModule(
    'log-center',
    '/home/investigate/logs',
    ['/home/log-center', '/home/logs-v2', '/home/service-logs'],
    {
      title: '日志中心',
      group: 'investigate',
      icon: icons.logs,
      order: 90,
      visibility: 'sidebar',
      sidebarKey: 'log-center'
    }
  ),
  createSidebarModule('exception-analysis', '/home/exception-analysis', undefined, {
    title: '异常分析',
    group: 'investigate',
    icon: icons.exception,
    order: 110,
    visibility: 'sidebar',
    sidebarKey: 'exception-analysis'
  }),
  createSidebarModule('video-upscale', '/home/video-upscale', undefined, {
    title: '4K 视频增强',
    group: 'monitor',
    icon: icons.media,
    order: 115,
    visibility: 'hidden',
    sidebarKey: 'video-upscale'
  }),
  createSidebarModule('alert-list', '/home/alerts/inbox', ['/home/alert-list', '/home/alerts-v2'], {
    title: '告警列表',
    group: 'alerts',
    icon: icons.alerts,
    order: 120,
    visibility: 'sidebar',
    sidebarKey: 'alert-list'
  }),
  createSidebarModule('alert-rules', '/home/alert-rules', undefined, {
    title: '告警规则',
    group: 'alerts',
    icon: icons.alertRules,
    order: 130,
    visibility: 'sidebar',
    sidebarKey: 'alert-rules'
  }),
  createSidebarModule('alert-notifications', '/home/alert-notifications', undefined, {
    title: '通知历史',
    group: 'alerts',
    icon: icons.alertNotifications,
    order: 135,
    visibility: 'sidebar',
    sidebarKey: 'alert-notifications'
  }),
  createSidebarModule('billing', '/home/admin-billing-v2', ['/home/billing'], {
    title: '计费',
    group: 'admin',
    icon: icons.receipt,
    order: 140,
    visibility: 'sidebar',
    sidebarKey: 'billing'
  }),
  createSidebarModule('admin-ingestion', '/home/admin/ingestion', ['/home/admin-ingestion-v2'], {
    title: '接入管理',
    group: 'admin',
    icon: icons.ingestion,
    order: 150,
    visibility: 'sidebar',
    sidebarKey: 'admin-ingestion'
  }),
  createSidebarModule('micro-apps', '/home/micro-apps', undefined, {
    title: '微应用',
    group: 'admin',
    icon: icons.microApps,
    order: 155,
    visibility: 'sidebar',
    sidebarKey: 'micro-apps'
  })
].sort((a, b) => a.order - b.order)

const routeMeta = (moduleKey: string, overrides: Partial<HomeRouteMeta> = {}): HomeRouteMeta => {
  const module = HOME_SIDEBAR_MODULES.find((item) => item.key === moduleKey)
  if (!module) {
    throw new Error(`Missing sidebar module for key: ${moduleKey}`)
  }
  return {
    title: module.label,
    group: module.group,
    icon: module.icon,
    order: module.order,
    visibility: module.visibility,
    sidebarKey: module.key,
    ...overrides
  }
}

export const HOME_ROUTE_META_BY_NAME: Record<string, HomeRouteMeta> = {
  overview: routeMeta('service-overview'),
  'overview-v2': routeMeta('service-overview'),
  services: routeMeta('service-list'),
  'services-v2': routeMeta('service-list'),
  'services-topology': routeMeta('service-topology'),
  'service-detail': routeMeta('service-list', { title: '服务详情', visibility: 'hidden' }),
  'service-detail-v2': routeMeta('service-list', { title: '服务详情', visibility: 'hidden' }),
  'alerts-v2': routeMeta('alert-list', { visibility: 'hidden' }),
  'logs-v2': routeMeta('log-center', { visibility: 'hidden' }),
  'admin-billing-v2': routeMeta('billing'),
  'investigate-metrics': routeMeta('metrics-analysis'),
  'metrics-catalog': routeMeta('metrics-catalog'),
  'metrics-v2': routeMeta('metrics-analysis'),
  settings: routeMeta('admin-ingestion', { title: '应用设置', visibility: 'hidden', sidebarKey: 'admin-ingestion' }),
  profile: routeMeta('admin-ingestion', { title: '个人资料', visibility: 'hidden', sidebarKey: 'admin-ingestion' }),
  'admin-ingestion': routeMeta('admin-ingestion'),
  'admin-ingestion-v2': routeMeta('admin-ingestion', { visibility: 'hidden' }),
  'micro-apps': routeMeta('micro-apps'),
  'micro-app-runtime': routeMeta('micro-apps', { title: '微应用运行', visibility: 'hidden' }),
  'admin-onboarding-v2': {
    title: '接入引导',
    group: 'admin',
    icon: icons.ingestion,
    order: 160,
    visibility: 'hidden',
    sidebarKey: 'billing'
  },
  'investigate-traces': routeMeta('trace-explorer'),
  'trace-v2': routeMeta('trace-explorer'),
  'service-overview': routeMeta('service-overview', { visibility: 'hidden' }),
  'service-topology': routeMeta('service-topology'),
  'service-list': routeMeta('service-list', { visibility: 'hidden' }),
  'instance-monitor': routeMeta('instance-monitor'),
  'real-time-monitor': routeMeta('real-time-monitor'),
  'metrics-analysis': routeMeta('metrics-analysis', { visibility: 'hidden' }),
  'custom-dashboard': routeMeta('service-overview', {
    title: '看板',
    visibility: 'hidden',
    sidebarKey: 'service-overview'
  }),
  'alert-list': routeMeta('alert-list'),
  'alerts-inbox-incident': routeMeta('alert-list', { title: '告警收件箱', visibility: 'hidden' }),
  'alerts-inbox': routeMeta('alert-list', { title: '告警收件箱', visibility: 'hidden' }),
  'alert-notifications': routeMeta('alert-notifications'),
  'alert-rules': routeMeta('alert-rules'),
  'video-upscale': routeMeta('video-upscale', { visibility: 'hidden' }),
  'investigate-logs': routeMeta('log-center'),
  'log-center': routeMeta('log-center'),
  'service-logs': routeMeta('log-center', { title: '服务日志', visibility: 'hidden' }),
  'exception-analysis': routeMeta('exception-analysis'),
  'trace-explorer': routeMeta('trace-explorer', { visibility: 'hidden' }),
  billing: routeMeta('billing', { visibility: 'hidden' })
}

const sidebarPathLookup = HOME_SIDEBAR_MODULES.reduce<Map<string, HomeSidebarModule>>((result, module) => {
  result.set(module.route, module)
  module.aliases?.forEach((path) => result.set(path, module))
  return result
}, new Map())

export const DEFAULT_HOME_SIDEBAR_KEY = HOME_SIDEBAR_MODULES[0]?.key || 'service-overview'

export const getDefaultHomeSidebarModules = () =>
  HOME_SIDEBAR_MODULES.filter((module) => module.visibility === 'sidebar').map((module) => ({ ...module }))

export const findHomeSidebarModuleByPath = (path: string) => sidebarPathLookup.get(path)

const isHomeRouteMeta = (value: unknown): value is HomeRouteMeta => {
  return value !== null && typeof value === 'object' && 'sidebarKey' in value
}

export const resolveHomeSidebarKey = (path: string, meta?: unknown) => {
  if (isHomeRouteMeta(meta) && typeof meta.sidebarKey === 'string' && meta.sidebarKey.length > 0) {
    return meta.sidebarKey
  }
  return findHomeSidebarModuleByPath(path)?.key || DEFAULT_HOME_SIDEBAR_KEY
}

export const mustGetHomeRouteMeta = (name: string): HomeRouteMeta => {
  const meta = HOME_ROUTE_META_BY_NAME[name]
  if (!meta) {
    throw new Error(`Missing home route meta for route name: ${name}`)
  }
  return meta
}
