import { Checkbox } from 'vant'

export type MobileCheckboxShape = 'round' | 'square'
export type MobileCheckboxSize = 'small' | 'medium'

export interface MobileCheckboxProps {
  modelValue?: boolean
  disabled?: boolean
  label?: string
  shape?: MobileCheckboxShape
  size?: MobileCheckboxSize
}

export default defineComponent({
  name: 'MobileCheckbox',
  props: {
    modelValue: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    label: { type: String, default: '' },
    shape: { type: String as PropType<MobileCheckboxShape>, default: 'round' },
    size: { type: String as PropType<MobileCheckboxSize>, default: 'small' }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const handleModelValueUpdate = (value: boolean) => {
      emit('update:modelValue', value)
    }

    const classNames = computed(() => ['mobile-checkbox', `mobile-checkbox--${props.size}`])

    return () => (
      <Checkbox
        modelValue={props.modelValue}
        onUpdate:modelValue={handleModelValueUpdate}
        disabled={props.disabled}
        shape={props.shape}
        checkedColor="var(--color-primary-6)"
        class={classNames.value}>
        {props.label}
      </Checkbox>
    )
  }
})
