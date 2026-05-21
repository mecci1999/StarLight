import { defineComponent } from 'vue'
import { NTag } from 'naive-ui'
import './ServiceHealthBadge.scss'

export type ServiceHealthStatus = 'healthy' | 'degraded' | 'critical' | 'muted' | 'unknown'

export default defineComponent({
  name: 'ServiceHealthBadge',
  props: {
    status: {
      type: String as () => ServiceHealthStatus,
      required: true
    },
    pulse: { type: Boolean, default: false },
    size: { type: String as () => 'sm' | 'md', default: 'sm' }
  },
  setup(props) {
    const getType = () => {
      switch (props.status) {
        case 'healthy':
          return 'success'
        case 'degraded':
          return 'warning'
        case 'critical':
          return 'error'
        case 'muted':
          return 'default'
        default:
          return 'default'
      }
    }

    const getLabel = () => {
      switch (props.status) {
        case 'healthy':
          return '健康'
        case 'degraded':
          return '轻微异常'
        case 'critical':
          return '严重异常'
        case 'muted':
          return '已静音'
        default:
          return '未知'
      }
    }

    return () => (
      <NTag
        type={getType() as any}
        size={props.size === 'sm' ? 'small' : 'medium'}
        bordered={false}
        class={[
          'service-health-badge',
          props.pulse ? 'service-health-badge--pulse' : '',
          'service-health-badge--compact'
        ]}>
        {getLabel()}
      </NTag>
    )
  }
})
