import { Field } from 'vant'
import type { FieldType, FieldAutosizeConfig } from 'vant'
import type { VNode } from 'vue'
import './MobileUI.scss'

export interface MobileInputProps {
  modelValue?: string | number
  label?: string
  placeholder?: string
  type?: FieldType
  maxlength?: string | number
  clearable?: boolean
  readonly?: boolean
  disabled?: boolean
  error?: boolean
  errorMessage?: string
  leftIcon?: () => VNode
  rightIcon?: () => VNode
  autosize?: boolean | FieldAutosizeConfig
  rows?: string | number
}

export default defineComponent({
  name: 'MobileInput',
  props: {
    modelValue: { type: [String, Number], default: '' },
    label: { type: String, default: '' },
    placeholder: { type: String, default: '请输入' },
    type: { type: String as PropType<FieldType>, default: 'text' },
    maxlength: { type: [String, Number], default: '' },
    clearable: { type: Boolean, default: true },
    readonly: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    error: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
    leftIcon: { type: Function as PropType<() => VNode>, default: null },
    rightIcon: { type: Function as PropType<() => VNode>, default: null },
    autosize: { type: [Boolean, Object] as PropType<boolean | FieldAutosizeConfig>, default: false },
    rows: { type: [String, Number], default: '' }
  },
  emits: ['update:modelValue', 'enter'],
  setup(props, { emit }) {
    const classNames = computed(() => ['mobile-input', props.error && 'mobile-input--error'])

    const handleUpdate = (value: string | number) => {
      emit('update:modelValue', value)
    }

    const handleEnter = () => {
      emit('enter')
    }

    return () => (
      <div class={classNames.value}>
        <Field
          modelValue={props.modelValue}
          onUpdate:modelValue={handleUpdate}
          label={props.label}
          placeholder={props.placeholder}
          type={props.type}
          maxlength={props.maxlength}
          clearable={props.clearable}
          readonly={props.readonly}
          disabled={props.disabled}
          error={props.error}
          autosize={props.autosize}
          rows={props.rows}
          onKeypress={(e: KeyboardEvent) => {
            if (e.key === 'Enter') handleEnter()
          }}
          v-slots={{
            leftIcon: typeof props.leftIcon === 'function' ? () => props.leftIcon() : undefined,
            button: typeof props.rightIcon === 'function' ? () => props.rightIcon() : undefined
          }}
        />
        {props.errorMessage && <div class="mobile-input__error-message">{props.errorMessage}</div>}
      </div>
    )
  }
})
