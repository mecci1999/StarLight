import type { VNode } from 'vue'
import type { TrendDirection } from './MobileStatistic'
import './MobileUI.scss'

export interface MobileMetricCardProps {
  icon?: () => VNode
  value?: string | number
  label?: string
  unit?: string
  color?: string
  trend?: string
  trendDirection?: TrendDirection
  onClick?: (event: MouseEvent) => void
}

export default defineComponent({
  name: 'MobileMetricCard',
  props: {
    icon: { type: Function as PropType<() => VNode>, default: null },
    value: { type: [String, Number], default: '' },
    label: { type: String, default: '' },
    unit: { type: String, default: '' },
    color: { type: String, default: '' },
    trend: { type: String, default: '' },
    trendDirection: { type: String as PropType<TrendDirection>, default: 'neutral' },
    onClick: { type: Function as PropType<(event: MouseEvent) => void>, default: null }
  },
  setup(props) {
    const classNames = computed(() => [
      'mobile-metric-card',
      typeof props.onClick === 'function' && 'mobile-metric-card--clickable'
    ])

    const trendIcon = computed(() => {
      if (props.trendDirection === 'up') return '↑'
      if (props.trendDirection === 'down') return '↓'
      return '→'
    })

    return () => (
      <div class={classNames.value} onClick={props.onClick}>
        <div class="mobile-metric-card__header">
          {props.icon && (
            <div
              class="mobile-metric-card__icon"
              style={{
                background: `${props.color || 'var(--color-primary-1)'}20`,
                color: props.color || 'var(--color-primary-6)'
              }}>
              {props.icon()}
            </div>
          )}
          {props.trend && (
            <div class={['mobile-metric-card__trend', `mobile-metric-card__trend--${props.trendDirection}`]}>
              <span>{trendIcon.value}</span>
              <span>{props.trend}</span>
            </div>
          )}
        </div>
        <div class="mobile-metric-card__value">
          {props.value}
          {props.unit && <span class="mobile-metric-card__unit">{props.unit}</span>}
        </div>
        {props.label && <div class="mobile-metric-card__label">{props.label}</div>}
      </div>
    )
  }
})
