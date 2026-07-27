import { Field } from 'vant'
import type { FieldRule, FieldAutosizeConfig, FieldType } from 'vant'
import type { VNode } from 'vue'
import './MobileUI.scss'

export interface MobileFormItemProps {
  name?: string
  rules?: FieldRule[]
  label?: string
  required?: boolean
  modelValue?: string | number
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
  name: 'MobileFormItem',
  props: {
    name: { type: String, default: '' },
    rules: { type: Array as PropType<FieldRule[]>, default: () => [] },
    label: { type: String, default: '' },
    required: { type: Boolean, default: false },
    modelValue: { type: [String, Number], default: '' },
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
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const classNames = computed(() => ['mobile-form__item', props.error && 'mobile-form__item--error'])

    const handleUpdate = (value: string | number) => {
      emit('update:modelValue', value)
    }

    return () => (
      <div class={classNames.value}>
        <Field
          name={props.name}
          rules={props.rules.length > 0 ? props.rules : undefined}
          label={props.label}
          required={props.required}
          modelValue={props.modelValue}
          onUpdate:modelValue={handleUpdate}
          placeholder={props.placeholder}
          type={props.type}
          maxlength={props.maxlength}
          clearable={props.clearable}
          readonly={props.readonly}
          disabled={props.disabled}
          error={props.error}
          autosize={props.autosize}
          rows={props.rows}
          v-slots={{
            leftIcon: typeof props.leftIcon === 'function' ? () => props.leftIcon() : undefined,
            rightIcon: typeof props.rightIcon === 'function' ? () => props.rightIcon() : undefined
          }}
        />
        {props.errorMessage && <div class="mobile-form__error">{props.errorMessage}</div>}
      </div>
    )
  }
})
