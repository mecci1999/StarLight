/**
 * 请求地址
 */
import { URLEnum, VersionEnum } from '@/types/enums'

// 服务端域名
const { VITE_SERVICE_URL } = import.meta.env

// 地址前缀
const prefix = VITE_SERVICE_URL + '/api'
const authPrefix = `${prefix + URLEnum.AUTH}/${VersionEnum.V1}`
const userPrefix = `${prefix + URLEnum.USER}/${VersionEnum.V1}`
const alertsPrefix = `${prefix}/alerts/${VersionEnum.V1}`
const logsPrefix = `${prefix + URLEnum.LOGS}/${VersionEnum.V1}`
const metricsPrefix = `${prefix + URLEnum.METRICS}/${VersionEnum.V1}`
const metricsV2Prefix = `${prefix + URLEnum.METRICS}/${VersionEnum.V2}`
const subscriptionPrefix = `${prefix + URLEnum.SUBSCRIPTION}/${VersionEnum.V1}`
const adminMetricsPrefix = `${prefix + URLEnum.METRICS}/${VersionEnum.V1}/admin`

export default {
  // 验证模块
  registerUser: `${authPrefix}/register`, // 使用邮箱注册用户
  emailVerifyCode: `${authPrefix}/verifyCode`, // 邮箱验证码
  login: `${authPrefix}/login`, // 邮箱密码登录
  logout: `${authPrefix}/logout`, // 退出登录
  refreshToken: `${authPrefix}/refreshToken`, // 续签
  forgetPassword: `${authPrefix}/forgetHash`, // 忘记密码
  updatePassword: `${authPrefix}/updateHash`, // 更新密码
  getRSAKey: `${authPrefix}/rsa/getKey`, // 获取RSA密钥对
  saveRSAKey: `${authPrefix}/rsa/save`, // 创建和更新RSA密钥对
  getQRCodeKey: `${authPrefix}/qrcode/getKey`, // 获取二维码key
  getQRCodeStatus: `${authPrefix}/qrcode/status`, // 获取二维码状态
  scanQRcode: `${authPrefix}/qrcode/scan`, // 移动端扫描二维码
  confirmQRcode: `${authPrefix}/qrcode/confirm`, // 移动端确认登录
  cancelQRcode: `${authPrefix}/qrcode/cancel`, // 移动端取消登录

  // 用户模块
  getUserInfo: `${userPrefix}/getUserInfo`, // 获取用户信息

  // 日志模块
  logSearch: `${logsPrefix}/search`, // 日志搜索
  logStats: `${logsPrefix}/stats`, // 日志统计
  logConfigTestConnection: `${logsPrefix}/config/testConnection`,
  logExport: `${logsPrefix}/export`, // 日志导出
  logStream: `${logsPrefix}/stream`, // 日志流
  logIngest: `${logsPrefix}/ingest`, // 日志摄取
  logBatchIngest: `${logsPrefix}/batch-ingest`, // 批量日志摄取
  exceptionAnalysis: `${logsPrefix}/exception-analysis`, // 异常分析
  logsExplorerSearch: `${logsPrefix}/explorer/search`,
  logsExplorerStats: `${logsPrefix}/explorer/stats`,
  logsExceptionsList: `${logsPrefix}/exceptions/list`,
  traceSearch: `${logsPrefix}/trace/search`,
  traceDetail: `${logsPrefix}/trace/detail`,

  // 指标模块
  metricsIngest: `${metricsPrefix}/ingest`, // 指标摄取
  metricsQuery: `${metricsPrefix}/query`, // 指标查询
  metricsSchema: `${metricsPrefix}/schema`, // 指标元数据
  metricsV2Schema: `${metricsV2Prefix}/schema`,
  metricsAppKeyList: `${metricsPrefix}/appkey/list`, // AppKey列表
  metricsAppKeyGenerate: `${metricsPrefix}/appkey/generate`, // 生成AppKey
  metricsAppKeyVerify: `${metricsPrefix}/appkey/verify`,
  metricsAppKeyDelete: `${metricsPrefix}/appkey/delete`,
  metricsIngestionStatus: `${metricsPrefix}/appkey/ingestionStatus`,
  metricsStats: `${metricsPrefix}/stats`, // 服务统计
  metricsTopology: `${metricsPrefix}/topology`, // 服务拓扑
  metricsRealtime: `${metricsPrefix}/realtime`,
  metricsDashboard: `${metricsPrefix}/dashboard`,
  metricsLayout: `${metricsPrefix}/layout`, // 仪表盘布局
  metricsAnalysis: `${metricsPrefix}/metrics/analysis`,
  metricsExplorer: `${metricsPrefix}/metrics/explorer`,
  metricsV2QueryCards: `${metricsV2Prefix}/query/cards`,
  metricsV2QueryPreview: `${metricsV2Prefix}/query/preview`,
  metricsV2QueryCompile: `${metricsV2Prefix}/query/compile`,
  metricsV2QueryValidate: `${metricsV2Prefix}/query/validate`,
  metricsAlerts: `${metricsPrefix}/alerts`,
  metricsAlertRules: `${metricsPrefix}/alert-rules`,
  metricsAlertRulesBulkUpdate: `${metricsPrefix}/alert-rules/bulk-update`,
  metricsAlertRulesExport: `${metricsPrefix}/alert-rules/export`,
  metricsAlertRulesImport: `${metricsPrefix}/alert-rules/import`,
  metricsNotifications: `${metricsPrefix}/notifications`,
  metricsAlertAssignees: `${metricsPrefix}/alerts/assignees`,
  acknowledgeAlert: (id: string) => `${alertsPrefix}/incidents/${id}/ack`,
  assignAlert: (id: string) => `${metricsPrefix}/alerts/${id}/assign`,
  resolveAlert: (id: string) => `${metricsPrefix}/alerts/${id}/resolve`,
  suppressAlert: (id: string) => `${metricsPrefix}/alerts/${id}/suppress`,
  updateAlertRule: (id: string) => `${metricsPrefix}/alert-rules/${id}`,
  deleteAlertRule: (id: string) => `${metricsPrefix}/alert-rules/${id}`,
  resendNotification: (id: string) => `${metricsPrefix}/notifications/${id}/resend`,
  adminMetricsQuery: `${adminMetricsPrefix}/query`,
  adminMetricsGraphql: `${adminMetricsPrefix}/graphql`,
  adminMetricsCatalog: `${adminMetricsPrefix}/catalog`,
  metricsOverviewSummary: `${metricsPrefix}/overview/summary`,
  metricsOverviewTrends: `${metricsPrefix}/overview/trends`,
  metricsOverviewRiskServices: `${metricsPrefix}/overview/risk-services`,
  metricsOverviewIngestStatus: `${metricsPrefix}/overview/ingest-status`,
  metricsOverviewIncidents: `${metricsPrefix}/overview/incidents`,
  metricsServiceDetail: `${metricsPrefix}/service/detail`,
  metricsServiceRuntime: `${metricsPrefix}/service/runtime`,
  metricsCatalogServices: `${metricsPrefix}/catalog/services`,
  metricsCatalogServicesSummary: `${metricsPrefix}/catalog/services/summary`,
  metricsCatalogServiceDetail: `${metricsPrefix}/catalog/service/detail`,
  metricsCatalogServiceQuickView: `${metricsPrefix}/catalog/service/quick-view`,

  // 订阅模块
  subscriptionPlans: `${subscriptionPrefix}/plans/list`, // 获取所有订阅计划
  userSubscription: `${subscriptionPrefix}/user`, // 获取用户订阅信息
  subscriptionUsage: `${subscriptionPrefix}/usage`, // 获取当前使用量统计
  subscriptionCurrentDetail: `${subscriptionPrefix}/current/detail`,
  subscriptionUsageSummary: `${subscriptionPrefix}/usage/summary`,
  subscriptionQuotaHistory: `${subscriptionPrefix}/quota/history`,
  subscribe: `${subscriptionPrefix}/subscription/create`,
  upgradeSubscription: `${subscriptionPrefix}/subscription/upgrade`,
  createPaymentOrder: `${subscriptionPrefix}/payment/createOrder`,
  queryPaymentOrder: `${subscriptionPrefix}/payment/queryOrder`,
  cancelSubscription: `${subscriptionPrefix}/cancel`, // 取消订阅
  resumeSubscription: `${subscriptionPrefix}/subscription/resume`,
  subscriptionHistory: `${subscriptionPrefix}/subscription/history`,
  billingHistory: `${subscriptionPrefix}/billing/list`,
  paymentMethods: `${subscriptionPrefix}/payment/methods`
}
