export const formatQueryNumberValue = (value: number) => {
  if (!Number.isFinite(value)) return '0'
  const absoluteValue = Math.abs(value)
  if (absoluteValue >= 1000000000)
    return `${Number((value / 1000000000).toFixed(absoluteValue >= 10000000000 ? 0 : 1))}B`
  if (absoluteValue >= 1000000) return `${Number((value / 1000000).toFixed(absoluteValue >= 10000000 ? 0 : 1))}M`
  if (absoluteValue >= 1000) return `${Number((value / 1000).toFixed(absoluteValue >= 10000 ? 0 : 1))}K`
  if (Number.isInteger(value)) return value.toLocaleString()
  return Number(value.toFixed(absoluteValue >= 10 ? 1 : 2)).toLocaleString()
}

export const formatQueryNumberDisplay = (value: number, unit = '') => {
  const normalizedUnit = unit.trim().toLowerCase()
  if (normalizedUnit === 'mb' && Math.abs(value) >= 1024) {
    const gbValue = value / 1024
    const digits = Math.abs(gbValue) >= 10 || Number.isInteger(gbValue) ? 0 : 1
    return {
      value: Number(gbValue.toFixed(digits)).toLocaleString(),
      unit: 'GB'
    }
  }

  return {
    value: formatQueryNumberValue(value),
    unit
  }
}
