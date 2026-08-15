import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('mobile buttons', () => {
  it('centers the Vant button content and label across the available button width', async () => {
    const styles = await readFile(new URL('./MobileUI.scss', import.meta.url), 'utf8')

    expect(styles).toMatch(
      /\.mobile-button\.van-button\s*\{[\s\S]*?display: inline-flex;[\s\S]*?justify-content: center;/
    )
    expect(styles).toMatch(
      /\.van-button__content\s*\{[\s\S]*?display: flex;[\s\S]*?flex: 1 1 auto;[\s\S]*?width: 100%;/
    )
    expect(styles).toMatch(/\.van-button__text\s*\{[\s\S]*?justify-content: center;[\s\S]*?text-align: center;/)
  })
})
