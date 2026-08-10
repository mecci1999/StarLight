import {
  p as a,
  a0 as e,
  a1 as l,
  a3 as t,
  a2 as s,
  bf as i,
  w as o,
  aR as r,
  ac as n,
  bg as b,
  bh as m,
  aT as u,
  aN as c,
  $ as p,
  aM as h,
  bi as d,
  aJ as v,
  bj as _,
  bk as w,
  ba as f,
  bl as y,
  bb as g,
  bm as T,
  a5 as W,
  bn as k
} from './invariable-DewVS0br.js'
import { b as x, d as E } from './index-DFkcx8xz.js'
import { f as j } from './alerts-CIHfuoAx.js'
import { u as R } from './useTimeStore-CVw7RN2Q.js'
import { M as A } from './MobileVantProvider-BmQB5FA8.js'
import './request-BiInMBwl.js'
const C = Symbol('drawerOpen'),
  z = Symbol('mobileAlertBadgeRefresh')
function M() {
  const a = g(C)
  return () => {
    a.value = !a.value
  }
}
const P = [
    { label: '个人资料', icon: _, path: '/mobile/profile' },
    { label: '设置', icon: w, path: '/mobile/settings' }
  ],
  S = a({
    name: 'MobileLayout',
    setup() {
      const a = p(),
        _ = f(),
        w = e(!1),
        g = e(!1),
        M = e(x() || {}),
        S = R()
      k(C, w)
      const B = l(() => M.value.nickName || M.value.email || '星光用户'),
        D = e(0),
        L = l(() => E())
      let N = 0
      const O = async () => {
        const a = ++N
        try {
          const e = await j({ scope: L.value, startTime: S.startTime, endTime: S.endTime })
          a === N && (D.value = e.filter((a) => 'active' === a.status).length)
        } catch (e) {}
      }
      k(z, O),
        t(O),
        s(() => [S.startTime, S.endTime], O),
        s(
          () => _.fullPath,
          () => {
            g.value = !1
          }
        ),
        i((a) => ((g.value = !0), !1))
      const I = [
          { label: '看板', icon: b, path: '/mobile/overview-v2' },
          { label: '实时', icon: m, path: '/mobile/realtime-monitor' },
          { label: '服务', icon: u, path: '/mobile/services-v2' },
          { label: '告警', icon: c, path: '/mobile/alerts-inbox' }
        ],
        K = (a) =>
          '/mobile/alerts-inbox' === a
            ? _.path.startsWith('/mobile/alerts') || _.path === a
            : '/mobile/services-v2' === a
              ? _.path === a ||
                _.path.startsWith('/mobile/service-detail') ||
                _.path.startsWith('/mobile/topology') ||
                _.path.startsWith('/mobile/instance-monitor')
              : '/mobile/overview-v2' === a
                ? _.path === a ||
                  _.path.startsWith('/mobile/log-center') ||
                  _.path.startsWith('/mobile/exception-analysis') ||
                  _.path.startsWith('/mobile/trace-explorer') ||
                  _.path.startsWith('/mobile/metrics-explorer')
                : _.path === a || _.path.startsWith(a + '/'),
        Y = (e) => {
          a.replace(e), (w.value = !1)
        },
        $ = () => {
          ;(w.value = !1), a.replace('/mobile/login')
        }
      return () =>
        o(A, null, {
          default: () => [
            o('div', { class: 'mobile-layout' }, [
              o('main', { class: 'mobile-layout__content' }, [
                g.value
                  ? o('section', { class: 'mobile-layout__content-error', role: 'alert' }, [
                      o('h1', null, [n('页面暂时无法显示')]),
                      o('p', null, [n('请切换到其他标签页后重试。')])
                    ])
                  : r(W, null, { default: ({ Component: a }) => (a ? r(T, null, { default: () => r(a) }) : null) })
              ]),
              o('nav', { class: 'mobile-layout__tabs' }, [
                I.map((e) =>
                  o(
                    'button',
                    {
                      key: e.path,
                      class: ['mobile-layout__tab', K(e.path) && 'mobile-layout__tab--active'],
                      'aria-label': e.label,
                      'aria-current': K(e.path) ? 'page' : void 0,
                      onClick: () => a.replace(e.path)
                    },
                    [
                      '/mobile/alerts-inbox' === e.path
                        ? o(
                            h,
                            { content: D.value || void 0, max: 99, class: 'mobile-layout__tab-badge' },
                            { default: () => [o(e.icon, { size: 24 }, null)] }
                          )
                        : o(e.icon, { size: 24 }, null),
                      o('span', { class: 'mobile-layout__tab-label' }, [e.label])
                    ]
                  )
                )
              ]),
              o(
                d,
                {
                  show: w.value,
                  'onUpdate:show': (a) => (w.value = a),
                  position: 'left',
                  class: 'mobile-drawer-popup',
                  closeable: !0,
                  closeIcon: 'cross',
                  'aria-label': '个人中心'
                },
                {
                  default: () =>
                    o('aside', { class: 'mobile-drawer', 'aria-label': '个人中心导航' }, [
                      o('header', { class: 'mobile-drawer__header' }, [
                        o('h2', { class: 'mobile-drawer__title' }, [n('个人中心')])
                      ]),
                      o('div', { class: 'mobile-drawer__content' }, [
                        o(
                          'button',
                          {
                            type: 'button',
                            class: 'mobile-drawer__user',
                            onClick: () => Y('/mobile/profile'),
                            'aria-label': `打开${B.value}的个人资料`
                          },
                          [
                            M.value.avatar
                              ? o(
                                  v,
                                  {
                                    width: '44',
                                    height: '44',
                                    fit: 'cover',
                                    src: M.value.avatar,
                                    class: 'mobile-drawer__avatar',
                                    round: !0,
                                    alt: '用户头像'
                                  },
                                  null
                                )
                              : o('span', { class: 'mobile-drawer__avatar-fallback', 'aria-hidden': 'true' }, [
                                  B.value.charAt(0)
                                ]),
                            o('span', { class: 'mobile-drawer__user-info' }, [
                              o('span', { class: 'mobile-drawer__user-name' }, [B.value]),
                              o('span', { class: 'mobile-drawer__user-email' }, [M.value.email || '未绑定'])
                            ])
                          ]
                        ),
                        o('div', { class: 'mobile-drawer__divider', role: 'separator' }, null),
                        o('div', { class: 'mobile-drawer__menu' }, [
                          P.map((a) =>
                            o(
                              'button',
                              {
                                type: 'button',
                                key: a.path,
                                class: [
                                  'mobile-drawer__menu-item',
                                  _.path === a.path && 'mobile-drawer__menu-item--active'
                                ],
                                onClick: () => Y(a.path),
                                'aria-current': _.path === a.path ? 'page' : void 0
                              },
                              [o(a.icon, { size: 20, 'aria-hidden': 'true' }, null), o('span', null, [a.label])]
                            )
                          ),
                          o(
                            'button',
                            {
                              type: 'button',
                              class: 'mobile-drawer__menu-item mobile-drawer__menu-item--danger',
                              onClick: $
                            },
                            [o(y, { size: 20, 'aria-hidden': 'true' }, null), o('span', null, [n('退出登录')])]
                          )
                        ])
                      ])
                    ])
                }
              )
            ])
          ]
        })
    }
  })
export { C as DRAWER_OPEN_KEY, z as MOBILE_ALERT_BADGE_REFRESH_KEY, S as default, M as useDrawerToggle }
