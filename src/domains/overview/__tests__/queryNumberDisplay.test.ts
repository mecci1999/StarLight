import { describe, expect, it } from 'vitest'
import { formatQueryNumberDisplay } from '@/domains/overview/queryNumberDisplay'

describe('query number display formatting', () => {
  it('renders large MB values as GB for memory total number cards', () => {
    expect(formatQueryNumberDisplay(16384, 'MB')).toEqual({ value: '16', unit: 'GB' })
  })

  it('keeps small MB values in MB without compacting the unit into KMB', () => {
    expect(formatQueryNumberDisplay(512, 'MB')).toEqual({ value: '512', unit: 'MB' })
  })
})
