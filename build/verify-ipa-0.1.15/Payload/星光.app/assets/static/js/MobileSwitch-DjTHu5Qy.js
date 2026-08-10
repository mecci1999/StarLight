import { p as e, w as a, bV as o } from './invariable-DewVS0br.js'
const l = e({
  name: 'MobileSwitch',
  props: {
    modelValue: { type: Boolean, default: !1 },
    disabled: { type: Boolean, default: !1 },
    loading: { type: Boolean, default: !1 },
    size: { type: [String, Number], default: '' }
  },
  emits: ['update:modelValue'],
  setup(e, { emit: l }) {
    const d = (e) => {
      l('update:modelValue', e)
    }
    return () =>
      a(
        o,
        {
          modelValue: e.modelValue,
          onChange: d,
          disabled: e.disabled,
          loading: e.loading,
          size: e.size || void 0,
          activeColor: 'var(--color-primary-6)',
          inactiveColor: 'var(--color-border-2)'
        },
        null
      )
  }
})
export { l as M }
