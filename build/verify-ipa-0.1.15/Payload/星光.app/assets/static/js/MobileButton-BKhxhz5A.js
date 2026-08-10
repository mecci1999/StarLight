import './MobileToast-CIN42EDh.js'
import { p as l, a1 as e, w as o, b9 as t, bB as a } from './invariable-DewVS0br.js'
const i = { primary: 'primary', default: 'default', danger: 'danger', ghost: 'default' },
  n = l({
    name: 'MobileButton',
    props: {
      type: { type: String, default: 'default' },
      size: { type: String, default: 'medium' },
      block: { type: Boolean, default: !1 },
      loading: { type: Boolean, default: !1 },
      disabled: { type: Boolean, default: !1 },
      icon: { type: Function, default: null }
    },
    emits: ['click'],
    setup(l, { slots: n, emit: s }) {
      const d = e(() => [
          'mobile-button',
          `mobile-button--${l.type}`,
          `mobile-button--${l.size}`,
          l.block && 'mobile-button--block',
          l.disabled && 'mobile-button--disabled',
          l.loading && 'mobile-button--loading'
        ]),
        u = (e) => {
          l.loading || l.disabled || s('click', e)
        }
      return () =>
        o(
          t,
          {
            type: i[l.type],
            size: 'medium' === l.size ? 'normal' : 'small' === l.size ? 'small' : 'large',
            block: l.block,
            loading: l.loading,
            disabled: l.disabled,
            class: d.value,
            onClick: u
          },
          {
            default: () => {
              var l
              return null == (l = n.default) ? void 0 : l.call(n)
            },
            icon: () => (l.icon ? o('span', { class: 'mobile-button__icon' }, [l.icon()]) : null),
            loading: () => o(a, { class: 'mobile-button__loading', size: '18px', color: 'currentColor' }, null)
          }
        )
    }
  })
export { n as M }
