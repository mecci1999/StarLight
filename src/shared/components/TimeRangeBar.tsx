import { defineComponent, computed } from 'vue'
import { NButton, NSpace, NSwitch, NText, NSelect, NCard } from 'naive-ui'
import type { TimeRangeKey } from '@/store/useTimeStore'
import './TimeRangeBar.scss'

export default defineComponent({
  name: 'TimeRangeBar',
  props: {
    value: {
      type: String as () => TimeRangeKey,
      required: true
    },
    live: {
      type: Boolean,
      default: true
    },
    options: {
      type: Array as () => Array<{ label: string; value: TimeRangeKey }>,
      default: () => []
    },
    autoRefreshValue: {
      type: String,
      default: 'off'
    },
    autoRefreshOptions: {
      type: Array as () => Array<{ label: string; value: string }>,
      default: () => []
    },
    autoRefreshHint: {
      type: String,
      default: ''
    },
    disabled: { type: Boolean, default: false }
  },
  emits: ['update:value', 'update:live', 'update:autoRefresh', 'refresh'],
  setup(props, { emit }) {
    const localizedOptions = computed(() => {
      const labelMap: Record<string, string> = {
        '15m': '最近 15 分钟',
        '1h': '最近 1 小时',
        '4h': '最近 4 小时',
        '1d': '最近 1 天',
        '2d': '最近 2 天',
        '7d': '最近 7 天',
        custom: '自定义'
      }
      return props.options.map((option) => ({
        ...option,
        label: labelMap[option.value] || option.label
      }))
    })

    return () => (
      <NCard bordered={false} class="time-range-bar">
        <div class="time-range-bar__content">
          <NSpace align="center" wrap>
            <NText depth={3}>时间范围</NText>
            <NSelect
              class="time-range-select"
              value={props.value}
              options={localizedOptions.value}
              disabled={props.disabled}
              onUpdateValue={(value: TimeRangeKey) => emit('update:value', value)}
            />
          </NSpace>
          <NSpace align="center">
            <NText depth={3}>实时模式</NText>
            <NSwitch value={props.live} onUpdateValue={(value: boolean) => emit('update:live', value)} />
            {props.autoRefreshOptions.length ? <NText depth={3}>自动刷新</NText> : null}
            {props.autoRefreshOptions.length ? (
              <NSelect
                class="time-range-select time-range-select--refresh"
                value={props.autoRefreshValue}
                options={props.autoRefreshOptions}
                disabled={props.disabled}
                onUpdateValue={(value: string) => emit('update:autoRefresh', value)}
              />
            ) : null}
            <NButton size="small" secondary type="primary" onClick={() => emit('refresh')} disabled={props.disabled}>
              刷新时间
            </NButton>
          </NSpace>
          {props.autoRefreshOptions.length && props.autoRefreshHint ? (
            <NText depth={3}>{props.autoRefreshHint}</NText>
          ) : null}
        </div>
      </NCard>
    )
  }
})
