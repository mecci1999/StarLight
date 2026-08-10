import { p as a, a3 as i, ah as s, w as d, ac as t } from './invariable-DewVS0br.js'
const n = a({
  name: 'TrayWindow',
  setup: () => (
    i(async () => {
      const a = s()
      await a.hide()
    }),
    () =>
      d('div', { class: 'tray-window' }, [
        d('div', { class: 'tray-window__item' }, [t('打开主界面')]),
        d('div', { class: 'tray-window__divider' }, null),
        d('div', { class: 'tray-window__item tray-window__item--danger' }, [t('退出')])
      ])
  )
})
export { n as default }
