import './MobileToast-CIN42EDh.js'
import { p as a, a1 as e, w as s } from './invariable-DewVS0br.js'
const l = a({
  name: 'MobileGrid',
  props: { cols: { type: Number, default: 2 }, gap: { type: String, default: 'var(--spacing-3)' } },
  setup(a, { slots: l }) {
    const r = e(() => ({ gridTemplateColumns: `repeat(${a.cols}, 1fr)`, gap: a.gap }))
    return () => {
      var a
      return s('div', { class: 'mobile-grid', style: r.value }, [null == (a = l.default) ? void 0 : a.call(l)])
    }
  }
})
export { l as M }
