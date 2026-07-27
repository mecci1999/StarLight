import { Search } from 'vant'
import './MobileUI.scss'

export interface MobileSearchProps {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  showAction?: boolean
}

export default defineComponent({
  name: 'MobileSearch',
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '搜索' },
    disabled: { type: Boolean, default: false },
    clearable: { type: Boolean, default: true },
    showAction: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'search', 'cancel'],
  setup(props, { emit }) {
    const handleUpdate = (value: string) => {
      emit('update:modelValue', value)
    }

    const handleSearch = (value: string) => {
      emit('search', value)
    }

    const handleCancel = () => {
      emit('cancel')
    }

    return () => (
      <div class="mobile-search">
        <Search
          modelValue={props.modelValue}
          onUpdate:modelValue={handleUpdate}
          placeholder={props.placeholder}
          disabled={props.disabled}
          clearable={props.clearable}
          showAction={props.showAction}
          onSearch={handleSearch}
          onCancel={handleCancel}
        />
      </div>
    )
  }
})
