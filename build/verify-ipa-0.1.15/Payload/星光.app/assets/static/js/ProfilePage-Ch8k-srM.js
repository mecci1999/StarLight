import { P as a } from './PageHeader-OtleDOO-.js'
import { A as e, g as l, c as t, r as u } from './AvatarCropUploader-DVFe0fD5.js'
import { u as r, e as s } from './user-CjErkjef.js'
import { b as n, p as i, f as o } from './index-DFkcx8xz.js'
import {
  p as v,
  a0 as p,
  a1 as c,
  a2 as d,
  w as m,
  am as f,
  aS as _,
  ae as g,
  ag as b,
  ac as h,
  ci as k,
  cF as y,
  cG as w,
  ab as N
} from './invariable-DewVS0br.js'
import './file-0gjKn95t.js'
import './request-BiInMBwl.js'
const A = (a) => {
    if (!a) return {}
    if ('string' == typeof a)
      try {
        const e = JSON.parse(a)
        return e && 'object' == typeof e && !Array.isArray(e) ? e : {}
      } catch {
        return {}
      }
    return 'object' != typeof a || Array.isArray(a) ? {} : a
  },
  z = (a, e) => {
    const l = a[e]
    return 'string' == typeof l ? l : ''
  },
  C = (a) => {
    const e = A(a.meta)
    return {
      bio: z(e, 'bio'),
      title: z(e, 'title'),
      company: z(e, 'company'),
      location: z(e, 'location'),
      website: z(e, 'website')
    }
  },
  U = (a) => {
    if (!a) return '暂无记录'
    const e = new Date(a)
    return Number.isNaN(e.getTime()) ? a : e.toLocaleString('zh-CN', { hour12: !1 })
  },
  P = v({
    name: 'ProfilePage',
    setup() {
      const v = p(!1),
        z = p(n() || {}),
        P = p(''),
        I = C(z.value),
        j = p({
          nickName: z.value.nickName || z.value.nickname || z.value.email || '',
          timezone: z.value.timezone || 'UTC+8',
          locale: z.value.locale || 'zh-CN',
          ...I
        }),
        x = c(() => {
          return {
            userId: z.value.userId || '',
            name: z.value.nickName || z.value.nickname || z.value.email || '星光用户',
            email: z.value.email || '未绑定邮箱',
            avatar:
              ((a = z.value.avatar),
              (Boolean(
                a && (/^(https?:)?\/\//.test(a) || a.startsWith('/') || a.startsWith('data:') || a.startsWith('blob:'))
              ) &&
                z.value.avatar) ||
                ''),
            role: z.value.isAdmin ? '管理员' : '普通用户',
            scopeLabel: o(z.value),
            status: z.value.status || 'active',
            source: z.value.source || 'email',
            client: z.value.client || 'desktop',
            lastActiveAt: U(z.value.lastActiveAt)
          }
          var a
        }),
        S = c(() => Object.keys(A(z.value.devices)).length),
        $ = c(() => [j.value.nickName, P.value, j.value.bio, j.value.title, j.value.location]),
        T = c(() => Math.round(($.value.filter(Boolean).length / $.value.length) * 100)),
        W = c(() => A(z.value.meta)),
        B = (a) => {
          ;(z.value = { ...z.value, ...a }), i(z.value)
        },
        F = async () => {
          const a = x.value.userId,
            e = j.value.nickName.trim(),
            l = j.value.timezone.trim(),
            t = j.value.locale.trim(),
            u = {
              ...W.value,
              bio: j.value.bio.trim(),
              title: j.value.title.trim(),
              company: j.value.company.trim(),
              location: j.value.location.trim(),
              website: j.value.website.trim()
            }
          if (a)
            if (e) {
              v.value = !0
              try {
                const n = await r({ userId: a, nickname: e, timezone: l, locale: t, meta: u }),
                  i = s(n)
                B({ ...i, nickName: e, nickname: i.nickName || i.nickname || e, timezone: l, locale: t, meta: u }),
                  window.$message.success('个人资料已更新')
              } finally {
                v.value = !1
              }
            } else window.$message.error('昵称不能为空')
          else window.$message.error('缺少用户信息，无法保存资料')
        },
        G = () => {
          const a = C(z.value)
          ;(j.value = {
            nickName: z.value.nickName || z.value.nickname || z.value.email || '',
            timezone: z.value.timezone || 'UTC+8',
            locale: z.value.locale || 'zh-CN',
            ...a
          }),
            window.$message.success('已恢复为上次保存的资料')
        },
        L = ({ avatar: a, user: e }) => {
          const l = e.avatar || a
          B({ ...e, avatar: l })
        }
      return (
        d(
          () => x.value.avatar,
          (a) => {
            if (!a) return void (P.value = '')
            const e = l(a)
            ;(P.value = e || (t(a) ? '' : a)),
              u(a).then((e) => {
                x.value.avatar === a && (P.value = e)
              })
          },
          { immediate: !0 }
        ),
        () =>
          m('div', { class: 'profile-page' }, [
            m(a, { title: '个人资料', subtitle: '管理你的头像、展示昵称和本地化偏好。' }, null),
            m('div', { class: 'profile-page__shell' }, [
              m('aside', { class: 'profile-page__aside' }, [
                m(
                  f,
                  { bordered: !1, class: 'profile-page__identity-card' },
                  {
                    default: () => [
                      m('div', { class: 'profile-page__identity-glow' }, null),
                      m(
                        e,
                        { userId: x.value.userId, disabled: !x.value.userId, onUploaded: L },
                        {
                          default: ({ open: a, uploading: e }) =>
                            m(_, null, [
                              m(
                                'button',
                                {
                                  type: 'button',
                                  class: 'profile-page__avatar-action',
                                  onClick: a,
                                  disabled: e || !x.value.userId
                                },
                                [
                                  m('span', { class: 'profile-page__avatar-frame' }, [
                                    P.value
                                      ? m(
                                          g,
                                          {
                                            key: P.value,
                                            class: 'profile-page__avatar',
                                            size: 92,
                                            round: !0,
                                            src: P.value,
                                            renderFallback: () =>
                                              m(
                                                'span',
                                                {
                                                  class:
                                                    'profile-page__avatar profile-page__avatar-fallback profile-page__avatar-fallback--large'
                                                },
                                                [x.value.name.charAt(0)]
                                              )
                                          },
                                          null
                                        )
                                      : m(
                                          'span',
                                          {
                                            key: x.value.name,
                                            class:
                                              'profile-page__avatar profile-page__avatar-fallback profile-page__avatar-fallback--large'
                                          },
                                          [x.value.name.charAt(0)]
                                        )
                                  ]),
                                  m('span', { class: 'profile-page__avatar-label' }, [e ? '上传中…' : '更换头像'])
                                ]
                              ),
                              m('div', { class: 'profile-page__avatar-controls' }, [
                                m(
                                  b,
                                  {
                                    size: 'small',
                                    type: 'primary',
                                    secondary: !0,
                                    loading: e,
                                    disabled: !x.value.userId,
                                    onClick: a
                                  },
                                  { default: () => [h('上传新头像')] }
                                ),
                                m('p', null, [h('支持 10MB 内 PNG、JPG、WebP，保存前会自动压缩并裁剪。')])
                              ])
                            ])
                        }
                      ),
                      m('strong', null, [x.value.name]),
                      m('small', null, [j.value.title || '还没有设置个人头衔']),
                      m('em', null, [x.value.email]),
                      m('div', { class: 'profile-page__tags' }, [
                        m(k, { bordered: !1, type: 'info' }, { default: () => [x.value.role] }),
                        m(k, { bordered: !1, type: 'success' }, { default: () => [x.value.scopeLabel] })
                      ]),
                      m('div', { class: 'profile-page__completion' }, [
                        m('div', null, [m('span', null, [h('资料完整度')]), m('strong', null, [T.value, h('%')])]),
                        m('i', { style: { width: `${T.value}%` } }, null)
                      ]),
                      m('div', { class: 'profile-page__identity-meta' }, [
                        m('span', null, [h('设备 '), S.value || 1]),
                        m('span', null, [x.value.client]),
                        m('span', null, ['active' === x.value.status ? '状态正常' : x.value.status])
                      ])
                    ]
                  }
                )
              ]),
              m('main', { class: 'profile-page__content' }, [
                m('section', { class: 'profile-page__hero-card' }, [
                  m('div', null, [
                    m('span', null, [h('Account Center')]),
                    m('h2', null, [h('让这个账户更像“你”')]),
                    m('p', null, [
                      h('补充展示资料、联系方式和本地化偏好，后续告警、协作和个人空间都可以复用这些信息。')
                    ])
                  ]),
                  m('div', { class: 'profile-page__hero-stats' }, [
                    m('strong', null, [T.value, h('%')]),
                    m('em', null, [h('资料完整度')])
                  ])
                ]),
                m(
                  f,
                  { bordered: !1, class: 'profile-page__card' },
                  {
                    default: () => [
                      m('div', { class: 'profile-page__card-head' }, [
                        m('span', null, [h('Profile')]),
                        m('h2', null, [h('公开展示资料')]),
                        m('p', null, [h('这些信息会用于客户端头像菜单、个人资料卡和后续协作场景。')])
                      ]),
                      m('div', { class: 'profile-page__avatar-preview' }, [
                        m('span', { class: 'profile-page__avatar-preview-frame' }, [
                          P.value
                            ? m(
                                g,
                                {
                                  key: P.value,
                                  class: 'profile-page__avatar profile-page__avatar--preview',
                                  size: 72,
                                  round: !0,
                                  src: P.value,
                                  renderFallback: () =>
                                    m(
                                      'span',
                                      {
                                        class:
                                          'profile-page__avatar profile-page__avatar-fallback profile-page__avatar-fallback--preview'
                                      },
                                      [x.value.name.charAt(0)]
                                    )
                                },
                                null
                              )
                            : m(
                                'span',
                                {
                                  key: x.value.name,
                                  class:
                                    'profile-page__avatar profile-page__avatar-fallback profile-page__avatar-fallback--preview'
                                },
                                [x.value.name.charAt(0)]
                              )
                        ]),
                        m('div', null, [
                          m('strong', null, [h('当前头像')]),
                          m('p', null, [
                            x.value.avatar
                              ? '头像已同步到本地会话，可在右上角菜单查看。'
                              : '还没有设置头像，上传后会在这里预览。'
                          ])
                        ])
                      ]),
                      m(
                        y,
                        { labelPlacement: 'top', class: 'profile-page__form' },
                        {
                          default: () => [
                            m(
                              w,
                              { label: '昵称' },
                              {
                                default: () => [
                                  m(
                                    N,
                                    {
                                      value: j.value.nickName,
                                      maxlength: 64,
                                      placeholder: '请输入展示昵称',
                                      'onUpdate:value': (a) => (j.value.nickName = a)
                                    },
                                    null
                                  )
                                ]
                              }
                            ),
                            m(
                              w,
                              { label: '个人头衔' },
                              {
                                default: () => [
                                  m(
                                    N,
                                    {
                                      value: j.value.title,
                                      maxlength: 40,
                                      placeholder: '例如：SRE / 产品负责人 / 独立开发者',
                                      'onUpdate:value': (a) => (j.value.title = a)
                                    },
                                    null
                                  )
                                ]
                              }
                            ),
                            m(
                              w,
                              { label: '组织 / 公司' },
                              {
                                default: () => [
                                  m(
                                    N,
                                    {
                                      value: j.value.company,
                                      maxlength: 64,
                                      placeholder: '你的团队或组织',
                                      'onUpdate:value': (a) => (j.value.company = a)
                                    },
                                    null
                                  )
                                ]
                              }
                            ),
                            m(
                              w,
                              { label: '所在地' },
                              {
                                default: () => [
                                  m(
                                    N,
                                    {
                                      value: j.value.location,
                                      maxlength: 64,
                                      placeholder: '例如：上海 / Singapore',
                                      'onUpdate:value': (a) => (j.value.location = a)
                                    },
                                    null
                                  )
                                ]
                              }
                            ),
                            m(
                              w,
                              { label: '个人链接' },
                              {
                                default: () => [
                                  m(
                                    N,
                                    {
                                      value: j.value.website,
                                      maxlength: 120,
                                      placeholder: 'https://example.com',
                                      'onUpdate:value': (a) => (j.value.website = a)
                                    },
                                    null
                                  )
                                ]
                              }
                            ),
                            m(
                              w,
                              { label: '个人简介' },
                              {
                                default: () => [
                                  m(
                                    N,
                                    {
                                      value: j.value.bio,
                                      type: 'textarea',
                                      maxlength: 160,
                                      placeholder: '用一句话介绍你自己，方便团队成员快速识别。',
                                      'onUpdate:value': (a) => (j.value.bio = a)
                                    },
                                    null
                                  )
                                ]
                              }
                            )
                          ]
                        }
                      )
                    ]
                  }
                ),
                m(
                  f,
                  { bordered: !1, class: 'profile-page__card' },
                  {
                    default: () => [
                      m('div', { class: 'profile-page__card-head' }, [
                        m('span', null, [h('Preferences')]),
                        m('h2', null, [h('偏好与可达性')]),
                        m('p', null, [h('让客户端按你的地区、语言和账号状态展示更准确的信息。')])
                      ]),
                      m(
                        y,
                        { labelPlacement: 'top', class: 'profile-page__form profile-page__form--compact' },
                        {
                          default: () => [
                            m(
                              w,
                              { label: '登录邮箱' },
                              {
                                default: () => [
                                  m(
                                    N,
                                    { value: x.value.email, disabled: !0, placeholder: '邮箱暂不支持在客户端修改' },
                                    null
                                  )
                                ]
                              }
                            ),
                            m(
                              w,
                              { label: '时区' },
                              {
                                default: () => [
                                  m(
                                    N,
                                    {
                                      value: j.value.timezone,
                                      placeholder: 'UTC+8',
                                      'onUpdate:value': (a) => (j.value.timezone = a)
                                    },
                                    null
                                  )
                                ]
                              }
                            ),
                            m(
                              w,
                              { label: '语言' },
                              {
                                default: () => [
                                  m(
                                    N,
                                    {
                                      value: j.value.locale,
                                      placeholder: 'zh-CN',
                                      'onUpdate:value': (a) => (j.value.locale = a)
                                    },
                                    null
                                  )
                                ]
                              }
                            )
                          ]
                        }
                      ),
                      m('div', { class: 'profile-page__account-grid' }, [
                        m('div', null, [m('span', null, [h('用户 ID')]), m('strong', null, [x.value.userId || '-'])]),
                        m('div', null, [m('span', null, [h('注册来源')]), m('strong', null, [x.value.source])]),
                        m('div', null, [m('span', null, [h('最近活跃')]), m('strong', null, [x.value.lastActiveAt])]),
                        m('div', null, [m('span', null, [h('客户端')]), m('strong', null, [x.value.client])])
                      ]),
                      m('div', { class: 'profile-page__actions' }, [
                        m(b, { secondary: !0, disabled: v.value, onClick: G }, { default: () => [h('恢复修改')] }),
                        m(b, { type: 'primary', loading: v.value, onClick: F }, { default: () => [h('保存资料')] })
                      ])
                    ]
                  }
                )
              ])
            ])
          ])
      )
    }
  })
export { P as default }
