import type { LocationQuery, LocationQueryValue } from 'vue-router'

export type InvestigationRange = '15m' | '1h' | '4h' | '1d' | '2d' | '7d'

export interface InvestigationContext {
  serviceId?: string
  serviceName?: string
  start?: number
  end?: number
  range?: InvestigationRange
  keyword?: string
  tab?: string
  incidentId?: string
}

const VALID_RANGES = new Set<InvestigationRange>(['15m', '1h', '4h', '1d', '2d', '7d'])

const first = (value: LocationQueryValue | LocationQueryValue[] | undefined) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

const epochMs = (value: string | undefined) => {
  if (!value || !/^\d+$/.test(value)) return undefined
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined
}

export const parseInvestigationContext = (query: LocationQuery): InvestigationContext => {
  const start = epochMs(first(query.invStart))
  const end = epochMs(first(query.invEnd))
  const hasAbsoluteWindow = start !== undefined && end !== undefined && start <= end
  const range = first(query.invRange)

  const serviceId = first(query.invServiceId)
  const serviceName = first(query.invServiceName)
  const keyword = first(query.invKeyword)
  const tab = first(query.invTab)
  const incidentId = first(query.invIncidentId)

  return {
    ...(serviceId ? { serviceId } : {}),
    ...(serviceName ? { serviceName } : {}),
    ...(hasAbsoluteWindow
      ? { start, end }
      : VALID_RANGES.has(range as InvestigationRange)
        ? { range: range as InvestigationRange }
        : {}),
    ...(keyword ? { keyword } : {}),
    ...(tab ? { tab } : {}),
    ...(incidentId ? { incidentId } : {})
  }
}

export const resolveInvestigationWindow = (context: InvestigationContext, now = Date.now()) => {
  if (context.start !== undefined && context.end !== undefined) return { start: context.start, end: context.end }
  const duration = context.range
    ? {
        '15m': 15 * 60_000,
        '1h': 60 * 60_000,
        '4h': 4 * 60 * 60_000,
        '1d': 24 * 60 * 60_000,
        '2d': 48 * 60 * 60_000,
        '7d': 7 * 24 * 60 * 60_000
      }[context.range]
    : undefined
  return duration ? { start: now - duration, end: now } : undefined
}

export const investigationQuery = (context: InvestigationContext): LocationQuery => ({
  ...(context.serviceId ? { invServiceId: context.serviceId } : {}),
  ...(context.serviceName ? { invServiceName: context.serviceName } : {}),
  ...(context.start !== undefined && context.end !== undefined
    ? { invStart: `${context.start}`, invEnd: `${context.end}` }
    : {}),
  ...(context.start === undefined && context.end === undefined && context.range ? { invRange: context.range } : {}),
  ...(context.keyword ? { invKeyword: context.keyword } : {}),
  ...(context.tab ? { invTab: context.tab } : {}),
  ...(context.incidentId ? { invIncidentId: context.incidentId } : {})
})
