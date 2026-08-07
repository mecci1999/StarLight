import { LEGAL_DOCUMENTS } from './agreements'

const STORAGE_KEY = 'starlight_legal_agreement_acceptance'

type AgreementAcceptance = {
  serviceUpdatedAt: string
  privacyUpdatedAt: string
}

const getStoredAcceptance = (): AgreementAcceptance | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const value = JSON.parse(raw) as Partial<AgreementAcceptance>
    if (typeof value.serviceUpdatedAt !== 'string' || typeof value.privacyUpdatedAt !== 'string') return null

    return { serviceUpdatedAt: value.serviceUpdatedAt, privacyUpdatedAt: value.privacyUpdatedAt }
  } catch {
    return null
  }
}

export const hasAcceptedLegalAgreements = () => {
  const acceptance = getStoredAcceptance()
  return (
    acceptance?.serviceUpdatedAt === LEGAL_DOCUMENTS.service.updatedAt &&
    acceptance.privacyUpdatedAt === LEGAL_DOCUMENTS.privacy.updatedAt
  )
}

export const persistLegalAgreementAcceptance = (accepted: boolean) => {
  if (!accepted) return

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      serviceUpdatedAt: LEGAL_DOCUMENTS.service.updatedAt,
      privacyUpdatedAt: LEGAL_DOCUMENTS.privacy.updatedAt
    } satisfies AgreementAcceptance)
  )
}
