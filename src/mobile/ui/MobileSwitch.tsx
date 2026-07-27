import { Switch } from 'vant'

export interface MobileSwitchProps {
  modelValue?: boolean
  disabled?: boolean
  loading?: boolean
  size?: string | number
}

export default defineComponent({
  name: 'MobileSwitch',
  props: {
    modelValue: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    size: { type: [String, Number], default: '' }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const handleChange = (value: boolean) => {
      emit('update:modelValue', value)
    }

    return () => (
      <Switch
        modelValue={props.modelValue}
        onChange={handleChange}
        disabled={props.disabled}
        loading={props.loading}
        size={props.size || undefined}
        activeColor="var(--color-primary-6)"
        inactiveColor="var(--color-border-2)"
      />
    )
  }
})
