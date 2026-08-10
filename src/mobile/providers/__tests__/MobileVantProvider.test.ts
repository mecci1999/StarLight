import { describe, expect, it } from 'vitest'
import { DARK_THEME_VARS, LIGHT_THEME_VARS } from '../MobileVantProvider'

describe('MobileVantProvider theme variables', () => {
  it('supplies tokenized surfaces and readable controls for Vant components', () => {
    expect(LIGHT_THEME_VARS).toMatchObject({
      background: 'var(--color-bg-1)',
      background2: 'var(--color-bg-2)',
      textColor: 'var(--color-text-1)',
      textColor2: 'var(--color-text-2)',
      textColor3: 'var(--color-text-3)',
      fieldPlaceholderTextColor: 'var(--color-text-3)',
      cellBackground: 'var(--color-bg-2)',
      popupBackground: 'var(--color-bg-5)',
      overlayBackground: 'var(--color-mask-bg)',
      tabActiveTextColor: 'var(--color-text-1)'
    })
  })

  it('uses dark-mode active and border tokens instead of retaining light active surfaces', () => {
    expect(DARK_THEME_VARS.activeColor).toBe('var(--color-fill-3)')
    expect(DARK_THEME_VARS.borderColor).toBe('var(--color-border-2)')
    expect(DARK_THEME_VARS.popupBackground).toBe('var(--color-bg-5)')
    expect(DARK_THEME_VARS.fieldInputTextColor).toBe('var(--color-text-1)')
  })
})
