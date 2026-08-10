import {
  p as l,
  a0 as e,
  a3 as a,
  X as s,
  ak as n,
  a1 as t,
  w as i,
  ag as u,
  ac as d,
  ar as g,
  df as o,
  dg as p,
  dh as c,
  di as r,
  dj as _,
  dk as v,
  am as f,
  ci as h,
  dl as b,
  dm as m,
  cK as w,
  co as y
} from './invariable-DewVS0br.js'
import { P as S } from './PageHeader-OtleDOO-.js'
import { u as C, T as U, S as V, C as k } from './index-DFkcx8xz.js'
const T = [
    { key: 'appearance', title: '外观与主题', description: '控制客户端整体色彩、菜单展示和视觉效果。', icon: c },
    { key: 'window', title: '窗口行为', description: '设置关闭、ESC 和托盘行为，贴合桌面客户端习惯。', icon: r },
    { key: 'login', title: '登录与启动', description: '管理自动登录和开机启动偏好。', icon: _ },
    { key: 'about', title: '关于应用', description: '查看当前安装的星光客户端版本。', icon: v }
  ],
  E = l({
    name: 'SettingsPage',
    setup() {
      const l = C(),
        c = e(null)
      a(async () => {
        try {
          s() && (c.value = await n())
        } catch {
          c.value = null
        }
      })
      const r = t(() =>
          l.themes.pattern === U.OS ? '跟随系统' : l.themes.content === U.DARK ? '深色模式' : '浅色模式'
        ),
        E = t(() => [l.page.shadow, l.page.blur, l.showMode === V.TEXT].filter(Boolean).length),
        O = () => {
          l.setTheme(U.OS),
            (l.themes.versatile = 'default'),
            (l.showMode = V.ICON),
            (l.page.shadow = !0),
            (l.page.blur = !0),
            (l.page.fonts = 'PingFang'),
            window.$message.success('界面设置已恢复默认')
        },
        z = (l) => {
          const e = l.icon
          return i('a', { class: 'settings-page__anchor', href: `#${l.key}` }, [
            i(g, { size: 18 }, { default: () => [i(e, null, null)] }),
            i('span', null, [i('strong', null, [l.title]), i('em', null, [l.description])])
          ])
        }
      return () =>
        i('div', { class: 'settings-page' }, [
          i(
            S,
            { title: '应用设置', subtitle: '管理星光客户端的显示、窗口、登录与启动偏好。' },
            { actions: () => i(u, { secondary: !0, onClick: O }, { default: () => [d('恢复界面默认')] }) }
          ),
          i('div', { class: 'settings-page__shell' }, [
            i('aside', { class: 'settings-page__sidebar' }, [
              i('div', { class: 'settings-page__profile-card' }, [
                i('div', { class: 'settings-page__profile-orb' }, [
                  i(
                    g,
                    { size: 24 },
                    { default: () => [l.themes.content === U.DARK ? i(o, null, null) : i(p, null, null)] }
                  )
                ]),
                i('div', null, [i('strong', null, [r.value]), i('span', null, [E.value, d(' 项视觉增强已启用')])])
              ]),
              i('nav', null, [T.filter((l) => 'about' !== l.key || c.value).map(z)])
            ]),
            i('main', { class: 'settings-page__content' }, [
              i('section', { id: 'appearance' }, [
                i(
                  f,
                  { bordered: !1, class: 'settings-page__card' },
                  {
                    default: () => [
                      i('div', { class: 'settings-page__card-head' }, [
                        i('div', null, [
                          i('span', null, [d('Appearance')]),
                          i('h2', null, [d('外观与主题')]),
                          i('p', null, [d('桌面监控客户端需要高信息密度，但仍要保持长时间阅读舒适。')])
                        ]),
                        i(h, { bordered: !1, type: 'info' }, { default: () => [r.value] })
                      ]),
                      i('div', { class: 'settings-page__fields' }, [
                        i('label', { class: 'settings-page__field settings-page__field--full' }, [
                          i('span', null, [d('主题模式')]),
                          i(
                            b,
                            { value: l.themes.pattern, onUpdateValue: (e) => l.setTheme(e) },
                            {
                              default: () => [
                                i(m, { value: U.LIGHT }, { default: () => [d('浅色')] }),
                                i(m, { value: U.DARK }, { default: () => [d('深色')] }),
                                i(m, { value: U.OS }, { default: () => [d('跟随系统')] })
                              ]
                            }
                          )
                        ]),
                        i('label', { class: 'settings-page__field' }, [
                          i('span', null, [d('菜单展示')]),
                          i(
                            b,
                            { value: l.showMode, onUpdateValue: (e) => (l.showMode = e) },
                            {
                              default: () => [
                                i(m, { value: V.ICON }, { default: () => [d('图标')] }),
                                i(m, { value: V.TEXT }, { default: () => [d('文字')] })
                              ]
                            }
                          )
                        ]),
                        i('label', { class: 'settings-page__field' }, [
                          i('span', null, [d('字体方案')]),
                          i(
                            b,
                            { value: l.page.fonts, onUpdateValue: (e) => (l.page.fonts = e) },
                            {
                              default: () => [
                                i(m, { value: 'PingFang' }, { default: () => [d('苹方')] }),
                                i(m, { value: 'System' }, { default: () => [d('系统')] })
                              ]
                            }
                          )
                        ]),
                        i('div', { class: 'settings-page__toggle-card' }, [
                          i('div', null, [
                            i('strong', null, [d('卡片阴影')]),
                            i('span', null, [d('提升层级识别，适合长时间看板巡检。')])
                          ]),
                          i(w, { value: l.page.shadow, onUpdateValue: (e) => (l.page.shadow = e) }, null)
                        ]),
                        i('div', { class: 'settings-page__toggle-card' }, [
                          i('div', null, [
                            i('strong', null, [d('背景模糊')]),
                            i('span', null, [d('让弹层和浮窗更接近桌面客户端质感。')])
                          ]),
                          i(w, { value: l.page.blur, onUpdateValue: (e) => (l.page.blur = e) }, null)
                        ])
                      ])
                    ]
                  }
                )
              ]),
              i('section', { id: 'window' }, [
                i(
                  f,
                  { bordered: !1, class: 'settings-page__card' },
                  {
                    default: () => [
                      i('div', { class: 'settings-page__card-head' }, [
                        i('div', null, [
                          i('span', null, [d('Window')]),
                          i('h2', null, [d('窗口行为')]),
                          i('p', null, [d('控制关闭窗口、托盘和快捷键行为，避免误关监控客户端。')])
                        ]),
                        i(g, { size: 28, class: 'settings-page__card-icon' }, { default: () => [i(y, null, null)] })
                      ]),
                      i('div', { class: 'settings-page__fields' }, [
                        i('label', { class: 'settings-page__field settings-page__field--full' }, [
                          i('span', null, [d('点击关闭按钮时')]),
                          i(
                            b,
                            { value: l.tips.type, onUpdateValue: (e) => (l.tips.type = e) },
                            {
                              default: () => [
                                i(m, { value: k.HIDE }, { default: () => [d('最小化到托盘')] }),
                                i(m, { value: k.CLOSE }, { default: () => [d('直接退出程序')] })
                              ]
                            }
                          )
                        ]),
                        i('div', { class: 'settings-page__toggle-card' }, [
                          i('div', null, [
                            i('strong', null, [d('不再显示关闭确认')]),
                            i('span', null, [d('启用后会直接按上方关闭策略执行。')])
                          ]),
                          i(w, { value: l.tips.notTips, onUpdateValue: (e) => (l.tips.notTips = e) }, null)
                        ]),
                        i('div', { class: 'settings-page__toggle-card' }, [
                          i('div', null, [
                            i('strong', null, [d('ESC 关闭窗口')]),
                            i('span', null, [d('在 Windows 客户端中使用 ESC 触发关闭逻辑。')])
                          ]),
                          i(w, { value: l.escClose, onUpdateValue: (e) => (l.escClose = e) }, null)
                        ])
                      ])
                    ]
                  }
                )
              ]),
              i('section', { id: 'login' }, [
                i(
                  f,
                  { bordered: !1, class: 'settings-page__card' },
                  {
                    default: () => [
                      i('div', { class: 'settings-page__card-head' }, [
                        i('div', null, [
                          i('span', null, [d('Login')]),
                          i('h2', null, [d('登录与启动')]),
                          i('p', null, [d('适合运维值班场景，减少重复登录与启动成本。')])
                        ]),
                        i(g, { size: 28, class: 'settings-page__card-icon' }, { default: () => [i(_, null, null)] })
                      ]),
                      i('div', { class: 'settings-page__fields settings-page__fields--single' }, [
                        i('div', { class: 'settings-page__toggle-card' }, [
                          i('div', null, [
                            i('strong', null, [d('自动登录')]),
                            i('span', null, [d('启动后尝试复用本地登录状态进入控制台。')])
                          ]),
                          i(w, { value: l.login.autoLogin, onUpdateValue: (e) => (l.login.autoLogin = e) }, null)
                        ]),
                        i('div', { class: 'settings-page__toggle-card' }, [
                          i('div', null, [
                            i('strong', null, [d('开机启动')]),
                            i('span', null, [d('随系统启动星光，便于持续监控。')])
                          ]),
                          i(w, { value: l.login.autoStartup, onUpdateValue: (e) => (l.login.autoStartup = e) }, null)
                        ])
                      ])
                    ]
                  }
                )
              ]),
              c.value &&
                i('section', { id: 'about' }, [
                  i(
                    f,
                    { bordered: !1, class: 'settings-page__card settings-page__about-card' },
                    {
                      default: () => [
                        i('div', { class: 'settings-page__card-head' }, [
                          i('div', null, [
                            i('span', null, [d('About')]),
                            i('h2', null, [d('应用信息')]),
                            i('p', null, [d('当前设备上安装的星光桌面客户端版本。')])
                          ]),
                          i(g, { size: 28, class: 'settings-page__card-icon' }, { default: () => [i(v, null, null)] })
                        ]),
                        i('div', { class: 'settings-page__about-version' }, [
                          i('span', null, [d('当前版本')]),
                          i('strong', null, [d('v'), c.value])
                        ])
                      ]
                    }
                  )
                ])
            ])
          ])
        ])
    }
  })
export { E as default }
