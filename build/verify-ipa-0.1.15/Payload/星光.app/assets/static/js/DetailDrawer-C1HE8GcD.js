import { p as e, w as t, cP as l, cQ as a } from './invariable-DewVS0br.js'
const o = e({
  name: 'DetailDrawer',
  props: {
    show: { type: Boolean, required: !0 },
    title: { type: String, required: !0 },
    width: { type: String, default: 'md' },
    loading: { type: Boolean, default: !1 },
    destroyOnClose: { type: Boolean, default: !1 }
  },
  emits: ['update:show', 'close'],
  setup(e, { emit: o, slots: r }) {
    const s = { sm: 480, md: 720, lg: 960, xl: 1280 }
    return () =>
      t(
        l,
        {
          show: e.show,
          width: s[e.width],
          placement: 'right',
          onUpdateShow: (e) => o('update:show', e),
          onAfterLeave: () => o('close')
        },
        {
          default: () => [
            t(
              a,
              { title: e.title, closable: !0, nativeScrollbar: !1 },
              {
                default: () => {
                  var e, t, l
                  return [
                    null == (e = r.header) ? void 0 : e.call(r),
                    null == (t = r.default) ? void 0 : t.call(r),
                    null == (l = r.footer) ? void 0 : l.call(r)
                  ]
                }
              }
            )
          ]
        }
      )
  }
})
export { o as D }
