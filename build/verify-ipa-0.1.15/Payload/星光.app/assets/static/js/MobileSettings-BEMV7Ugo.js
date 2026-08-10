import { M as e } from './MobileButton-BKhxhz5A.js'
import { M as s } from './MobileCard-BxmuYclQ.js'
import './MobileToast-CIN42EDh.js'
import { M as l } from './MobileSwitch-DjTHu5Qy.js'
import {
  p as t,
  w as i,
  bM as a,
  bN as o,
  ai as n,
  a0 as d,
  a1 as m,
  ac as r,
  bO as c,
  bP as u,
  b2 as b,
  aR as g
} from './invariable-DewVS0br.js'
import { M as _ } from './MobileSheet-BNn0TOks.js'
import { M as p, a as v } from './MobileListItem-Dy-C6Gku.js'
import { u as f, T as h, S as y } from './index-DFkcx8xz.js'
const w = t({
    name: 'MobileRadio',
    props: {
      modelValue: { type: [String, Number], default: '' },
      direction: { type: String, default: 'vertical' },
      disabled: { type: Boolean, default: !1 },
      options: { type: Array, default: () => [] }
    },
    emits: ['update:modelValue'],
    setup(e, { emit: s }) {
      const l = (e) => {
        s('update:modelValue', e)
      }
      return () => {
        let s
        return i(
          a,
          { modelValue: e.modelValue, onChange: l, direction: e.direction, disabled: e.disabled },
          'function' ==
            typeof (t = s =
              e.options.map((e) =>
                i(
                  o,
                  { key: String(e.value), name: e.value, checkedColor: 'var(--color-primary-6)' },
                  { default: () => [e.label] }
                )
              )) ||
            ('[object Object]' === Object.prototype.toString.call(t) && !n(t))
            ? s
            : { default: () => [s] }
        )
        var t
      }
    }
  }),
  V = [
    { key: 'appearance', title: '外观', icon: c },
    { key: 'preferences', title: '偏好', icon: u },
    { key: 'login', title: '登录', icon: u },
    { key: 'about', title: '关于', icon: u },
    { key: 'reset', title: '重置', icon: b }
  ],
  k = t({
    name: 'MobileSettings',
    setup() {
      const t = f(),
        a = d(!1),
        o = m(() => (t.themes.pattern, h.OS, t.themes.content === h.DARK ? '深色' : '浅色')),
        n = (e) => {
          t.page.shadow = e
        },
        k = (e) => {
          t.page.blur = e
        },
        M = (e) => {
          t.login.autoLogin = e
        },
        z = () => {
          a.value = !0
        },
        S = () => {
          a.value = !1
        },
        j = () => {
          t.setTheme(h.OS),
            (t.themes.versatile = 'default'),
            (t.showMode = y.ICON),
            (t.page.shadow = !0),
            (t.page.blur = !0),
            (t.page.fonts = 'PingFang'),
            S(),
            window.$message.success('所有设置已恢复默认')
        }
      return () =>
        i('div', { class: 'mobile-settings' }, [
          i('div', { class: 'mobile-settings__header' }, [
            i('h1', { class: 'mobile-settings__title' }, [r('设置')]),
            i('p', { class: 'mobile-settings__subtitle' }, [r('管理应用外观、偏好和登录选项')])
          ]),
          i(
            s,
            { size: 'small', bordered: !1, class: 'mobile-settings__nav-card' },
            {
              default: () => [
                i('div', { class: 'mobile-settings__anchors' }, [
                  V.map((e) =>
                    i(
                      'button',
                      {
                        type: 'button',
                        key: e.key,
                        class: 'mobile-settings__anchor',
                        onClick: () =>
                          ((e) => {
                            const s = document.getElementById(`mobile-settings-${e}`)
                            s && s.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          })(e.key)
                      },
                      [g(e.icon, { size: 18 }), i('span', null, [e.title])]
                    )
                  )
                ])
              ]
            }
          ),
          i('div', { id: 'mobile-settings-appearance' }, [
            i(
              s,
              { size: 'small', bordered: !1, class: 'mobile-settings__section-card' },
              {
                default: () => [
                  i('div', { class: 'mobile-settings__section-header' }, [
                    g(c, { size: 20 }),
                    i('span', null, [r('外观')])
                  ]),
                  i(
                    p,
                    { class: 'mobile-settings__list' },
                    {
                      default: () => [
                        i(
                          v,
                          { class: 'mobile-settings__list-item' },
                          {
                            default: () => [
                              i('div', { class: 'mobile-settings__field' }, [
                                i('div', { class: 'mobile-settings__field-label' }, [
                                  i('span', null, [r('主题模式')]),
                                  t.themes.pattern === h.OS && i('small', null, [r('跟随系统 · 当前'), o.value])
                                ]),
                                i(
                                  w,
                                  {
                                    modelValue: t.themes.pattern,
                                    'onUpdate:modelValue': (e) => t.setTheme(e),
                                    direction: 'horizontal',
                                    options: [
                                      { label: '浅色', value: h.LIGHT },
                                      { label: '深色', value: h.DARK },
                                      { label: '跟随系统', value: h.OS }
                                    ]
                                  },
                                  null
                                )
                              ])
                            ]
                          }
                        ),
                        i(
                          v,
                          { class: 'mobile-settings__list-item' },
                          {
                            default: () => [
                              i('div', { class: 'mobile-settings__field' }, [
                                i('div', { class: 'mobile-settings__field-label' }, [r('菜单展示')]),
                                i(
                                  w,
                                  {
                                    modelValue: t.showMode,
                                    'onUpdate:modelValue': (e) => {
                                      return (s = e), void (t.showMode = s)
                                      var s
                                    },
                                    direction: 'horizontal',
                                    options: [
                                      { label: '图标', value: y.ICON },
                                      { label: '文字', value: y.TEXT }
                                    ]
                                  },
                                  null
                                )
                              ])
                            ]
                          }
                        ),
                        i(
                          v,
                          { class: 'mobile-settings__list-item' },
                          {
                            default: () => [
                              i('div', { class: 'mobile-settings__field' }, [
                                i('div', { class: 'mobile-settings__field-label' }, [r('字体方案')]),
                                i(
                                  w,
                                  {
                                    modelValue: t.page.fonts,
                                    'onUpdate:modelValue': (e) => {
                                      return (s = e), void (t.page.fonts = s)
                                      var s
                                    },
                                    direction: 'horizontal',
                                    options: [
                                      { label: '苹方', value: 'PingFang' },
                                      { label: '系统', value: 'System' }
                                    ]
                                  },
                                  null
                                )
                              ])
                            ]
                          }
                        ),
                        i(
                          v,
                          { class: 'mobile-settings__list-item' },
                          {
                            default: () => [
                              i('div', { class: 'mobile-settings__toggle-row' }, [
                                i('div', { class: 'mobile-settings__toggle-text' }, [
                                  i('strong', null, [r('卡片阴影')]),
                                  i('span', null, [r('提升层级识别')])
                                ]),
                                i(l, { modelValue: t.page.shadow, 'onUpdate:modelValue': n }, null)
                              ])
                            ]
                          }
                        ),
                        i(
                          v,
                          { class: 'mobile-settings__list-item' },
                          {
                            default: () => [
                              i('div', { class: 'mobile-settings__toggle-row' }, [
                                i('div', { class: 'mobile-settings__toggle-text' }, [
                                  i('strong', null, [r('背景模糊')]),
                                  i('span', null, [r('浮窗质感更接近桌面客户端')])
                                ]),
                                i(l, { modelValue: t.page.blur, 'onUpdate:modelValue': k }, null)
                              ])
                            ]
                          }
                        )
                      ]
                    }
                  )
                ]
              }
            )
          ]),
          i('div', { id: 'mobile-settings-preferences' }, [
            i(
              s,
              { size: 'small', bordered: !1, class: 'mobile-settings__section-card' },
              {
                default: () => [
                  i('div', { class: 'mobile-settings__section-header' }, [
                    g(u, { size: 20 }),
                    i('span', null, [r('偏好')])
                  ]),
                  i(
                    p,
                    { class: 'mobile-settings__list' },
                    {
                      default: () => [
                        i(
                          v,
                          { class: 'mobile-settings__list-item' },
                          {
                            default: () => [
                              i('div', { class: 'mobile-settings__placeholder-row' }, [
                                i('strong', null, [r('语言')]),
                                i('span', null, [r('开发中')])
                              ])
                            ]
                          }
                        ),
                        i(
                          v,
                          { class: 'mobile-settings__list-item' },
                          {
                            default: () => [
                              i('div', { class: 'mobile-settings__placeholder-row' }, [
                                i('strong', null, [r('时区')]),
                                i('span', null, [r('开发中')])
                              ])
                            ]
                          }
                        )
                      ]
                    }
                  )
                ]
              }
            )
          ]),
          i('div', { id: 'mobile-settings-login' }, [
            i(
              s,
              { size: 'small', bordered: !1, class: 'mobile-settings__section-card' },
              {
                default: () => [
                  i('div', { class: 'mobile-settings__section-header' }, [
                    g(u, { size: 20 }),
                    i('span', null, [r('登录')])
                  ]),
                  i(
                    p,
                    { class: 'mobile-settings__list' },
                    {
                      default: () => [
                        i(
                          v,
                          { class: 'mobile-settings__list-item' },
                          {
                            default: () => [
                              i('div', { class: 'mobile-settings__toggle-row' }, [
                                i('div', { class: 'mobile-settings__toggle-text' }, [
                                  i('strong', null, [r('自动登录')]),
                                  i('span', null, [r('启动后复用本地登录状态')])
                                ]),
                                i(l, { modelValue: t.login.autoLogin, 'onUpdate:modelValue': M }, null)
                              ])
                            ]
                          }
                        )
                      ]
                    }
                  )
                ]
              }
            )
          ]),
          i('div', { id: 'mobile-settings-about' }, [
            i(
              s,
              { size: 'small', bordered: !1, class: 'mobile-settings__section-card' },
              {
                default: () => [
                  i('div', { class: 'mobile-settings__section-header' }, [
                    g(u, { size: 20 }),
                    i('span', null, [r('关于')])
                  ]),
                  i(
                    p,
                    { class: 'mobile-settings__list' },
                    {
                      default: () => [
                        i(
                          v,
                          { class: 'mobile-settings__list-item' },
                          {
                            default: () => [
                              i('div', { class: 'mobile-settings__placeholder-row' }, [
                                i('strong', null, [r('应用版本')]),
                                i('span', null, [r('星光 Odyssey v0.1.0')])
                              ])
                            ]
                          }
                        )
                      ]
                    }
                  )
                ]
              }
            )
          ]),
          i('div', { id: 'mobile-settings-reset' }, [
            i(
              s,
              { size: 'small', bordered: !1, class: 'mobile-settings__section-card' },
              {
                default: () => [
                  i('div', { class: 'mobile-settings__section-header' }, [
                    g(b, { size: 20 }),
                    i('span', null, [r('重置')])
                  ]),
                  i('div', { class: 'mobile-settings__reset-area' }, [
                    i('p', { class: 'mobile-settings__reset-desc' }, [r('将所有设置恢复为默认值')]),
                    i(e, { type: 'danger', block: !0, onClick: z }, { default: () => [r('恢复默认设置')] })
                  ])
                ]
              }
            )
          ]),
          i(
            _,
            {
              show: a.value,
              'onUpdate:show': (e) => {
                a.value = e
              },
              position: 'bottom'
            },
            {
              default: () => [
                i('div', { class: 'mobile-settings__reset-sheet' }, [
                  i('h3', null, [r('确认重置')]),
                  i('p', null, [r('此操作将把所有设置恢复为默认值，包括主题、字体、菜单展示等。确定要继续吗？')]),
                  i('div', { class: 'mobile-settings__reset-actions' }, [
                    i(e, { type: 'danger', block: !0, onClick: j }, { default: () => [r('确认重置')] }),
                    i(e, { type: 'ghost', block: !0, onClick: S }, { default: () => [r('取消')] })
                  ])
                ])
              ]
            }
          )
        ])
    }
  })
export { k as default }
