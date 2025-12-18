import dayjs from 'dayjs'
import type {
  ServiceItem,
  ServiceInstance,
  MetricsBundle,
  AlertItem,
  AlertRuleItem,
  TopologyData,
  LogItem,
  LogVolume,
  TraceSpan
} from '@/types/monitor'

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

const servicesPool: ServiceItem[] = [
  {
    id: 'svc-gateway',
    name: 'api-gateway',
    status: 'running',
    version: 'v2.0.1',
    instances: 4,
    health: 'healthy',
    lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: 'svc-auth',
    name: 'auth-service',
    status: 'running',
    version: 'v1.8.4',
    instances: 2,
    health: 'healthy',
    lastUpdate: dayjs().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: 'svc-user',
    name: 'user-service',
    status: 'running',
    version: 'v1.2.3',
    instances: 3,
    health: 'healthy',
    lastUpdate: dayjs().subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: 'svc-order',
    name: 'order-service',
    status: 'running',
    version: 'v2.1.0',
    instances: 2,
    health: 'healthy',
    lastUpdate: dayjs().subtract(8, 'minute').format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: 'svc-payment',
    name: 'payment-service',
    status: 'error',
    version: 'v1.5.2',
    instances: 1,
    health: 'unhealthy',
    lastUpdate: dayjs().subtract(12, 'minute').format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: 'svc-product',
    name: 'product-service',
    status: 'running',
    version: 'v1.1.0',
    instances: 2,
    health: 'healthy',
    lastUpdate: dayjs().subtract(15, 'minute').format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: 'svc-inventory',
    name: 'inventory-service',
    status: 'running',
    version: 'v1.0.9',
    instances: 1,
    health: 'warning',
    lastUpdate: dayjs().subtract(2, 'minute').format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: 'svc-notify',
    name: 'notify-service',
    status: 'stopped',
    version: 'v1.0.0',
    instances: 0,
    health: 'unknown',
    lastUpdate: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss')
  }
]

export async function fetchServices(params?: {
  page?: number
  pageSize?: number
  status?: 'running' | 'stopped' | 'error' | 'all'
  keyword?: string
}): Promise<{ services: ServiceItem[]; total: number; page: number }> {
  await new Promise((r) => setTimeout(r, 300))
  let list = [...servicesPool]
  if (params?.status && params.status !== 'all') {
    list = list.filter((s) => s.status === params.status)
  }
  if (params?.keyword) {
    list = list.filter((s) => s.name.includes(params.keyword as string))
  }
  return { services: list, total: list.length, page: params?.page || 1 }
}

export async function fetchServiceInstances(serviceName: string): Promise<ServiceInstance[]> {
  await new Promise((r) => setTimeout(r, 300))
  const idPrefix = serviceName.replace(/\W/g, '')
  return Array.from({ length: pick([1, 2, 3, 4]) }).map((_, i) => ({
    id: `${idPrefix}-${String(i + 1).padStart(3, '0')}`,
    serviceId: serviceName,
    node: `node-${String(i + 1).padStart(2, '0')}`,
    status: pick(['running', 'running', 'error']),
    cpu: rand(5, 95),
    memory: rand(10, 92),
    startTime: dayjs().subtract(rand(1, 24), 'hour').format('YYYY-MM-DD HH:mm:ss')
  }))
}

export async function fetchRealtimeMetrics(serviceId?: string): Promise<{
  cpu: number
  memory: number
  qps: number
  responseTime: number
  errorRate: number
  activeConnections: number
  systemLoad: number
  activeInstances: number
  healthDistribution: { name: string; value: number }[]
  trafficDistribution: { name: string; value: number }[]
}> {
  await new Promise((r) => setTimeout(r, 200))
  return {
    cpu: rand(1, 98),
    memory: rand(1, 98),
    qps: rand(500, 2500),
    responseTime: rand(50, 220),
    errorRate: Math.random() * 2,
    activeConnections: rand(200, 800),
    systemLoad: rand(100, 400) / 100,
    activeInstances: rand(10, 20),
    healthDistribution: [
      { name: 'Healthy', value: rand(10, 20) },
      { name: 'Warning', value: rand(0, 5) },
      { name: 'Critical', value: rand(0, 2) }
    ],
    trafficDistribution: [
      { name: 'User', value: rand(800, 1500) },
      { name: 'Order', value: rand(600, 1200) },
      { name: 'Prod', value: rand(500, 1000) },
      { name: 'Pay', value: rand(200, 600) },
      { name: 'Gate', value: rand(2000, 3000) }
    ]
  }
}

export async function fetchMetrics(params: {
  serviceId: string
  metricType?: 'cpu' | 'memory' | 'network' | 'response'
  timeRange?: '1h' | '6h' | '24h' | '7d'
}): Promise<MetricsBundle & { comparison: { name: string; value: number }[] }> {
  await new Promise((r) => setTimeout(r, 300))
  const points = (n: number, scale = 100, base = 0) =>
    Array.from({ length: n }).map((_, i) => ({
      timestamp: Date.now() - (n - 1 - i) * 5 * 60 * 1000,
      value: Math.max(0, base + Math.random() * scale - scale / 2)
    }))
  return {
    cpu: points(50, 40, 50),
    memory: points(50, 20, 60),
    qps: points(50, 500, 1200),
    responseTime: points(50, 100, 80),
    errorRate: points(50, 2, 0.5),
    comparison: [
      { name: 'User Svc', value: rand(40, 90) },
      { name: 'Order Svc', value: rand(40, 90) },
      { name: 'Pay Svc', value: rand(30, 80) },
      { name: 'Inv Svc', value: rand(20, 70) },
      { name: 'Auth Svc', value: rand(10, 60) }
    ]
  }
}

export async function fetchAlerts(params?: {
  level?: 'critical' | 'warning' | 'info'
  status?: 'active' | 'resolved' | 'suppressed'
  serviceId?: string
}): Promise<AlertItem[]> {
  await new Promise((r) => setTimeout(r, 300))
  const base: AlertItem[] = [
    {
      id: 'a-1',
      time: dayjs().subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      service: 'user-service',
      level: 'critical',
      message: 'CPU usage exceeds 90%, current: 95%',
      status: 'active',
      duration: '15m'
    },
    {
      id: 'a-2',
      time: dayjs().subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      service: 'order-service',
      level: 'warning',
      message: 'Memory usage exceeds 80%, current: 85%',
      status: 'active',
      duration: '20m'
    },
    {
      id: 'a-3',
      time: dayjs().subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      service: 'payment-service',
      level: 'critical',
      message: 'Response time > 5s, current: 8.5s',
      status: 'resolved',
      duration: '10m'
    },
    {
      id: 'a-4',
      time: dayjs().subtract(40, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      service: 'user-service',
      level: 'warning',
      message: 'QPS drop detected, current: 50/s',
      status: 'suppressed',
      duration: '5m'
    },
    {
      id: 'a-5',
      time: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      service: 'inventory-service',
      level: 'info',
      message: 'Service restarted',
      status: 'resolved',
      duration: '1m'
    }
  ]
  return base.filter(
    (i) => (!params?.level || i.level === params.level) && (!params?.status || i.status === params.status)
  )
}

export async function fetchAlertRules(): Promise<AlertRuleItem[]> {
  await new Promise((r) => setTimeout(r, 200))
  return [
    {
      id: 'r-1',
      name: 'High CPU Usage',
      service: 'user-service',
      metric: 'CPU Usage',
      operator: '>',
      threshold: 80,
      unit: '%',
      duration: 5,
      level: 'warning',
      enabled: true,
      channels: ['Email', 'Slack']
    },
    {
      id: 'r-2',
      name: 'Critical Memory Usage',
      service: 'order-service',
      metric: 'Memory Usage',
      operator: '>',
      threshold: 90,
      unit: '%',
      duration: 3,
      level: 'critical',
      enabled: true,
      channels: ['Email', 'Webhook', 'SMS']
    }
  ]
}

export async function saveAlertRule(
  rule: Omit<AlertRuleItem, 'id' | 'channels'> & { channels?: string[] }
): Promise<AlertRuleItem> {
  await new Promise((r) => setTimeout(r, 200))
  return { ...rule, id: `r-${Date.now()}`, channels: rule.channels || [] }
}

export async function updateAlertRule(rule: AlertRuleItem): Promise<AlertRuleItem> {
  await new Promise((r) => setTimeout(r, 200))
  return rule
}

export async function deleteAlertRule(id: string): Promise<{ success: boolean }> {
  await new Promise((r) => setTimeout(r, 200))
  return { success: true }
}

export async function fetchTopology(): Promise<TopologyData> {
  await new Promise((r) => setTimeout(r, 300))
  return {
    nodes: [
      { id: 'svc-gateway', name: 'api-gateway', status: 'running' },
      { id: 'svc-auth', name: 'auth-service', status: 'running' },
      { id: 'svc-user', name: 'user-service', status: 'running' },
      { id: 'svc-order', name: 'order-service', status: 'running' },
      { id: 'svc-product', name: 'product-service', status: 'running' },
      { id: 'svc-inventory', name: 'inventory-service', status: 'warning' },
      { id: 'svc-payment', name: 'payment-service', status: 'error' },
      { id: 'svc-notify', name: 'notify-service', status: 'stopped' },
      { id: 'db-user', name: 'user-db', status: 'running' },
      { id: 'db-order', name: 'order-db', status: 'running' },
      { id: 'redis-cache', name: 'redis-cache', status: 'running' }
    ],
    edges: [
      { from: 'svc-gateway', to: 'svc-auth' },
      { from: 'svc-gateway', to: 'svc-user' },
      { from: 'svc-gateway', to: 'svc-order' },
      { from: 'svc-gateway', to: 'svc-product' },
      { from: 'svc-user', to: 'db-user' },
      { from: 'svc-order', to: 'svc-user' },
      { from: 'svc-order', to: 'svc-product' },
      { from: 'svc-order', to: 'svc-inventory' },
      { from: 'svc-order', to: 'svc-payment' },
      { from: 'svc-order', to: 'db-order' },
      { from: 'svc-product', to: 'svc-inventory' },
      { from: 'svc-product', to: 'redis-cache' },
      { from: 'svc-user', to: 'svc-notify' },
      { from: 'svc-order', to: 'svc-notify' },
      { from: 'svc-payment', to: 'svc-notify' }
    ]
  }
}

export async function fetchLogs(params: {
  service?: string
  level?: string
  search?: string
  startTime?: number
  endTime?: number
}): Promise<{ logs: LogItem[]; volume: LogVolume[] }> {
  await new Promise((r) => setTimeout(r, 300))

  const levels = ['info', 'info', 'info', 'warn', 'error', 'debug']
  const services = ['user-service', 'order-service', 'payment-service', 'gateway', 'auth-service']
  const messages = [
    'Request processed successfully',
    'Database connection timeout',
    'Invalid input parameter',
    'User authentication failed',
    'Payment transaction completed',
    'Cache miss for key: user_123',
    'External API call failed: 503 Service Unavailable'
  ]

  const logs: LogItem[] = Array.from({ length: 50 }).map((_, i) => ({
    key: `log-${i}`,
    timestamp: dayjs()
      .subtract(i * 10, 'second')
      .format('YYYY-MM-DD HH:mm:ss.SSS'),
    service: pick(services),
    level: pick(levels) as any,
    message: pick(messages),
    thread: `http-nio-8080-exec-${rand(1, 10)}`,
    logger: 'com.starlight.service.internal',
    stackTrace: Math.random() > 0.8 ? 'java.lang.NullPointerException\n\tat com.starlight...' : undefined
  }))

  const volume: LogVolume[] = Array.from({ length: 24 })
    .map((_, i) => ({
      timestamp: dayjs().subtract(i, 'hour').valueOf(),
      count: rand(100, 5000),
      level: pick(['info', 'error', 'warn']) as any
    }))
    .reverse()

  return { logs, volume }
}

export async function fetchTraces(): Promise<TraceSpan[]> {
  await new Promise((r) => setTimeout(r, 400))
  const traceId = `trace-${Date.now()}`
  return [
    {
      id: 'span-1',
      traceId,
      name: 'HTTP GET /api/orders/123',
      service: 'gateway',
      startTime: 0,
      duration: 350,
      status: 'ok',
      tags: { 'http.method': 'GET', 'http.status_code': '200' }
    },
    {
      id: 'span-2',
      traceId,
      parentId: 'span-1',
      name: 'authenticate_user',
      service: 'auth-service',
      startTime: 10,
      duration: 50,
      status: 'ok',
      tags: { 'user.id': 'u-123' }
    },
    {
      id: 'span-3',
      traceId,
      parentId: 'span-1',
      name: 'get_order_details',
      service: 'order-service',
      startTime: 70,
      duration: 200,
      status: 'ok',
      tags: { 'order.id': 'o-123' }
    },
    {
      id: 'span-4',
      traceId,
      parentId: 'span-3',
      name: 'query_db',
      service: 'order-db',
      startTime: 90,
      duration: 100,
      status: 'ok',
      tags: { 'db.statement': 'SELECT * FROM orders...' }
    },
    {
      id: 'span-5',
      traceId,
      parentId: 'span-3',
      name: 'check_inventory',
      service: 'inventory-service',
      startTime: 200,
      duration: 50,
      status: 'ok',
      tags: { 'item.id': 'i-999' }
    }
  ]
}
