import {
  p as e,
  $ as a,
  ba as t,
  a0 as o,
  a2 as l,
  a1 as s,
  dR as i,
  a3 as r,
  c0 as n,
  cC as c,
  w as u,
  cd as d,
  ar as _,
  dS as m,
  dT as p,
  dU as v,
  ac as f,
  dV as b,
  aR as g,
  dE as h,
  ai as x
} from './invariable-DewVS0br.js'
import { q as k, b as y, D as C, t as S } from './index-DFkcx8xz.js'
function z(e) {
  return 'function' == typeof e || ('[object Object]' === Object.prototype.toString.call(e) && !x(e))
}
const M = 'starlight-sidebar-order',
  j = 'starlight-sidebar-mode',
  O = e({
    name: 'HomeLeft',
    setup() {
      const e = a(),
        x = t(),
        O = o(C),
        I = o(!1),
        w = o(null),
        R = o(null),
        E = o(0)
      let H = null
      const J = localStorage.getItem(j),
        N = o(J || 'icon-text'),
        q = k().filter((e) => {
          var a
          return 'admin' !== e.group || 'billing' === e.key || Boolean(null == (a = y()) ? void 0 : a.isAdmin)
        }),
        A = o(
          (() => {
            try {
              const e = localStorage.getItem(M)
              if (e) {
                const a = JSON.parse(e),
                  t = new Map(q.map((e) => [e.key, e])),
                  o = []
                for (const e of a) {
                  const a = t.get(e)
                  a && (o.push(a), t.delete(e))
                }
                for (const e of t.values()) o.push(e)
                return o
              }
            } catch (e) {}
            return [...q]
          })()
        )
      l(
        () => x.fullPath,
        () => {
          O.value = S(x.path, x.meta)
        },
        { immediate: !0 }
      )
      const B = s(() => A.value.slice(0, E.value)),
        D = s(() => A.value.slice(E.value)),
        L = () => {
          const e = w.value
          if (!e) return
          const a = 'icon' === N.value ? 48 : 44,
            t = e.clientHeight
          if (t <= 0) return void (E.value = A.value.length)
          const o = A.value.length
          if (o <= Math.max(0, Math.floor((t + 4) / 44))) return void (E.value = o)
          const l = Math.max(0, Math.floor((t - a + 4) / 44))
          E.value = Math.min(o, l)
        },
        P = (a) => {
          I.value || ((O.value = a.key), e.push(a.route))
        }
      i(R, A, {
        animation: 200,
        ghostClass: 'ghost-item',
        chosenClass: 'chosen-item',
        disabled: !I.value,
        onEnd: function () {
          localStorage.setItem(M, JSON.stringify(A.value.map((e) => e.key))), n(L)
        }
      })
      const T = () => {
          ;(N.value = 'icon' === N.value ? 'icon-text' : 'icon'), localStorage.setItem(j, N.value), n(L)
        },
        U = () => {
          ;(I.value = !I.value), n(L)
        }
      r(() => {
        n(() => {
          L(), w.value && ((H = new ResizeObserver(() => L())), H.observe(w.value))
        })
      }),
        c(() => {
          null == H || H.disconnect()
        }),
        l(A, () => n(L), { deep: !0 }),
        l(N, () => n(L))
      const V = (e, a = !1) => {
        let t
        const o = O.value === e.key
        if ('icon' === N.value) {
          let t
          const l = u(
            'div',
            {
              class: ['sidebar-item', 'sidebar-item--icon', o ? 'is-active' : '', a ? 'sidebar-item--more' : ''],
              onClick: () => P(e)
            },
            [u(_, { size: 22, class: 'sidebar-item__icon' }, z((t = g(e.icon))) ? t : { default: () => [t] })]
          )
          return a
            ? l
            : u(
                h,
                { placement: 'right', trigger: 'hover' },
                { trigger: () => u('div', { key: e.key }, [l]), default: () => e.label }
              )
        }
        return u(
          'div',
          { key: e.key, class: ['sidebar-item', 'sidebar-item--text', o ? 'is-active' : ''], onClick: () => P(e) },
          [
            I.value && u(_, { size: 16, class: 'sidebar-item__drag' }, { default: () => [u(m, null, null)] }),
            u(_, { size: 20, class: 'sidebar-item__icon' }, z((t = g(e.icon))) ? t : { default: () => [t] }),
            u('span', { class: 'sidebar-item__label' }, [e.label])
          ]
        )
      }
      return () => {
        const e = 'icon' === N.value
        return u('div', { class: ['app-home__left', e ? 'app-home__left--icon' : 'app-home__left--text'] }, [
          u(
            'div',
            { ref: w, class: ['app-home__left__content-shell', e ? 'app-home__left__content-shell--icon' : ''] },
            [
              u('div', { ref: R, class: ['app-home__left__list', e ? 'app-home__left__list--icon' : ''] }, [
                B.value.map((e) => V(e))
              ]),
              D.value.length > 0 &&
                u(
                  'div',
                  { class: ['app-home__left__more', e ? 'app-home__left__more--icon' : 'app-home__left__more--text'] },
                  [
                    u(
                      d,
                      {
                        trigger: 'hover',
                        placement: e ? 'right' : 'right-start',
                        style: { padding: '8px', backgroundColor: 'var(--color-bg-5)' }
                      },
                      {
                        trigger: () =>
                          (() => {
                            const e = 'icon' === N.value
                            return u(
                              'div',
                              {
                                class: [
                                  'sidebar-more-trigger',
                                  e ? 'sidebar-more-trigger--icon' : 'sidebar-more-trigger--text'
                                ]
                              },
                              [
                                u(
                                  _,
                                  { size: e ? 22 : 18, class: e ? '' : 'sidebar-more-trigger__icon' },
                                  { default: () => [u(b, null, null)] }
                                ),
                                !e && u('span', { class: 'sidebar-more-trigger__label' }, [f('更多')])
                              ]
                            )
                          })(),
                        default: () =>
                          u(
                            'div',
                            {
                              class: [
                                'sidebar-more-popover',
                                e ? 'sidebar-more-popover--icon' : 'sidebar-more-popover--text'
                              ]
                            },
                            [D.value.map((e) => V(e, !0))]
                          )
                      }
                    )
                  ]
                )
            ]
          ),
          u(
            'div',
            { class: ['app-home__left__footer', e ? 'app-home__left__footer--icon' : 'app-home__left__footer--text'] },
            [
              u(
                'div',
                {
                  class: ['sidebar-footer-action', e ? 'sidebar-footer-action--icon' : 'sidebar-footer-action--text'],
                  onClick: U
                },
                [
                  u(_, { size: 18, class: 'sidebar-footer-action__icon' }, { default: () => [u(m, null, null)] }),
                  !e && u('span', { class: 'sidebar-footer-action__label' }, [I.value ? '完成排序' : '自定义排序'])
                ]
              ),
              u(
                'div',
                {
                  class: ['sidebar-footer-action', e ? 'sidebar-footer-action--icon' : 'sidebar-footer-action--text'],
                  onClick: T
                },
                [
                  u(
                    _,
                    { size: 18, class: 'sidebar-footer-action__icon' },
                    { default: () => [u(e ? p : v, null, null)] }
                  ),
                  !e && u('span', { class: 'sidebar-footer-action__label' }, [f('收起')])
                ]
              )
            ]
          )
        ])
      }
    }
  })
export { O as default }
