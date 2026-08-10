import './MobileToast-CIN42EDh.js'
import { p as t, a1 as a, w as l, aJ as e } from './invariable-DewVS0br.js'
const i = t({
  name: 'MobileAvatar',
  props: {
    src: { type: String, default: '' },
    size: { type: [Number, String], default: 44 },
    alt: { type: String, default: '' },
    onClick: { type: Function, default: null }
  },
  setup(t, { slots: i }) {
    const s = a(() => {
      const a = 'number' == typeof t.size ? `${t.size}px` : t.size
      return { width: a, height: a, minWidth: a, minHeight: a }
    })
    return () => {
      var a, r, n
      return l('div', { class: 'mobile-avatar', style: s.value, onClick: t.onClick }, [
        t.src
          ? l(
              e,
              { width: s.value.width, height: s.value.height, fit: 'cover', src: t.src, round: !0, alt: t.alt },
              null
            )
          : (null == (a = i.fallback) ? void 0 : a.call(i)) ||
            l('span', { class: 'mobile-avatar__fallback' }, [
              (null == (n = null == (r = t.alt) ? void 0 : r.charAt(0)) ? void 0 : n.toUpperCase()) || '?'
            ])
      ])
    }
  }
})
export { i as M }
