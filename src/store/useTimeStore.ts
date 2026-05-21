import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

export type TimeRangeKey = '15m' | '1h' | '4h' | '1d' | '2d' | '7d' | 'custom'

export const useTimeStore = defineStore('time', () => {
  const timeRange = ref<TimeRangeKey>('1h')
  const startTime = ref<number>(dayjs().subtract(1, 'hour').valueOf())
  const endTime = ref<number>(dayjs().valueOf())
  const isLive = ref(true) // Live tailing mode

  const timeOptions = [
    { label: '最近 15 分钟', value: '15m' },
    { label: '最近 1 小时', value: '1h' },
    { label: '最近 4 小时', value: '4h' },
    { label: '最近 1 天', value: '1d' },
    { label: '最近 2 天', value: '2d' },
    { label: '最近 7 天', value: '7d' }
  ]

  const setTimeRange = (range: TimeRangeKey) => {
    timeRange.value = range
    isLive.value = true // Reset to live when picking standard ranges usually
    const now = dayjs()
    endTime.value = now.valueOf()

    switch (range) {
      case '15m':
        startTime.value = now.subtract(15, 'minute').valueOf()
        break
      case '1h':
        startTime.value = now.subtract(1, 'hour').valueOf()
        break
      case '4h':
        startTime.value = now.subtract(4, 'hour').valueOf()
        break
      case '1d':
        startTime.value = now.subtract(1, 'day').valueOf()
        break
      case '2d':
        startTime.value = now.subtract(2, 'day').valueOf()
        break
      case '7d':
        startTime.value = now.subtract(7, 'day').valueOf()
        break
    }
  }

  const setCustomTime = (start: number, end: number) => {
    timeRange.value = 'custom'
    isLive.value = false
    startTime.value = start
    endTime.value = end
  }

  // Auto-refresh hook support
  const refreshTime = () => {
    if (isLive.value && timeRange.value !== 'custom') {
      setTimeRange(timeRange.value)
    }
  }

  return {
    timeRange,
    startTime,
    endTime,
    isLive,
    timeOptions,
    setTimeRange,
    setCustomTime,
    refreshTime
  }
})
