import { describe, expect, it } from 'vitest'
import { LEGAL_DOCUMENTS, getLegalDocument } from '../agreements'

describe('legal agreements', () => {
  it('provides complete service and privacy documents for login readers', () => {
    for (const kind of ['service', 'privacy'] as const) {
      const document = getLegalDocument(kind)

      expect(document).toBe(LEGAL_DOCUMENTS[kind])
      expect(document.title).not.toHaveLength(0)
      expect(document.summary).not.toHaveLength(0)
      expect(document.updatedAt).not.toHaveLength(0)
      expect(document.sections.length).toBeGreaterThanOrEqual(5)
      expect(document.sections.every((section) => section.title.length > 0 && section.paragraphs.length > 0)).toBe(true)
    }
  })
})
