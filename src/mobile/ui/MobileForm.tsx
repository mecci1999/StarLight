import { Form, Field } from 'vant'
import type { FieldRule, FieldAutosizeConfig, FieldType } from 'vant'
import './MobileUI.scss'

export interface MobileFormProps {
  onSubmit?: (values: Record<string, unknown>) => void
  onFailed?: (errorInfo: { values: Record<string, unknown>; errors: unknown[] }) => void
  scrollToError?: boolean
}

export default defineComponent({
  name: 'MobileForm',
  props: {
    onSubmit: { type: Function as PropType<(values: Record<string, unknown>) => void>, default: null },
    onFailed: {
      type: Function as PropType<(errorInfo: { values: Record<string, unknown>; errors: unknown[] }) => void>,
      default: null
    },
    scrollToError: { type: Boolean, default: true }
  },
  setup(props, { slots }) {
    const formRef = ref<InstanceType<typeof Form>>()

    const handleSubmit = (values: Record<string, unknown>) => {
      props.onSubmit?.(values)
    }

    const handleFailed = (errorInfo: { values: Record<string, unknown>; errors: unknown[] }) => {
      props.onFailed?.(errorInfo)
    }

    return () => (
      <Form
        ref={formRef}
        class="mobile-form"
        onSubmit={handleSubmit}
        onFailed={handleFailed}
        scrollToError={props.scrollToError}
        v-slots={{
          default: () => slots.default?.()
        }}
      />
    )
  }
})
