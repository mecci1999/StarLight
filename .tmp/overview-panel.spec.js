import { test, expect } from 'playwright/test'

test.use({ channel: 'chrome', headless: true, viewport: { width: 1440, height: 1400 } })

test('overview panel homepage works', async ({ page }) => {
  await page.goto('http://127.0.0.1:6130/home/overview', { waitUntil: 'networkidle' })

  await expect(page.getByText('面板')).toBeVisible()
  await expect(page.getByText('当前面板')).toBeVisible()
  await expect(page.getByText('保存为默认面板')).toBeVisible()
  await expect(page.getByText('面板恢复')).toBeVisible()
  await expect(page.getByText('系统默认模板')).toBeVisible()

  const bodyBefore = await page.locator('body').innerText()
  expect(bodyBefore.includes('打开面板编辑')).toBeFalsy()
  expect(bodyBefore.includes('可编辑面板')).toBeFalsy()
  expect(bodyBefore.includes('高风险服务')).toBeTruthy()
  expect(bodyBefore.includes('请求总量')).toBeTruthy()
  expect(bodyBefore.includes('采集状态')).toBeTruthy()
  expect(bodyBefore.includes('最近事件')).toBeTruthy()

  await page.getByText('系统默认模板').click()
  await page.getByRole('option', { name: '接入健康模板' }).click()
  await page.waitForTimeout(400)

  const bodyAfter = await page.locator('body').innerText()
  expect(bodyAfter.includes('采集状态')).toBeTruthy()
  expect(bodyAfter.includes('最近事件')).toBeTruthy()
  expect(bodyAfter.includes('高风险服务')).toBeFalsy()
  expect(bodyAfter.includes('请求总量')).toBeFalsy()
})
