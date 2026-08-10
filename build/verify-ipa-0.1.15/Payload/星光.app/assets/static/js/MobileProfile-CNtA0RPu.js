import {
  p as e,
  r as l,
  x as a,
  a0 as i,
  a1 as o,
  w as t,
  aR as s,
  ac as r,
  $ as n,
  bk as m,
  bQ as u,
  bR as c,
  bG as v,
  bj as b,
  bS as p,
  bO as d,
  bl as f,
  ai as _
} from './invariable-DewVS0br.js'
import { M as h } from './MobileButton-BKhxhz5A.js'
import { M as U } from './MobileCard-BxmuYclQ.js'
import { M as C } from './MobileTag-ByR2jSPf.js'
import './MobileToast-CIN42EDh.js'
import { M as k } from './MobileInput-OCuvcoNh.js'
import { M as y } from './MobileSwitch-DjTHu5Qy.js'
import { M as g } from './MobileProgress-CIjA5IVj.js'
import { M as T } from './MobileAvatar-CtnV-C6Z.js'
import { M as z } from './MobileSheet-BNn0TOks.js'
import { M as j } from './MobileSelect-BOALIWQn.js'
import { M, a as w } from './MobileListItem-Dy-C6Gku.js'
import { u as A, b as N, p as V, T as x, e as I, f as S } from './index-DFkcx8xz.js'
import { u as L, e as O } from './user-CjErkjef.js'
import { A as R } from './AvatarCropUploader-DVFe0fD5.js'
import './request-BiInMBwl.js'
import './file-0gjKn95t.js'
const W = [
    { label: 'UTC-12:00', value: 'UTC-12' },
    { label: 'UTC-08:00 (太平洋)', value: 'UTC-8' },
    { label: 'UTC-05:00 (美东)', value: 'UTC-5' },
    { label: 'UTC+00:00 (伦敦)', value: 'UTC+0' },
    { label: 'UTC+01:00 (柏林)', value: 'UTC+1' },
    { label: 'UTC+03:00 (莫斯科)', value: 'UTC+3' },
    { label: 'UTC+05:30 (印度)', value: 'UTC+5.5' },
    { label: 'UTC+08:00 (北京)', value: 'UTC+8' },
    { label: 'UTC+09:00 (东京)', value: 'UTC+9' },
    { label: 'UTC+10:00 (悉尼)', value: 'UTC+10' }
  ],
  D = [
    { label: '中文', value: 'zh-CN' },
    { label: 'English', value: 'en-US' }
  ]
function P(e) {
  if (!e) return {}
  if ('string' == typeof e)
    try {
      const l = JSON.parse(e)
      return l && 'object' == typeof l && !Array.isArray(l) ? l : {}
    } catch {
      return {}
    }
  return 'object' != typeof e || Array.isArray(e) ? {} : e
}
function q(e, l) {
  const a = e[l]
  return 'string' == typeof a ? a : ''
}
function B(e) {
  if (!e) return '暂无记录'
  const l = new Date(e)
  return Number.isNaN(l.getTime()) ? e : l.toLocaleString('zh-CN', { hour12: !1 })
}
const E = e({
  name: 'MobileProfile',
  setup() {
    const e = n(),
      E = l(),
      G = A(),
      { themes: K } = a(G),
      $ = N() || {},
      H = i(!1),
      J = i(!1),
      Q = i({
        nickName: $.nickName || $.email || '',
        bio: q(P($.meta), 'bio'),
        title: q(P($.meta), 'title'),
        company: q(P($.meta), 'company'),
        location: q(P($.meta), 'location'),
        website: q(P($.meta), 'website'),
        avatarUrl: $.avatar || '',
        timezone: $.timezone || 'UTC+8',
        locale: $.locale || 'zh-CN'
      }),
      Z = o(() => ({
        nickName: $.nickName || $.email || '未登录',
        email: $.email || '',
        avatar: $.avatar || '',
        userId: $.userId || '',
        isAdmin: $.isAdmin || !1,
        role: $.isAdmin ? '管理员' : '普通用户',
        scopeLabel: S($),
        status: $.status || 'active',
        source: $.source || 'email',
        client: $.client || 'mobile',
        lastActiveAt: B($.lastActiveAt)
      })),
      F = o(() => {
        return (e = Z.value.avatar) &&
          (/^(https?:)?\/\//.test(e) || e.startsWith('/') || e.startsWith('data:') || e.startsWith('blob:'))
          ? Z.value.avatar
          : void 0
        var e
      }),
      X = o(() => Z.value.nickName || Z.value.email || '未登录'),
      Y = o(() => Z.value.email || ''),
      ee = o(() => {
        const e = [Q.value.nickName, Z.value.avatar, Q.value.bio, Q.value.title, Q.value.location]
        return Math.round((e.filter(Boolean).length / e.length) * 100)
      }),
      le = o(() => K.value.content === x.DARK),
      ae = (e) => {
        G.setTheme(e ? x.DARK : x.LIGHT)
      },
      ie = () => {
        ;(Q.value = {
          nickName: $.nickName || $.email || '',
          bio: q(P($.meta), 'bio'),
          title: q(P($.meta), 'title'),
          company: q(P($.meta), 'company'),
          location: q(P($.meta), 'location'),
          website: q(P($.meta), 'website'),
          avatarUrl: $.avatar || '',
          timezone: $.timezone || 'UTC+8',
          locale: $.locale || 'zh-CN'
        }),
          (H.value = !0)
      },
      oe = () => {
        H.value = !1
      },
      te = async () => {
        const e = $.userId
        if (!e) return void E.error('缺少用户信息，无法保存资料')
        const l = Q.value.nickName.trim()
        if (l) {
          J.value = !0
          try {
            const a = {
                ...P($.meta),
                bio: Q.value.bio.trim(),
                title: Q.value.title.trim(),
                company: Q.value.company.trim(),
                location: Q.value.location.trim(),
                website: Q.value.website.trim()
              },
              i = Q.value.avatarUrl.trim(),
              o = await L({
                userId: e,
                nickname: l,
                timezone: Q.value.timezone,
                locale: Q.value.locale,
                meta: a,
                ...(i ? { avatar: i } : {})
              }),
              t = O(o)
            V({
              ...$,
              ...t,
              nickName: t.nickName || l,
              timezone: Q.value.timezone,
              locale: Q.value.locale,
              meta: a,
              ...(i ? { avatar: i } : {})
            }),
              Object.assign($, N() || {}),
              E.success('个人资料已更新'),
              oe()
          } catch (a) {
            E.error('保存个人资料失败，请检查网络后重试')
          } finally {
            J.value = !1
          }
        } else E.error('昵称不能为空')
      },
      se = () => {
        I(), e.push('/mobile/login')
      },
      re = [
        { icon: m, label: '设置', onClick: () => e.push('/mobile/settings') },
        { icon: u, label: '关于', onClick: () => window.$message.info('星光 Odyssey · 移动端 v0.1.0') }
      ],
      ne = [
        { icon: c, label: '计费管理', onClick: () => e.push('/mobile/billing') },
        { icon: v, label: '接入管理', onClick: () => e.push('/mobile/ingestion') },
        { icon: m, label: '系统设置', onClick: () => e.push('/mobile/settings') }
      ]
    return () => {
      let e
      return t('div', { class: 'mobile-profile' }, [
        t('div', { class: 'mobile-profile__header' }, [
          t(
            T,
            { size: 72, src: F.value || '', class: 'mobile-profile__avatar', alt: X.value },
            { fallback: () => s(b, { size: 36 }) }
          ),
          t('div', { class: 'mobile-profile__name' }, [X.value]),
          t('div', { class: 'mobile-profile__email' }, [Y.value]),
          t(
            h,
            {
              size: 'small',
              'aria-label': '编辑个人资料',
              class: 'mobile-profile__edit-btn',
              onClick: ie,
              icon: () => s(p)
            },
            null
          )
        ]),
        t('div', { class: 'mobile-profile__info-cards' }, [
          t('div', { class: 'mobile-profile__info-row' }, [
            t(C, { type: Z.value.isAdmin ? 'warning' : 'info', plain: !0 }, { default: () => [Z.value.role] }),
            t(C, { type: 'success', plain: !0 }, { default: () => [Z.value.scopeLabel] })
          ]),
          t('div', { class: 'mobile-profile__completion' }, [
            t('div', { class: 'mobile-profile__completion-label' }, [
              t('span', null, [r('资料完整度')]),
              t('strong', null, [ee.value, r('%')])
            ]),
            t(
              g,
              {
                percentage: ee.value,
                color: ee.value >= 80 ? 'var(--color-success-6)' : 'var(--color-warning-6)',
                strokeWidth: 18,
                showPivot: !1
              },
              null
            )
          ]),
          t('div', { class: 'mobile-profile__meta-grid' }, [
            t('div', { class: 'mobile-profile__meta-item' }, [
              t('span', { class: 'mobile-profile__meta-label' }, [r('账号状态')]),
              t(
                C,
                { size: 'small', type: 'active' === Z.value.status ? 'success' : 'danger', plain: !0 },
                { default: () => ['active' === Z.value.status ? '正常' : Z.value.status] }
              )
            ]),
            t('div', { class: 'mobile-profile__meta-item' }, [
              t('span', { class: 'mobile-profile__meta-label' }, [r('注册来源')]),
              t('span', { class: 'mobile-profile__meta-value' }, [Z.value.source])
            ]),
            t('div', { class: 'mobile-profile__meta-item' }, [
              t('span', { class: 'mobile-profile__meta-label' }, [r('最后活跃')]),
              t('span', { class: 'mobile-profile__meta-value' }, [Z.value.lastActiveAt])
            ]),
            t('div', { class: 'mobile-profile__meta-item' }, [
              t('span', { class: 'mobile-profile__meta-label' }, [r('客户端')]),
              t('span', { class: 'mobile-profile__meta-value' }, [Z.value.client])
            ])
          ]),
          t('div', { class: 'mobile-profile__user-id' }, [
            t('span', null, [r('用户 ID')]),
            t('code', null, [Z.value.userId || '-'])
          ])
        ]),
        t(
          U,
          { size: 'small', bordered: !1, class: 'mobile-profile__card' },
          {
            default: () => [
              t(M, null, {
                default: () => [
                  t(
                    w,
                    { class: 'mobile-profile__list-item' },
                    {
                      icon: () => s(d, { size: 22, class: 'mobile-profile__menu-icon' }),
                      extra: () => t(y, { modelValue: le.value, 'onUpdate:modelValue': ae }, null),
                      default: () => t('div', { class: 'mobile-profile__menu-label' }, [r('深色模式')])
                    }
                  ),
                  re.map((e) =>
                    t(
                      w,
                      { key: e.label, class: 'mobile-profile__list-item', isLink: !0, onClick: e.onClick },
                      {
                        icon: () => s(e.icon, { size: 22, class: 'mobile-profile__menu-icon' }),
                        default: () => t('div', { class: 'mobile-profile__menu-label' }, [e.label])
                      }
                    )
                  )
                ]
              })
            ]
          }
        ),
        Z.value.isAdmin &&
          t(
            U,
            { size: 'small', bordered: !1, class: 'mobile-profile__card' },
            {
              default: () => {
                return [
                  t('div', { class: 'mobile-profile__section-title' }, [t('span', null, [r('管理')])]),
                  t(
                    M,
                    null,
                    ((l = e =
                      ne.map((e) =>
                        t(
                          w,
                          { key: e.label, class: 'mobile-profile__list-item', isLink: !0, onClick: e.onClick },
                          {
                            icon: () => s(e.icon, { size: 22, class: 'mobile-profile__menu-icon' }),
                            default: () => t('div', { class: 'mobile-profile__menu-label' }, [e.label])
                          }
                        )
                      )),
                    'function' == typeof l || ('[object Object]' === Object.prototype.toString.call(l) && !_(l))
                      ? e
                      : { default: () => [e] })
                  )
                ]
                var l
              }
            }
          ),
        t('div', { class: 'mobile-profile__actions' }, [
          t(
            h,
            {
              block: !0,
              type: 'danger',
              size: 'large',
              onClick: se,
              class: 'mobile-profile__logout-btn',
              icon: () => s(f)
            },
            { default: () => [r('退出登录')] }
          )
        ]),
        t('div', { class: 'mobile-profile__version' }, [r('星光 Odyssey v0.1.0')]),
        t(
          z,
          {
            show: H.value,
            'onUpdate:show': (e) => {
              H.value = e
            },
            title: '编辑个人资料',
            position: 'bottom',
            class: 'mobile-profile__edit-modal'
          },
          {
            default: () => [
              t('div', { class: 'mobile-profile__edit-form' }, [
                t('div', { class: 'mobile-profile__form-section' }, [
                  t('div', { class: 'mobile-profile__form-label' }, [r('头像')]),
                  t('div', { class: 'mobile-profile__avatar-upload' }, [
                    t(
                      R,
                      {
                        userId: Z.value.userId,
                        buttonLabel: '上传新头像',
                        buttonSize: 'small',
                        onUploaded: ({ avatar: e, user: l }) => {
                          ;(Q.value.avatarUrl = e), ($.avatar = e), V($)
                        }
                      },
                      {
                        default: ({ open: e, uploading: l }) =>
                          t('div', { class: 'mobile-profile__avatar-preview', onClick: e }, [
                            t(
                              T,
                              { size: 64, src: Q.value.avatarUrl || Z.value.avatar || '', alt: X.value },
                              {
                                fallback: () => t('span', { class: 'mobile-profile__avatar-text' }, [X.value.charAt(0)])
                              }
                            ),
                            t('div', { class: 'mobile-profile__avatar-overlay' }, [
                              t('span', { class: 'mobile-profile__avatar-overlay-text' }, [
                                l ? '上传中...' : '点击更换'
                              ])
                            ])
                          ])
                      }
                    )
                  ])
                ]),
                t(
                  k,
                  {
                    label: '头像链接',
                    modelValue: Q.value.avatarUrl,
                    maxlength: 512,
                    placeholder: '或直接输入头像图片 URL',
                    'onUpdate:modelValue': (e) => (Q.value.avatarUrl = e)
                  },
                  null
                ),
                t(
                  k,
                  {
                    label: '昵称',
                    modelValue: Q.value.nickName,
                    maxlength: 64,
                    placeholder: '请输入展示昵称',
                    'onUpdate:modelValue': (e) => (Q.value.nickName = e)
                  },
                  null
                ),
                t(
                  k,
                  {
                    label: '头衔',
                    modelValue: Q.value.title,
                    maxlength: 40,
                    placeholder: '例如：SRE / 产品负责人 / 独立开发者',
                    'onUpdate:modelValue': (e) => (Q.value.title = e)
                  },
                  null
                ),
                t(
                  k,
                  {
                    label: '公司 / 组织',
                    modelValue: Q.value.company,
                    maxlength: 64,
                    placeholder: '你的团队或组织',
                    'onUpdate:modelValue': (e) => (Q.value.company = e)
                  },
                  null
                ),
                t(
                  k,
                  {
                    label: '所在地',
                    modelValue: Q.value.location,
                    maxlength: 64,
                    placeholder: '例如：上海 / Singapore',
                    'onUpdate:modelValue': (e) => (Q.value.location = e)
                  },
                  null
                ),
                t(
                  k,
                  {
                    label: '个人链接',
                    modelValue: Q.value.website,
                    maxlength: 120,
                    placeholder: 'https://example.com',
                    'onUpdate:modelValue': (e) => (Q.value.website = e)
                  },
                  null
                ),
                t(
                  j,
                  {
                    title: '时区',
                    modelValue: Q.value.timezone,
                    options: W,
                    placeholder: '选择时区',
                    'onUpdate:modelValue': (e) => (Q.value.timezone = e)
                  },
                  null
                ),
                t(
                  j,
                  {
                    title: '语言',
                    modelValue: Q.value.locale,
                    options: D,
                    placeholder: '选择语言',
                    'onUpdate:modelValue': (e) => (Q.value.locale = e)
                  },
                  null
                ),
                t(
                  k,
                  {
                    label: '个人简介',
                    modelValue: Q.value.bio,
                    type: 'textarea',
                    maxlength: 160,
                    placeholder: '用一句话介绍你自己，方便团队成员快速识别。',
                    'onUpdate:modelValue': (e) => (Q.value.bio = e),
                    autosize: !0
                  },
                  null
                )
              ]),
              t('div', { class: 'mobile-profile__edit-actions' }, [
                t(h, { onClick: oe, disabled: J.value }, { default: () => [r('取消')] }),
                t(h, { type: 'primary', loading: J.value, onClick: te }, { default: () => [r('保存')] })
              ])
            ]
          }
        )
      ])
    }
  }
})
export { E as default }
