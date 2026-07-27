import { Progress } from 'vant'

export interface MobileProgressProps {
  percentage?: number
  color?: string
  strokeWidth?: string | number
  trackColor?: string
  showPivot?: boolean
  text?: string
}

export default defineComponent({
  name: 'MobileProgress',
  props: {
    percentage: { type: Number, default: 0 },
    color: { type: String, default: '' },
    strokeWidth: { type: [String, Number], default: '' },
    trackColor: { type: String, default: '' },
    showPivot: { type: Boolean, default: true },
    text: { type: String, default: '' }
  },
  setup(props) {
    const pivotColor = computed(() => {
      if (props.color) return props.color
      if (props.percentage >= 80) return 'var(--color-success-6)'
      if (props.percentage >= 50) return 'var(--color-warning-6)'
      return 'var(--color-primary-6)'
    })

    return () => (
      <Progress
        percentage={props.percentage}
        color={pivotColor.value}
        strokeWidth={props.strokeWidth || undefined}
        trackColor={props.trackColor || 'var(--color-fill-2)'}
        showPivot={props.showPivot}
        pivotText={props.text || `${props.percentage}%`}
        pivotColor={pivotColor.value}
      />
    )
  }
})
