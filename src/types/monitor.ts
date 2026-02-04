export type ServiceItem = {
  id: string
  name: string
  status: 'running' | 'stopped' | 'error'
  version: string
  instances: number
  health: 'healthy' | 'unhealthy' | 'warning' | 'unknown'
  lastUpdate: string
}

export type ServiceInstance = {
  id: string
  serviceId: string
  node: string
  status: 'running' | 'error'
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

export type AlertItem = {
  id: string
  time: string
  service: string
  level: 'critical' | 'warning' | 'info'
  message: string
  status: 'active' | 'resolved' | 'suppressed'
  duration: string
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
  status: 'running' | 'error' | 'stopped' | 'warning'
}

export type TopologyEdge = {
  from: string
  to: string
}

export type TopologyData = {
  nodes: TopologyNode[]
  edges: TopologyEdge[]
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
  sendTime: string
  ruleName: string
  service: string
  channel: string
  recipient: string
  status: 'success' | 'failed' | 'pending'
  retryCount: number
  content: string
  errorMessage?: string
}
