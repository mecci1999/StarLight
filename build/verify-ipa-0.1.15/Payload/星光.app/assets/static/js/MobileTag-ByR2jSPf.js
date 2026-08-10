import './MobileToast-CIN42EDh.js'
import { p as l, a1 as a, w as e, ac as o } from './invariable-DewVS0br.js'
const t = l({
  name: 'MobileTag',
  props: {
    type: { type: String, default: 'default' },
    size: { type: String, default: 'medium' },
    plain: { type: Boolean, default: !1 },
    round: { type: Boolean, default: !1 },
    closable: { type: Boolean, default: !1 },
    onClick: { type: Function, default: null }
  },
  emits: ['close'],
  setup(l, { slots: t, emit: s }) {
    const i = a(() => [
        'mobile-tag',
        `mobile-tag--${l.type}`,
        `mobile-tag--${l.size}`,
        l.plain && 'mobile-tag--plain',
        l.round && 'mobile-tag--round',
        l.closable && 'mobile-tag--closable'
      ]),
      n = (l) => {
        l.stopPropagation(), s('close')
      },
      p = (a) => {
        var e
        null == (e = l.onClick) || e.call(l, a)
      }
    return () => {
      var a
      return e('span', { class: i.value, onClick: p }, [
        null == (a = t.default) ? void 0 : a.call(t),
        l.closable && e('span', { class: 'mobile-tag__close', onClick: n }, [o('✕')])
      ])
    }
  }
})
export { t as M }
