import {
  p as a,
  a0 as t,
  a1 as e,
  a2 as l,
  w as n,
  ar as i,
  dW as s,
  dX as u,
  ba as r,
  $ as o,
  a5 as c
} from './invariable-DewVS0br.js'
const p = { key: '/home/overview', path: '/home/overview', title: '看板' },
  v = a({
    name: 'ContainerTabs',
    setup() {
      const a = r(),
        c = o(),
        v = t([]),
        h = e(() => a.fullPath),
        b = () => {
          a.fullPath !== p.path && c.push(p.path)
        },
        m = (t, e) => {
          e.stopPropagation()
          const l = v.value.findIndex((a) => a.key === t.key)
          if (l < 0) return
          if ((v.value.splice(l, 1), 0 === v.value.length && v.value.push({ ...p }), t.key !== a.fullPath)) return
          const n = v.value[l] || v.value[l - 1] || v.value[0] || p
          c.push(n.path)
        }
      return (
        l(
          () => a.fullPath,
          () => {
            var t
            if (!a.path.startsWith('/home')) return
            const e = Array.isArray(a.query.title) ? a.query.title[0] : a.query.title,
              l = String(e || (null == (t = a.meta) ? void 0 : t.title) || a.name || a.path),
              n = { key: a.fullPath, path: a.fullPath, title: l },
              i = v.value.findIndex((a) => a.key === n.key)
            i >= 0 ? (v.value[i] = n) : v.value.push(n)
          },
          { immediate: !0 }
        ),
        () =>
          n('nav', { class: 'container-tabs', 'aria-label': '已打开页面' }, [
            n('div', { class: 'container-tabs__track', role: 'tablist', 'aria-label': '已打开页面' }, [
              v.value.map((t) =>
                n(
                  'div',
                  {
                    key: t.key,
                    class: ['container-tabs__tab', t.key === h.value && 'is-active'],
                    onMouseup: (a) => {
                      return (e = t), void (1 === (l = a).button && m(e, l))
                      var e, l
                    }
                  },
                  [
                    n(
                      'button',
                      {
                        type: 'button',
                        role: 'tab',
                        'aria-selected': t.key === h.value,
                        class: 'container-tabs__item',
                        onClick: () => {
                          var e
                          ;(e = t).key !== a.fullPath && c.push(e.path)
                        }
                      },
                      [n('span', { class: 'container-tabs__title' }, [t.title])]
                    ),
                    n(
                      'button',
                      {
                        type: 'button',
                        class: 'container-tabs__close',
                        onClick: (a) => m(t, a),
                        'aria-label': `关闭${t.title}`,
                        title: `关闭 ${t.title}`
                      },
                      [n(i, { size: 13 }, { default: () => [n(s, null, null)] })]
                    )
                  ]
                )
              ),
              n(
                'button',
                {
                  type: 'button',
                  class: 'container-tabs__new',
                  onClick: b,
                  'aria-label': '打开看板',
                  title: '打开看板'
                },
                [n(i, { size: 15 }, { default: () => [n(u, null, null)] })]
              )
            ])
          ])
      )
    }
  }),
  h = a({
    name: 'HomeContainer',
    setup(a, { slots: t }) {
      const l = r(),
        i = e(() => 'micro-app-runtime' === l.name)
      return () =>
        n('section', { class: 'home-container', 'data-tauri-drag-region': !0 }, [
          n(v, null, null),
          n('main', { class: ['service-main', 'home-container__main', { 'is-micro-app-runtime': i.value }] }, [
            n(c, null, null)
          ])
        ])
    }
  })
export { h as default }
