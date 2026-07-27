import './MobileUI.scss'

export type StatisticSize = 'small' | 'medium' | 'large'
export type TrendDirection = 'up' | 'down' | 'neutral'

export interface MobileStatisticProps {
  value?: string | number
  label?: string
  unit?: string
  color?: string
  trend?: string
  trendDirection?: TrendDirection
  size?: StatisticSize
}

export default defineComponent({
  name: 'MobileStatistic',
  props: {
    value: { type: [String, Number], default: '' },
    label: { type: String, default: '' },
    unit: { type: String, default: '' },
    color: { type: String, default: '' },
    trend: { type: String, default: '' },
    trendDirection: { type: String as PropType<TrendDirection>, default: 'neutral' },
    size: { type: String as PropType<StatisticSize>, default: 'medium' }
  },
  setup(props) {
    const classNames = computed(() => ['mobile-statistic', `mobile-statistic--${props.size}`])

    const trendIcon = computed(() => {
      if (props.trendDirection === 'up') return '↑'
      if (props.trendDirection === 'down') return '↓'
      return '→'
    })

    return () => (
      <div class={classNames.value}>
        {props.label && <div class="mobile-statistic__label">{props.label}</div>}
        <div class="mobile-statistic__value-row">
          <span class="mobile-statistic__value" style={{ color: props.color || undefined }}>
            {props.value}
          </span>
          {props.unit && <span class="mobile-statistic__unit">{props.unit}</span>}
        </div>
        {props.trend && (
          <div class={['mobile-statistic__trend', `mobile-statistic__trend--${props.trendDirection}`]}>
            <span class="mobile-statistic__trend-icon">{trendIcon.value}</span>
            <span class="mobile-statistic__trend-value">{props.trend}</span>
          </div>
        )}
      </div>
    )
  }
})
