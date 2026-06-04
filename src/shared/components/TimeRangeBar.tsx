import { defineComponent, computed } from 'vue'
import { NButton, NSwitch, NText, NSelect, NCard } from 'naive-ui'
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
          <div class="time-range-bar__primary">
            <label class="time-range-bar__field">
              <span class="time-range-bar__label">时间范围</span>
              <NSelect
                class="time-range-bar__select time-range-bar__select--range"
                value={props.value}
                options={localizedOptions.value}
                disabled={props.disabled}
                onUpdateValue={(value: TimeRangeKey) => emit('update:value', value)}
              />
            </label>
          </div>

          <div class="time-range-bar__secondary">
            <label class="time-range-bar__live-toggle">
              <span class="time-range-bar__label">实时模式</span>
              <NSwitch
                value={props.live}
                disabled={props.disabled}
                onUpdateValue={(value: boolean) => emit('update:live', value)}
              />
            </label>
            {props.autoRefreshOptions.length ? (
              <label class="time-range-bar__field time-range-bar__field--refresh">
                <span class="time-range-bar__label">自动刷新</span>
                <NSelect
                  class="time-range-bar__select time-range-bar__select--refresh"
                  value={props.autoRefreshValue}
                  options={props.autoRefreshOptions}
                  disabled={props.disabled || !props.live}
                  onUpdateValue={(value: string) => emit('update:autoRefresh', value)}
                />
              </label>
            ) : null}
            <NButton
              class="time-range-bar__refresh-button"
              size="small"
              secondary
              type="primary"
              onClick={() => emit('refresh')}
              disabled={props.disabled}>
              刷新时间
            </NButton>
          </div>

          {props.autoRefreshOptions.length && props.autoRefreshHint ? (
            <NText class="time-range-bar__hint" depth={3}>
              {props.autoRefreshHint}
            </NText>
          ) : null}
        </div>
      </NCard>
    )
  }
})
