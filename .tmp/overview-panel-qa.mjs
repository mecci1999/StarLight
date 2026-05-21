import { chromium } from 'playwright'

const run = async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } })

  await page.goto('http://127.0.0.1:6130/home/overview', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  const bodyBefore = await page.locator('body').innerText()

  const defaultState = {
    hasPanelTitle: bodyBefore.includes('面板'),
    hasCurrentPanel: bodyBefore.includes('当前面板'),
    hasSaveDefaultPanel: bodyBefore.includes('保存为默认面板'),
    hasRestorePanel: bodyBefore.includes('面板恢复'),
    hasLegacyEditCard: bodyBefore.includes('打开面板编辑') || bodyBefore.includes('可编辑面板'),
    hasDefaultTemplateLabel: bodyBefore.includes('系统默认模板'),
    hasRiskServices: bodyBefore.includes('高风险服务'),
    hasRequestTotal: bodyBefore.includes('请求总量'),
    hasIngestStatus: bodyBefore.includes('采集状态'),
    hasRecentIncidents: bodyBefore.includes('最近事件')
  }

  await page.getByText('系统默认模板').click()
  await page.getByRole('option', { name: '接入健康模板' }).click()
  await page.waitForTimeout(500)

  const bodyAfter = await page.locator('body').innerText()
  const ingestionState = {
    hasIngestStatus: bodyAfter.includes('采集状态'),
    hasRecentIncidents: bodyAfter.includes('最近事件'),
    hasRiskServices: bodyAfter.includes('高风险服务'),
    hasRequestTotal: bodyAfter.includes('请求总量')
  }

  console.log(JSON.stringify({ defaultState, ingestionState }, null, 2))
  await browser.close()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
