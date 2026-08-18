import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const readMobileView = (fileName: string) => readFile(new URL(`../${fileName}`, import.meta.url), 'utf8')

describe('mobile data-state regressions', () => {
  it('keeps service-catalog failures distinct from an empty catalog', async () => {
    const source = await readMobileView('ServicesV2.tsx')

    expect(source).toContain('const error = ref(false)')
    expect(source).toContain("console.error('Failed to load mobile services:'")
    expect(source).toContain('服务目录加载失败，请检查网络后重试')
    expect(source).toContain('onClick={refresh}')
  })

  it('keeps service-detail failures distinct from a missing service and reloads after route changes', async () => {
    const source = await readMobileView('ServiceDetailV2.tsx')

    expect(source).toContain("console.error('Failed to load mobile service detail:'")
    expect(source).toContain('服务详情加载失败，请检查网络后重试')
    expect(source).toContain('() => route.params.serviceId')
    expect(source).toContain('() => void loadServiceDetail()')
    expect(source).toContain('let detailRequestId = 0')
    expect(source).toContain("route.name !== 'mobile-service-detail-v2' || !serviceId")
    expect(source).toContain('if (requestId !== detailRequestId) return')
    const detailRequest = source.slice(
      source.indexOf('const detailRes = await fetchServiceDetailSummary('),
      source.indexOf('if (requestId !== detailRequestId) return')
    )
    expect(detailRequest).toContain("scope: 'system'")
  })

  it('passes the selected exception range as concrete request boundaries', async () => {
    const source = await readMobileView('MobileExceptionAnalysis.tsx')

    expect(source).toContain('const TIME_RANGE_HOURS: Record<TimeRange, number>')
    expect(source).toContain("endTime.subtract(TIME_RANGE_HOURS[timeRange.value], 'hour')")
    expect(source).toContain('void loadExceptions()')
  })

  it('uses the selected log range for the overview search request', async () => {
    const source = await readMobileView('MobileLogCenter.tsx')

    expect(source).toContain('const TIME_RANGE_HOURS: Record<string, number>')
    expect(source).toContain("endTime.subtract(rangeHours, 'hour')")
    expect(source).toContain('endTime: endTime.toISOString()')
  })

  it('does not turn notification request failures into an empty notification history', async () => {
    const source = await readFile(new URL('../../../api/alerts.ts', import.meta.url), 'utf8')

    expect(source).toContain(
      'return request.get<NotificationItem[]>(url.metricsNotifications, cleanAlertQueryParams(params))'
    )
    expect(source).not.toContain('using empty fallback')
  })

  it('keeps billing history pagination in the payment tab', async () => {
    const source = await readMobileView('MobileBilling.tsx')
    const paymentSection = source.slice(
      source.indexOf('const renderPaymentTab'),
      source.indexOf('const renderUsageTab')
    )

    expect(paymentSection).toContain('加载更多账单')
    expect(paymentSection).toContain('paymentLoadMoreError.value')
  })

  it('keeps every catalog page reachable from the mobile services page', async () => {
    const source = await readMobileView('ServicesV2.tsx')

    expect(source).toContain('const loadingMore = ref(false)')
    expect(source).toContain('const hasMore = computed(() => services.value.length < total.value)')
    expect(source).toContain('const loadMore = async () =>')
    expect(source).toContain('加载更多服务')
    expect(source).toContain('const loadMoreError = ref(false)')
  })

  it('distinguishes log-stream and service-log failures from valid empty data', async () => {
    const source = await readMobileView('MobileLogCenter.tsx')

    expect(source).toContain('const streamError = ref(false)')
    expect(source).toContain('实时日志加载失败，请检查网络后重试')
    expect(source).toContain('const serviceOptionsError = ref(false)')
    expect(source).toContain('const serviceLogsError = ref(false)')
    expect(source).toContain('const loadMoreServiceLogs = async () =>')
    expect(source).toContain('服务日志加载失败，请检查网络后重试')
    expect(source).toContain('const serviceLogsLoadMoreError = ref(false)')
  })

  it('wires validated investigation context into the allowed mobile sources without passing scope in URLs', async () => {
    const [alerts, detail, traces] = await Promise.all([
      readMobileView('MobileAlertsInbox.tsx'),
      readMobileView('ServiceDetailV2.tsx'),
      readMobileView('MobileTraceExplorer.tsx')
    ])

    expect(alerts).toContain('investigateAlert')
    expect(alerts).toContain("'/mobile/log-center'")
    expect(alerts).toContain("'/mobile/trace-explorer'")
    expect(alerts).toContain('alert.serviceId &&')
    expect(detail).toContain('investigationQuery')
    expect(detail).toContain("'/mobile/metrics-explorer'")
    expect(traces).toContain('const drawerError = ref(false)')
    expect(traces).toContain('链路详情加载失败')
    expect(alerts).toContain('investigationQuery({')
  })

  it('uses scoped service selectors and removes unsupported instance range controls', async () => {
    const metricsSource = await readMobileView('MobileMetricsExplorer.tsx')
    const instancesSource = await readMobileView('MobileInstanceMonitor.tsx')

    expect(metricsSource).toContain('scope: getPreferredMetricsDatasetScope()')
    expect(metricsSource).toContain('服务列表加载失败')
    expect(instancesSource).toContain('scope: getPreferredMetricsDatasetScope()')
    expect(instancesSource).toContain('服务列表加载失败')
    expect(instancesSource).not.toContain('TIME_RANGE_OPTIONS')
    expect(instancesSource).not.toContain('mobile-instance-monitor__time-range')
  })

  it('keeps profile editing open and reports a rejected save', async () => {
    const source = await readMobileView('MobileProfile.tsx')

    expect(source).toContain("console.error('Failed to save mobile profile:'")
    expect(source).toContain("message.error('保存个人资料失败，请检查网络后重试')")
  })
})
