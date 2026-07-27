import { RadioGroup, Radio } from 'vant'

export interface MobileRadioOption {
  label: string
  value: string | number
}

export type MobileRadioDirection = 'horizontal' | 'vertical'

export interface MobileRadioProps {
  modelValue?: string | number
  direction?: MobileRadioDirection
  disabled?: boolean
  options?: MobileRadioOption[]
}

export default defineComponent({
  name: 'MobileRadio',
  props: {
    modelValue: { type: [String, Number], default: '' },
    direction: { type: String as PropType<MobileRadioDirection>, default: 'vertical' },
    disabled: { type: Boolean, default: false },
    options: { type: Array as PropType<MobileRadioOption[]>, default: () => [] }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const handleChange = (value: string | number) => {
      emit('update:modelValue', value)
    }

    return () => (
      <RadioGroup
        modelValue={props.modelValue}
        onChange={handleChange}
        direction={props.direction}
        disabled={props.disabled}>
        {props.options.map((opt) => (
          <Radio key={String(opt.value)} name={opt.value} checkedColor="var(--color-primary-6)">
            {opt.label}
          </Radio>
        ))}
      </RadioGroup>
    )
  }
})
