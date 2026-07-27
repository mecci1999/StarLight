import './MobileUI.scss'

export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'unknown' | 'muted'
export type StatusTagSize = 'sm' | 'md'

export interface MobileStatusTagProps {
  status?: HealthStatus
  size?: StatusTagSize
}

const STATUS_LABELS: Record<HealthStatus, string> = {
  healthy: '健康',
  degraded: '降级',
  critical: '严重',
  unknown: '未知',
  muted: '静默'
}

export default defineComponent({
  name: 'MobileStatusTag',
  props: {
    status: { type: String as PropType<HealthStatus>, default: 'unknown' },
    size: { type: String as PropType<StatusTagSize>, default: 'md' }
  },
  setup(props, { slots }) {
    const classNames = computed(() => [
      'mobile-status-tag',
      `mobile-status-tag--${props.status}`,
      `mobile-status-tag--${props.size}`
    ])

    return () => (
      <span class={classNames.value}>
        <span class="mobile-status-tag__dot" />
        <span class="mobile-status-tag__label">{slots.default?.() || STATUS_LABELS[props.status]}</span>
      </span>
    )
  }
})
