import { Field, Popup, Picker, type PickerOption } from 'vant'
import './MobileUI.scss'

export interface MobileSelectOption {
  label: string
  value: string | number
}

export interface MobileSelectProps {
  modelValue?: string | number
  options?: MobileSelectOption[]
  placeholder?: string
  title?: string
  disabled?: boolean
  clearable?: boolean
}

export default defineComponent({
  name: 'MobileSelect',
  props: {
    modelValue: { type: [String, Number], default: '' },
    options: { type: Array as PropType<MobileSelectOption[]>, default: () => [] },
    placeholder: { type: String, default: '请选择' },
    title: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    clearable: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const showPicker = ref(false)
    const selectedLabel = computed(() => {
      const opt = props.options.find((o) => o.value === props.modelValue)
      return opt ? opt.label : ''
    })

    const pickerColumns = computed<PickerOption[]>(() => props.options.map((o) => ({ text: o.label, value: o.value })))

    const handleFieldClick = () => {
      if (!props.disabled) {
        showPicker.value = true
      }
    }

    const handleClear = () => {
      emit('update:modelValue', '')
    }

    const handleConfirm = ({ selectedValues }: { selectedValues: (string | number)[] }) => {
      if (selectedValues.length > 0) {
        emit('update:modelValue', selectedValues[0])
      }
      showPicker.value = false
    }

    const handleCancel = () => {
      showPicker.value = false
    }

    return () => (
      <div class="mobile-select">
        <Field
          modelValue={selectedLabel.value}
          placeholder={props.placeholder}
          readonly
          disabled={props.disabled}
          clearable={props.clearable}
          isLink
          onClick={handleFieldClick}
          onClear={handleClear}
          v-slots={{
            rightIcon: () => <span>▼</span>
          }}
        />
        <Popup
          show={showPicker.value}
          onUpdate:show={(v: boolean) => (showPicker.value = v)}
          position="bottom"
          round
          safeAreaInsetBottom
          class="mobile-select__popup">
          <Picker
            columns={pickerColumns.value}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            title={props.title || undefined}
          />
        </Popup>
      </div>
    )
  }
})
