// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { LEGAL_DOCUMENTS } from '../agreements'
import { hasAcceptedLegalAgreements, persistLegalAgreementAcceptance } from '../agreementAcceptance'

const STORAGE_KEY = 'starlight_legal_agreement_acceptance'

describe('legal agreement acceptance', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists accepted agreement versions', () => {
    persistLegalAgreementAcceptance(true)

    expect(hasAcceptedLegalAgreements()).toBe(true)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')).toEqual({
      serviceUpdatedAt: LEGAL_DOCUMENTS.service.updatedAt,
      privacyUpdatedAt: LEGAL_DOCUMENTS.privacy.updatedAt
    })
  })

  it('requires acceptance again when a stored document version is stale', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ serviceUpdatedAt: '2020 年 1 月 1 日', privacyUpdatedAt: LEGAL_DOCUMENTS.privacy.updatedAt })
    )

    expect(hasAcceptedLegalAgreements()).toBe(false)
  })

  it('requires acceptance again when the stored acknowledgement is incomplete', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ serviceUpdatedAt: LEGAL_DOCUMENTS.service.updatedAt }))

    expect(hasAcceptedLegalAgreements()).toBe(false)
  })

  it('does not create an acceptance record when the checkbox is cleared', () => {
    persistLegalAgreementAcceptance(false)

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(hasAcceptedLegalAgreements()).toBe(false)
  })
})
