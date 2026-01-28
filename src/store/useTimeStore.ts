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
    { label: 'Past 15 Minutes', value: '15m' },
    { label: 'Past 1 Hour', value: '1h' },
    { label: 'Past 4 Hours', value: '4h' },
    { label: 'Past 1 Day', value: '1d' },
    { label: 'Past 2 Days', value: '2d' },
    { label: 'Past 7 Days', value: '7d' }
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
