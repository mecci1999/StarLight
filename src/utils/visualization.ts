export type AggregationMode = 'sum' | 'avg' | 'max' | 'min' | 'last'

export type VisualizationDataset = {
  id: string
  name: string
  fields: string[]
  records: Record<string, any>[]
  geo?: {
    name: string
    json: any
  }
}

export type VisualizationParseResult = {
  dataset: VisualizationDataset | null
  warnings: string[]
}

export type DisplaySize = 'large' | 'medium' | 'small'

export type ComponentResponsibility = 'system' | 'performance' | 'alert' | 'resource' | 'business'

export type DataKind = 'timeseries' | 'distribution' | 'status' | 'table' | 'geo' | 'alert' | 'comparison'

export type ComponentDescriptor = {
  id: string
  responsibility: ComponentResponsibility
  dataKind: DataKind
  goals: string[]
  allowedSizes: DisplaySize[]
  defaultSize: DisplaySize
}

const toArray = (value: any) => (Array.isArray(value) ? value : [])

const normalizeTimestamp = (value: any) => {
  const num = Number(value)
  if (Number.isNaN(num)) return Date.now()
  return num < 1_000_000_000_000 ? num * 1000 : num
}

const parseTagSet = (value: any) => {
  const labels: Record<string, any> = {}
  if (!value) return labels
  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (typeof item !== 'string') return
      const [key, ...rest] = item.split(':')
      if (!key) return
      labels[key] = rest.join(':') || true
    })
    return labels
  }
  if (typeof value === 'string') {
    value.split(',').forEach((item) => {
      const [key, ...rest] = item.split(':')
      if (!key) return
      labels[key] = rest.join(':') || true
    })
    return labels
  }
  if (typeof value === 'object') {
    Object.entries(value).forEach(([key, val]) => {
      labels[key] = val
    })
  }
  return labels
}

const parseCsvRows = (input: string) => {
  const rows: string[][] = []
  let current: string[] = []
  let value = ''
  let inQuotes = false
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    const next = input[i + 1]
    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"'
        i += 1
        continue
      }
      inQuotes = !inQuotes
      continue
    }
    if (char === ',' && !inQuotes) {
      current.push(value)
      value = ''
      continue
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1
      }
      current.push(value)
      value = ''
      if (current.some((item) => item.trim() !== '')) {
        rows.push(current)
      }
      current = []
      continue
    }
    value += char
  }
  current.push(value)
  if (current.some((item) => item.trim() !== '')) {
    rows.push(current)
  }
  return rows
}

const parseCsvDataset = (payload: string, datasetId: string, datasetName: string): VisualizationParseResult => {
  const warnings: string[] = []
  const rows = parseCsvRows(payload)
  if (rows.length === 0) {
    return { dataset: null, warnings: ['CSV 为空'] }
  }
  const header = rows[0].map((item) => item.trim()).filter(Boolean)
  if (header.length === 0) {
    return { dataset: null, warnings: ['CSV 表头为空'] }
  }
  const records = rows.slice(1).map((row) => {
    const record: Record<string, any> = {}
    header.forEach((key, index) => {
      const raw = row[index] ?? ''
      const trimmed = String(raw).trim()
      if (trimmed === '') {
        record[key] = null
        return
      }
      const num = Number(trimmed)
      record[key] = Number.isNaN(num) ? trimmed : num
    })
    return record
  })
  if (records.length === 0) {
    warnings.push('CSV 无数据行')
  }
  return {
    dataset: {
      id: datasetId,
      name: datasetName,
      fields: header,
      records
    },
    warnings
  }
}

const normalizeFieldSet = (dataset: VisualizationDataset) => {
  const fields = dataset.fields.length > 0 ? dataset.fields : inferFields(dataset.records)
  return new Set(fields.map((field) => String(field).toLowerCase()))
}

const normalizeMetricSet = (dataset: VisualizationDataset) => {
  const metrics = dataset.records
    .map((record) => record.metric)
    .filter((metric) => typeof metric === 'string' && metric.trim() !== '')
    .map((metric) => metric.toLowerCase())
  return new Set(metrics)
}

const containsAny = (set: Set<string>, terms: string[]) => {
  for (const value of set) {
    for (const term of terms) {
      if (value.includes(term)) return true
    }
  }
  return false
}

const inferRecommendationSignals = (dataset: VisualizationDataset) => {
  const fields = normalizeFieldSet(dataset)
  const metrics = normalizeMetricSet(dataset)
  const text = new Set([...fields, ...metrics])
  const recordCount = dataset.records.length
  const hasTimestamp = containsAny(fields, ['timestamp', 'time', 'datetime', 'ts'])
  const hasValue = containsAny(fields, ['value', 'count', 'sum', 'avg'])
  const hasCategory = containsAny(fields, ['category', 'name', 'type'])
  const hasSeries = containsAny(fields, ['series'])
  const hasLat = containsAny(fields, ['lat', 'latitude'])
  const hasLon = containsAny(fields, ['lon', 'lng', 'longitude'])
  const hasAlert =
    containsAny(fields, ['level', 'severity', 'message', 'alert', 'incident']) ||
    containsAny(metrics, ['alert', 'incident', 'alarm'])
  const hasStatus =
    containsAny(fields, ['status', 'state', 'health']) || containsAny(metrics, ['uptime', 'availability', 'sla', 'slo'])

  const dataKindScores: Record<DataKind, number> = {
    timeseries: hasTimestamp && hasValue ? 3 : 0,
    distribution: hasCategory && hasValue ? 2 : 0,
    comparison: hasCategory && hasValue && (hasSeries || metrics.size > 1) ? 2 : 0,
    status: hasStatus || (hasValue && !hasTimestamp && !hasCategory) ? 2 : 0,
    table: recordCount > 0 ? 1 : 0,
    geo: hasLat && hasLon ? 3 : 0,
    alert: hasAlert ? 3 : 0
  }

  const responsibilityScores: Record<ComponentResponsibility, number> = {
    system: containsAny(text, ['cpu', 'memory', 'disk', 'load', 'io', 'network', 'process', 'thread']) ? 3 : 0,
    performance: containsAny(text, [
      'latency',
      'duration',
      'response',
      'request',
      'throughput',
      'qps',
      'rps',
      'error',
      'traffic',
      'apm'
    ])
      ? 3
      : 0,
    alert: hasAlert || containsAny(text, ['alert', 'incident', 'alarm', 'exception']) ? 3 : 0,
    resource: containsAny(text, ['resource', 'usage', 'quota', 'capacity', 'utilization']) ? 2 : 0,
    business: containsAny(text, ['order', 'payment', 'conversion', 'kpi', 'gmv', 'revenue', 'user', 'signup', 'active'])
      ? 2
      : 0
  }

  return { dataKindScores, responsibilityScores }
}

const resolveMetricsList = (payload: any) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.metrics)) return payload.metrics
  if (Array.isArray(payload?.data?.metrics)) return payload.data.metrics
  if (Array.isArray(payload?.content)) return payload.content
  if (Array.isArray(payload?.data?.content)) return payload.data.content
  if (Array.isArray(payload?.result)) return payload.result
  if (Array.isArray(payload?.series)) return payload.series
  if (Array.isArray(payload?.data?.series)) return payload.data.series
  const nodes = toArray(payload?.nodes || payload?.data?.nodes)
  if (nodes.length > 0) {
    return nodes.flatMap((node: any) => toArray(node?.metrics))
  }
  const services = toArray(payload?.services || payload?.data?.services)
  if (services.length > 0) {
    return services.flatMap((service: any) => toArray(service?.metrics))
  }
  return []
}

const buildLabelKey = (labels: Record<string, any> | undefined) => {
  if (!labels) return ''
  const keys = Object.keys(labels)
  if (keys.length === 0) return ''
  return keys
    .sort()
    .map((key) => `${key}:${labels[key]}`)
    .join(',')
}

const inferFields = (records: Record<string, any>[]) => {
  const fieldSet = new Set<string>()
  records.forEach((record) => {
    Object.keys(record).forEach((key) => fieldSet.add(key))
  })
  return Array.from(fieldSet)
}

export const aggregateValues = (values: number[], mode: AggregationMode) => {
  if (values.length === 0) return 0
  if (mode === 'sum') return values.reduce((sum, value) => sum + value, 0)
  if (mode === 'avg') return values.reduce((sum, value) => sum + value, 0) / values.length
  if (mode === 'max') return Math.max(...values)
  if (mode === 'min') return Math.min(...values)
  return values[values.length - 1]
}

export const filterByTimeRange = (
  records: Record<string, any>[],
  timeField: string | undefined,
  range: [number, number] | null
) => {
  if (!timeField || !range) return records
  const [start, end] = range
  return records.filter((record) => {
    const value = Number(record[timeField])
    return !Number.isNaN(value) && value >= start && value <= end
  })
}

export const buildCategoryAggregation = (
  records: Record<string, any>[],
  categoryField: string,
  valueField: string,
  mode: AggregationMode
) => {
  const map = new Map<string, number[]>()
  records.forEach((record) => {
    const key = String(record[categoryField] ?? '未分组')
    const rawValue = Number(record[valueField])
    if (Number.isNaN(rawValue)) return
    if (!map.has(key)) map.set(key, [])
    map.get(key)?.push(rawValue)
  })
  return Array.from(map.entries()).map(([name, values]) => ({
    name,
    value: aggregateValues(values, mode)
  }))
}

export const parseVisualizationDataset = (
  payload: any,
  datasetId: string,
  datasetName: string
): VisualizationParseResult => {
  const warnings: string[] = []
  if (!payload) {
    return { dataset: null, warnings: ['数据为空'] }
  }
  if (typeof payload === 'string') {
    return parseCsvDataset(payload, datasetId, datasetName)
  }

  const geo = payload?.geo || payload?.geoJson || payload?.map
  const geoName = payload?.geoName || 'custom-geo'

  const datasetPayload = payload?.dataset || payload
  if (Array.isArray(datasetPayload?.records)) {
    const records = datasetPayload.records as Record<string, any>[]
    const fields = Array.isArray(datasetPayload.fields)
      ? datasetPayload.fields
      : records.length > 0
        ? inferFields(records)
        : []
    return {
      dataset: {
        id: datasetId,
        name: datasetName,
        fields,
        records,
        geo: geo ? { name: geoName, json: geo } : undefined
      },
      warnings
    }
  }

  const metricsList = resolveMetricsList(payload)
  if (metricsList.length === 0) {
    return { dataset: null, warnings: ['未识别到可用指标'] }
  }

  const records: Record<string, any>[] = []
  metricsList.forEach((metric: any) => {
    const name = metric?.name || metric?.metric || metric?.measurement
    if (!name) return
    const metricType = metric?.type || metric?.metricType
    const metricUnit = metric?.unit
    const metricDescription = metric?.description
    const values = toArray(metric?.values)

    // 兼容聚合格式 (values 是数组)
    if (Array.isArray(metric.values) && metric.values.length > 0) {
      const labels = {
        ...parseTagSet(metric.tags),
        ...parseTagSet(metric.labels)
      }
      const labelKey = buildLabelKey(labels)
      const series = labelKey ? `${name}{${labelKey}}` : name

      metric.values.forEach((v: any) => {
        // Handle both object {timestamp, value} and array [timestamp, value]
        const rawTs = v.timestamp ?? v[0]
        const rawVal = v.value ?? v[1]

        if (rawVal === undefined || rawVal === null) return

        const timestamp = normalizeTimestamp(rawTs)
        const value = Number(rawVal)

        if (Number.isNaN(value)) return

        records.push({
          metric: name,
          metricType,
          unit: metricUnit,
          description: metricDescription,
          series,
          category: labelKey || name,
          timestamp,
          value,
          ...labels
        })
      })
      return
    }

    // 兼容标准扁平化格式 (MetricItem)
    if (values.length === 0 && (metric.value !== undefined || metric.val !== undefined)) {
      const rawValue = metric.value ?? metric.val
      if (rawValue === null || rawValue === undefined) return
      const value = Number(rawValue)
      if (Number.isNaN(value)) return

      const timestamp = normalizeTimestamp(metric.timestamp || metric.time)
      const labels = {
        ...parseTagSet(metric.tags),
        ...parseTagSet(metric.labels)
      }
      const labelKey = buildLabelKey(labels)
      const series = labelKey ? `${name}{${labelKey}}` : name

      records.push({
        metric: name,
        metricType,
        unit: metricUnit,
        description: metricDescription,
        series,
        category: labelKey || name,
        timestamp,
        value,
        ...labels
      })
      return
    }

    if (values.length === 0 && Array.isArray(metric?.pointlist)) {
      const labels = {
        ...parseTagSet(metric?.tag_set || metric?.tagSet),
        ...parseTagSet(metric?.tags),
        ...parseTagSet(metric?.scope)
      }
      const labelKey = buildLabelKey(labels)
      const seriesName = labelKey ? `${name}{${labelKey}}` : name
      metric.pointlist.forEach((point: any) => {
        const timestamp = normalizeTimestamp(Array.isArray(point) ? point[0] : point?.timestamp || point?.time)
        const rawValue = Array.isArray(point) ? point[1] : point?.value
        if (rawValue === null || rawValue === undefined) return
        const value =
          typeof rawValue === 'number'
            ? rawValue
            : typeof rawValue === 'string' && rawValue.trim() !== '' && !Number.isNaN(Number(rawValue))
              ? Number(rawValue)
              : rawValue
        records.push({
          metric: name,
          metricType,
          unit: metricUnit,
          description: metricDescription,
          series: seriesName,
          category: labelKey || name,
          timestamp,
          value,
          ...labels
        })
      })
      return
    }
    values.forEach((entry: any) => {
      const rawValue =
        entry?.value ?? entry?.lastValue ?? entry?.count ?? entry?.sum ?? entry?.valueString ?? entry?.valueText ?? null
      if (rawValue === null || rawValue === undefined) return
      const value =
        typeof rawValue === 'number'
          ? rawValue
          : typeof rawValue === 'string' && rawValue.trim() !== '' && !Number.isNaN(Number(rawValue))
            ? Number(rawValue)
            : rawValue
      const timestamp = normalizeTimestamp(entry?.timestamp || entry?.time)
      const labels = entry?.labels || entry?.tags || {}
      const labelKey = buildLabelKey(labels)
      const series = labelKey ? `${name}{${labelKey}}` : name
      const record: any = {
        metric: name,
        metricType,
        unit: metricUnit,
        description: metricDescription,
        series,
        category: labelKey || name,
        timestamp,
        value,
        ...labels
      }

      // If entry has rate, include it in the record
      if (entry?.rate !== undefined) {
        record.rate = entry.rate
      }

      records.push(record)
    })
  })

  if (records.length === 0) {
    warnings.push('指标为空')
  }

  const calculateCounterRate = (records: Record<string, any>[]): Record<string, any>[] => {
    const counterRecords = records.filter((r) => r.metricType === 'counter')
    if (counterRecords.length === 0) return records

    const result = [...records]
    const counterGroups = new Map<string, Record<string, any>[]>()

    counterRecords.forEach((r) => {
      const key = `${r.metric}_${r.series || ''}`
      if (!counterGroups.has(key)) counterGroups.set(key, [])
      counterGroups.get(key)?.push(r)
    })

    counterGroups.forEach((groupRecords, key) => {
      const sorted = groupRecords.sort((a, b) => a.timestamp - b.timestamp)
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]
        const curr = sorted[i]
        const timeDiff = (curr.timestamp - prev.timestamp) / 1000
        if (timeDiff > 0) {
          const valueDiff = curr.value - prev.value
          const rate = valueDiff / timeDiff
          const recordIndex = result.findIndex((r) => r === curr)
          if (recordIndex !== -1) {
            result[recordIndex] = {
              ...result[recordIndex],
              rate: Math.max(0, rate)
            }
          }
        }
      }
    })

    return result
  }

  const processedRecords = calculateCounterRate(records)

  return {
    dataset: {
      id: datasetId,
      name: datasetName,
      fields: inferFields(processedRecords),
      records: processedRecords,
      geo: geo ? { name: geoName, json: geo } : undefined
    },
    warnings
  }
}

export const resolveSizeSpan = (size: DisplaySize) => (size === 'large' ? 24 : size === 'medium' ? 12 : 6)

export const resolveSizeHeight = (size: DisplaySize) => (size === 'large' ? 360 : size === 'medium' ? 280 : 200)

export const resolveRowCapacity = (size: DisplaySize) => (size === 'large' ? 1 : size === 'medium' ? 2 : 4)

export const buildSizeRows = <T extends { size: DisplaySize }>(items: T[]) => {
  const rows: Array<{ size: DisplaySize; items: T[] }> = []
  let currentRow: { size: DisplaySize; items: T[] } | null = null
  items.forEach((item) => {
    const capacity = resolveRowCapacity(item.size)
    if (!currentRow || currentRow.size !== item.size || currentRow.items.length >= capacity) {
      currentRow = { size: item.size, items: [] }
      rows.push(currentRow)
    }
    currentRow.items.push(item)
  })
  return rows
}

export const recommendComponents = (
  components: ComponentDescriptor[],
  input: {
    responsibility?: ComponentResponsibility
    dataKind?: DataKind
    goal?: string
    dataset?: VisualizationDataset | null
  }
) => {
  const signals = input.dataset ? inferRecommendationSignals(input.dataset) : null
  const scored = components.map((component) => {
    let score = 0
    if (signals) {
      score += signals.dataKindScores[component.dataKind] || 0
      score += signals.responsibilityScores[component.responsibility] || 0
    }
    if (input.responsibility && component.responsibility === input.responsibility) score += 1
    if (input.dataKind && component.dataKind === input.dataKind) score += 1
    if (input.goal && component.goals.includes(input.goal)) score += 1
    return { ...component, score }
  })
  const filtered =
    signals === null && input.responsibility && input.dataKind
      ? scored.filter(
          (component) => component.responsibility === input.responsibility && component.dataKind === input.dataKind
        )
      : scored
  const ranked = signals ? filtered.filter((item) => item.score > 0) : filtered
  const list = ranked.length > 0 ? ranked : filtered
  return list.sort((a, b) => b.score - a.score).map(({ score, ...rest }) => rest)
}
