import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const readMobileView = (fileName: string) => readFile(new URL(`../${fileName}`, import.meta.url), 'utf8')

describe('mobile investigation context regressions', () => {
  it('uses a fixed non-zero window for alert investigation pivots', async () => {
    const source = await readMobileView('MobileAlertsInbox.tsx')

    expect(source).toContain('const investigationWindowMs = 15 * 60_000')
    expect(source).toContain(
      'start: Math.max(1, alertTime - investigationWindowMs), end: alertTime + investigationWindowMs'
    )
  })

  it('does not treat an alert keyword as a trace service filter', async () => {
    const source = await readMobileView('MobileTraceExplorer.tsx')

    expect(source).toContain('if (context.serviceName) params.service = context.serviceName')
    expect(source).not.toContain('if (context.keyword) params.service = context.keyword')
    expect(source).not.toContain('if (context.keyword !== undefined) searchQuery.value = context.keyword')
  })

  it('keeps trace detail failure distinct from empty detail data', async () => {
    const source = await readMobileView('MobileTraceExplorer.tsx')

    expect(source).toContain('const drawerError = ref(false)')
    expect(source).toContain('drawerError.value = true')
    expect(source).toContain('链路详情加载失败')
  })
})
