export type ServiceItem = {
  id: string
  name: string
  status: 'running' | 'stopped' | 'error' | 'unknown'
  version: string
  instances: number
  health: 'healthy' | 'unhealthy' | 'warning' | 'unknown'
  lastUpdate: string
  owner?: string
  region?: string
  qps?: number
  latency?: number
  errorRate?: number
  sla?: number
  tags?: string[]
  lastDeploy?: string
  editable?: boolean
}

export type ServiceInstance = {
  id: string
  serviceId: string
  node: string
  status: 'running' | 'error' | 'unknown'
  cpu: number
  memory: number
  startTime: string
}

export type MetricPoint = {
  timestamp: number
  value: number
}

export type MetricsBundle = {
  cpu: MetricPoint[]
  memory: MetricPoint[]
  qps: MetricPoint[]
  responseTime: MetricPoint[]
  errorRate: MetricPoint[]
  comparison?: { name: string; value: number }[]
}

export type SeriesGroup = {
  name: string
  color?: string
  data: MetricPoint[]
}

export type DashboardData = {
  summary: {
    totalServices: number
    totalRequests: number
    activeAlerts: number
    avgResponseTime: number
  }
  summaryCompare?: Record<
    'totalServices' | 'totalRequests' | 'activeAlerts' | 'avgResponseTime',
    Record<
      'day' | 'week' | 'month',
      {
        label: string
        delta: number
        ratio: number
        direction: 'up' | 'down'
        unit: string
      }
    >
  >
  cpuTrend: MetricPoint[]
  memoryTrend: MetricPoint[]
  requestStats: { name: string; value: number }[]
  trafficDistribution: { name: string; value: number }[]
  serviceStatus: Array<{
    id: string
    name: string
    status: string
    health: string
    instances: number
    qps: number
    latency: number
    errorRate: number
  }>
  alerts: AlertItem[]
  updatedAt: string
}

export type RealtimeOverview = {
  summary: {
    cpu: number
    memory: number
    qps: number
    responseTime: number
    errorRate: number
    activeConnections: number
  }
  series: {
    cpu: MetricPoint[]
    memory: MetricPoint[]
    responseTime: MetricPoint[]
  }
  systemStatus: Array<{
    name: string
    status: 'healthy' | 'warning' | 'critical' | 'unknown'
    value: number
    unit: string
  }>
}

export type AdminMetricsSnapshot = {
  requestedAt: number
  services: string[]
  metrics: any[]
  nodes: {
    nodeID: string
    hostname: string
    ipList: string[]
    services: string[]
    metrics: any[]
    error?: string
  }[]
  totals: {
    nodes: number
    metrics: number
  }
}

export type MetricsAnalysisData = {
  series: {
    cpu: SeriesGroup[]
    memory: SeriesGroup[]
    qps: SeriesGroup[]
    responseTime: SeriesGroup[]
  }
  requestStats: { name: string; value: number }[]
  services: { id: string; name: string }[]
}

export type AlertItem = {
  id: string
  time: string
  serviceId?: string
  service: string
  level: 'critical' | 'warning' | 'info'
  message: string
  status: 'active' | 'resolved' | 'suppressed'
  duration: string
  assigneeUserId?: string
  assigneeName?: string
}

export type AlertRuleItem = {
  id: string
  name: string
  service: string
  metric: string
  operator: '>' | '<' | '=' | '>=' | '<='
  threshold: number
  unit?: string
  duration: number
  level: 'critical' | 'warning' | 'info'
  enabled: boolean
  channels: string[]
}

export type TopologyNode = {
  id: string
  name: string
  status: 'running' | 'error' | 'stopped' | 'warning' | 'healthy' | 'critical' | 'idle' | 'unknown'
  type?: string
  layer?: number
  layerName?: string
  app?: string
  cluster?: string
  env?: string
  protocol?: string
  instances?: number | null
  qps?: number | null
  latency?: number | null
  errorRate?: number | null
  source?: string
  manualLayer?: number
  editable?: boolean
  zone?: string
  category?: string
  version?: string | null
}

export type TopologyEdge = {
  from: string
  to: string
  protocol?: string
  callType?: string
  count?: number
  qps?: number
  successRate?: number
  errorRate?: number
  p50?: number
  p99?: number
  status?: string
  inferred?: boolean
  source?: string
  app?: string
  cluster?: string
  env?: string
}

export type TopologyData = {
  nodes: TopologyNode[]
  edges: TopologyEdge[]
  meta?: {
    source?: string
    reason?: string
    updatedAt?: string | number
  }
}

export type LogItem = {
  key: string
  timestamp: string
  service: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  thread: string
  logger: string
  stackTrace?: string
}

export type LogVolume = {
  timestamp: number
  count: number
  level: 'error' | 'warn' | 'info' | 'debug'
}

export type TraceSpan = {
  id: string
  traceId: string
  parentId?: string
  name: string
  service: string
  startTime: number
  duration: number
  status: 'ok' | 'error'
  tags: Record<string, string>
}

export type NotificationItem = {
  key: string
  serviceId?: string
  sendTime: string
  ruleName: string
  service: string
  channel: string
  recipient: string
  status: 'success' | 'failed' | 'pending' | 'unknown'
  retryCount: number | null
  content: string
  errorMessage?: string
}
