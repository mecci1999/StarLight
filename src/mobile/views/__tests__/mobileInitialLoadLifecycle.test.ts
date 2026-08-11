import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const activationLoadedViews = [
  'OverviewV2.tsx',
  'ServicesV2.tsx',
  'ServiceDetailV2.tsx',
  'MobileAlertsInbox.tsx',
  'MobileAlertRules.tsx',
  'MobileNotificationCenter.tsx',
  'MobileLogCenter.tsx',
  'MobileExceptionAnalysis.tsx',
  'MobileTraceExplorer.tsx',
  'MobileMetricsExplorer.tsx',
  'MobileInstanceMonitor.tsx',
  'MobileTopology.tsx',
  'MobileRealtimeMonitor.tsx',
  'MobileBilling.tsx',
  'MobileIngestion.tsx'
]

describe('mobile cached route lifecycle', () => {
  it('keeps routed mobile view instances alive', async () => {
    const layoutSource = await readFile(new URL('../../layout/MobileLayout.tsx', import.meta.url), 'utf8')

    expect(layoutSource).toContain('import { h, KeepAlive')
    expect(layoutSource).toContain('h(KeepAlive')
  })

  it.each(activationLoadedViews)('%s refreshes its data when the cached page activates', async (fileName) => {
    const source = await readFile(new URL(`../${fileName}`, import.meta.url), 'utf8')

    expect(source).toContain('onActivated(')
  })

  it('uses bounded activation refreshes for cached list and tab pages', async () => {
    const files = [
      'Home.tsx',
      'OverviewV2.tsx',
      'ServicesV2.tsx',
      'MobileAlertsInbox.tsx',
      'MobileNotificationCenter.tsx',
      'MobileExceptionAnalysis.tsx',
      'MobileAlertRules.tsx',
      'MobileTopology.tsx',
      'MobileBilling.tsx',
      'MobileIngestion.tsx',
      'MobileLogCenter.tsx',
      'MobileRealtimeMonitor.tsx'
    ]
    const sources = await Promise.all(
      files.map((fileName) => readFile(new URL(`../${fileName}`, import.meta.url), 'utf8'))
    )

    sources.forEach((source) => {
      expect(source).toContain('useActivationRefresh')
      expect(source).toContain('shouldRefreshOnActivation()')
    })
  })

  it('keeps parameterized detail and analysis pages immediately route-responsive', async () => {
    const [serviceDetail, instanceMonitor, metricsExplorer, traceExplorer] = await Promise.all([
      readFile(new URL('../ServiceDetailV2.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../MobileInstanceMonitor.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../MobileMetricsExplorer.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../MobileTraceExplorer.tsx', import.meta.url), 'utf8')
    ])

    ;[serviceDetail, instanceMonitor, metricsExplorer, traceExplorer].forEach((source) => {
      expect(source).toContain('watch(')
      expect(source).toContain('route.')
    })
  })

  it('cleans dashboard timers while the cached page is inactive', async () => {
    const source = await readFile(new URL('../OverviewV2.tsx', import.meta.url), 'utf8')

    expect(source).toContain('onDeactivated(() => {')
    expect(source).toContain('clearInterval(refreshTimer)')
    expect(source).toContain('refreshTimer = null')
  })
})
