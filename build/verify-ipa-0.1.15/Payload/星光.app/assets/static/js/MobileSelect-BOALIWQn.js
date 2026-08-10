import './MobileToast-CIN42EDh.js'
import { p as e, a0 as l, a1 as a, w as t, aK as o, ac as s, bi as u, bU as d } from './invariable-DewVS0br.js'
const i = e({
  name: 'MobileSelect',
  props: {
    modelValue: { type: [String, Number], default: '' },
    options: { type: Array, default: () => [] },
    placeholder: { type: String, default: '请选择' },
    title: { type: String, default: '' },
    disabled: { type: Boolean, default: !1 },
    clearable: { type: Boolean, default: !1 }
  },
  emits: ['update:modelValue'],
  setup(e, { emit: i }) {
    const n = l(!1),
      p = a(() => {
        const l = e.options.find((l) => l.value === e.modelValue)
        return l ? l.label : ''
      }),
      r = a(() => e.options.map((e) => ({ text: e.label, value: e.value }))),
      c = () => {
        e.disabled || (n.value = !0)
      },
      m = () => {
        i('update:modelValue', '')
      },
      b = ({ selectedValues: e }) => {
        e.length > 0 && i('update:modelValue', e[0]), (n.value = !1)
      },
      v = () => {
        n.value = !1
      }
    return () =>
      t('div', { class: 'mobile-select' }, [
        t(
          o,
          {
            modelValue: p.value,
            placeholder: e.placeholder,
            readonly: !0,
            disabled: e.disabled,
            clearable: e.clearable,
            isLink: !0,
            onClick: c,
            onClear: m
          },
          { rightIcon: () => t('span', null, [s('▼')]) }
        ),
        t(
          u,
          {
            show: n.value,
            'onUpdate:show': (e) => (n.value = e),
            position: 'bottom',
            round: !0,
            safeAreaInsetBottom: !0,
            class: 'mobile-select__popup'
          },
          { default: () => [t(d, { columns: r.value, onConfirm: b, onCancel: v, title: e.title || void 0 }, null)] }
        )
      ])
  }
})
export { i as M }
