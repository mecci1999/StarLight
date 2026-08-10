import './MobileToast-CIN42EDh.js'
import { p as l, w as t, bB as e } from './invariable-DewVS0br.js'
const a = l({
  name: 'MobileLoading',
  props: {
    loading: { type: Boolean, default: !0 },
    size: { type: [String, Number], default: '24px' },
    type: { type: String, default: 'circular' },
    color: { type: String, default: '' },
    vertical: { type: Boolean, default: !1 },
    text: { type: String, default: '' }
  },
  setup:
    (l, { slots: a }) =>
    () => {
      var o, i
      return l.loading
        ? t('div', { class: ['mobile-loading', l.vertical && 'mobile-loading--vertical'] }, [
            t(e, { size: l.size, type: l.type, color: l.color || 'var(--color-text-3)', vertical: l.vertical }, null),
            (l.text || a.default) &&
              t('span', { class: 'mobile-loading__text' }, [l.text || (null == (o = a.default) ? void 0 : o.call(a))])
          ])
        : null == (i = a.default)
          ? void 0
          : i.call(a)
    }
})
export { a as M }
