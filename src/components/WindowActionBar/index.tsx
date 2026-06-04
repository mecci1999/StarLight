import { useMitt } from '@/hooks/useMitt'
import { useTauriListener } from '@/hooks/useTauriListener'
import { useWindow } from '@/hooks/useWindow'
import { useAlwaysOnTopStore } from '@/store/alwaysOnTop'
import { useSettingStore } from '@/store/setting'
import { CloseBxEnum, EventEnum, MittEnum } from '@/types/enums'
import { emit } from '@tauri-apps/api/event'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { type } from '@tauri-apps/plugin-os'
import { exit } from '@tauri-apps/plugin-process'
import { NButton, NCheckbox, NFlex, NModal, NPopover, NRadio } from 'naive-ui'
import './index.scss'

export default defineComponent({
  name: 'WindowActionBar',
  props: {
    minW: { type: Boolean, default: true },
    maxW: { type: Boolean, default: true },
    closeW: { type: Boolean, default: true },
    shrink: { type: Boolean, default: false },
    shrinkStatus: { type: Boolean, default: false },
    topWinLable: { type: String },
    currentLable: { type: String },
    showSlot: { type: Boolean, default: false },
    plain: { type: Boolean, default: false }
  },
  setup(props, { slots }) {
    let appWindow: any = null
    try {
      appWindow = WebviewWindow.getCurrent()
    } catch (e) {
      console.warn('Failed to get current window:', e)
      // Mock window object for non-Tauri environments to prevent crash
      appWindow = {
        label: 'mock-window',
        listen: () => Promise.resolve(() => {}),
        setAlwaysOnTop: () => Promise.resolve(),
        minimize: () => Promise.resolve(),
        maximize: () => Promise.resolve(),
        unmaximize: () => Promise.resolve(),
        close: () => Promise.resolve(),
        hide: () => Promise.resolve(),
        isMaximizable: () => Promise.resolve(false)
      }
    }

    const { getWindowTop, setWindowTop } = useAlwaysOnTopStore()
    const { pushListeners } = useTauriListener()
    const settingStore = useSettingStore()
    const { tips, escClose } = storeToRefs(settingStore)
    const { resizeWindow } = useWindow()

    const state = reactive({
      windowMaxmized: false, // 窗口是否最大化
      osType: '', // 系统类型
      // 提示信息
      tipsRef: {
        type: tips.value.type,
        notTips: tips.value.notTips,
        show: false
      }
    })

    // 判断是兼容的系统
    const isCompatibility = computed(() => {
      try {
        return type() === 'windows' || type() === 'linux'
      } catch (error) {
        return false
      }
    })

    // 窗口是否置顶状态
    const alwaysOnTopStatus = computed(() => {
      if (props.topWinLable === void 0) return false

      return getWindowTop(props.topWinLable)
    })

    const getOsType = () => {
      try {
        return type()
      } catch (error) {
        return 'unknown'
      }
    }

    // 窗口置顶
    watchEffect(() => {
      state.tipsRef.type = tips.value.type
      if (alwaysOnTopStatus.value) {
        appWindow.setAlwaysOnTop(alwaysOnTopStatus.value as boolean)
      }

      // 监听tauri事件
      pushListeners([
        appWindow.listen(EventEnum.LOGOUT, async () => {
          // 退出账号前把窗口全部关闭
          if (appWindow.label !== 'login') {
            await nextTick()
            // 针对不同系统采用不同关闭策略
            if (getOsType() === 'macos') {
              // macos上先隐藏窗口，然后延迟关闭
              await appWindow.hide()
              setTimeout(async () => {
                await appWindow.close()
              }, 300)
            } else {
              // Windows/Linux直接关闭
              await appWindow.close()
            }
          }
        }),
        appWindow.listen(EventEnum.EXIT, async () => {
          await exit(0)
        })
      ])

      if (escClose.value && getOsType() === 'windows') {
        window.addEventListener('keydown', (e) => isEsc(e))
      } else {
        window.removeEventListener('keydown', (e) => isEsc(e))
      }
    })

    /**
     * 恢复窗口大小
     */
    const restoreWindow = async () => {
      if (state.windowMaxmized) {
        // 最小化
        state.windowMaxmized = false
        await appWindow.unmaximize()
      } else {
        // 最大化
        state.windowMaxmized = true
        await appWindow.maximize()
      }
    }

    /**
     * 收缩窗口
     */
    const shrinkWindow = async () => {
      // 使用mitt给兄弟组件更新
      useMitt.emit(MittEnum.SHRINK_WINDOW, props.shrinkStatus)
      if (props.shrinkStatus) {
        await resizeWindow('home', 900, 600)
      } else {
        await resizeWindow('home', 1080, 700)
      }
    }

    /**
     * 设置窗口置顶
     */
    const handleAlwaysOnTop = async () => {
      if (props.topWinLable !== void 0) {
        const isTop = !alwaysOnTopStatus.value
        setWindowTop(props.topWinLable, isTop)
        await appWindow.setAlwaysOnTop(isTop)
      }
    }

    /**
     * 判断当前是否为全屏
     */
    const handleResize = () => {
      appWindow.isMaximizable().then((res: boolean) => {
        // state.windowMaxmized = res
      })
    }

    /**
     * 监听是否按下ESC
     */
    const isEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseWin()
      }
    }

    /**
     * 处理关闭窗口事件
     */
    const handleCloseWin = async () => {
      if (appWindow.label === 'home') {
        if (!tips.value.notTips) {
          state.tipsRef.show = true
        } else {
          // 关闭窗口
          if (tips.value.type === CloseBxEnum.CLOSE) {
            await emit(EventEnum.EXIT)
          } else {
            // 最小化窗口
            await nextTick(() => {
              appWindow.hide()
            })
          }
        }
      } else if (appWindow.label === 'login') {
        await exit(0)
      } else {
        await emit(EventEnum.WIN_CLOSE, appWindow.label)
        await appWindow.close()
      }
    }

    /**
     * 点击确定
     */
    const handleConfirm = async () => {
      tips.value.type = state.tipsRef.type
      tips.value.notTips = state.tipsRef.notTips
      state.tipsRef.show = false
      if (tips.value.type === CloseBxEnum.CLOSE) {
        await emit(EventEnum.EXIT)
      } else {
        await nextTick(() => {
          appWindow.hide()
        })
      }
    }

    onMounted(() => {
      window.addEventListener('resize', handleResize)
      state.osType = getOsType()
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    return () => (
      <div
        class={{
          'window-action-bar action-bar': true,
          'window-action-bar--with-slot': isCompatibility.value && props.showSlot,
          'window-action-bar--controls-only': isCompatibility.value && !props.showSlot,
          'window-action-bar--fallback': !isCompatibility.value,
          'window-action-bar--plain': props.plain
        }}
        data-tauri-drag-region>
        {/* 插槽内容 */}
        {props.showSlot && slots.default ? (
          <div class="window-action-bar__slot" data-tauri-drag-region>
            {slots.default()}
          </div>
        ) : null}
        {isCompatibility.value ? (
          <>
            {/* 固定在最顶层 */}
            {props.topWinLable !== void 0 ? (
              <div class="hover-box no-drag" onClick={handleAlwaysOnTop}>
                <NPopover trigger="hover">
                  {{
                    trigger: () =>
                      alwaysOnTopStatus.value ? (
                        <svg class="window-action-bar__pin-icon window-action-bar__pin-icon--active">
                          <use href="#onTop" />
                        </svg>
                      ) : (
                        <svg class="window-action-bar__pin-icon window-action-bar__pin-icon--inactive">
                          <use href="#notonTop" />
                        </svg>
                      ),
                    default: () => (alwaysOnTopStatus.value ? <span>取消置顶</span> : <span>置顶</span>)
                  }}
                </NPopover>
              </div>
            ) : null}

            {/* 收缩窗口 */}
            {/* {props.shrink ? (
              <div class="hover-box" onClick={shrinkWindow}>
                <NPopover trigger="hover">
                  {{
                    trigger: () => (
                      <svg class="window-action-bar__shrink-icon">
                        <use href={props.shrinkStatus ? '#shrink' : '#expand'} />
                      </svg>
                    ),
                    default: () => (props.shrinkStatus ? <span>收缩</span> : <span>展开</span>)
                  }}
                </NPopover>
              </div>
            ) : null} */}

            {/* 最小化 */}
            {props.minW ? (
              <div class="window-control-btn minimize-btn no-drag" onClick={() => appWindow.minimize()}>
                <svg class="window-action-bar__control-icon">
                  <use href="#maximize" />
                </svg>
              </div>
            ) : null}

            {/* 最大化 */}
            {props.maxW ? (
              <div class="window-control-btn maximize-btn no-drag" onClick={restoreWindow}>
                {!state.windowMaxmized ? (
                  <svg class="window-action-bar__control-icon">
                    <use href="#rectangle-small" />
                  </svg>
                ) : (
                  <svg class="window-action-bar__control-icon">
                    <use href="#internal-reduction" />
                  </svg>
                )}
              </div>
            ) : null}
            {/* 关闭 */}
            {props.closeW ? (
              <div
                class={{
                  'window-control-btn close-btn no-drag': true,
                  'window-action-bar__close-btn--maximized': state.windowMaxmized
                }}
                onClick={handleCloseWin}>
                <svg class="window-action-bar__control-icon">
                  <use href="#close" />
                </svg>
              </div>
            ) : null}
          </>
        ) : null}
        {/* 是否退到托盘提示框 */}
        {!tips.value.notTips && isCompatibility.value ? (
          <NModal show={state.tipsRef.show} class="window-action-bar__modal">
            <div class="window-action-bar__modal-panel">
              <svg
                onClick={() => {
                  state.tipsRef.show = false
                }}
                class="window-action-bar__modal-close">
                <use href="#close"></use>
              </svg>
              <NFlex vertical size={20} class="window-action-bar__modal-content">
                <span class="window-action-bar__modal-title">最小化还是直接退出程序?</span>
                <label class="window-action-bar__modal-option">
                  <NRadio
                    checked={state.tipsRef.type === CloseBxEnum.HIDE}
                    onUpdateChecked={() => {
                      state.tipsRef.type = CloseBxEnum.HIDE
                    }}
                  />
                  <span>最小化到系统托盘</span>
                </label>
                <label class="window-action-bar__modal-option">
                  <NRadio
                    checked={state.tipsRef.type === CloseBxEnum.CLOSE}
                    onUpdateChecked={() => {
                      state.tipsRef.type = CloseBxEnum.CLOSE
                    }}
                  />
                  <span>直接退出程序</span>
                </label>
                <label class="window-action-bar__modal-option window-action-bar__modal-option--subtle">
                  <NCheckbox
                    size={'small'}
                    checked={state.tipsRef.notTips}
                    onUpdateChecked={(checked: boolean) => {
                      state.tipsRef.notTips = checked
                    }}
                  />
                  <span>下次不出现此提示</span>
                </label>
              </NFlex>
              <NFlex justify="end" class="window-action-bar__modal-actions">
                <NButton onClick={handleConfirm} class="window-action-bar__modal-button" type={'primary'}>
                  确定
                </NButton>
                <NButton
                  onClick={() => {
                    state.tipsRef.show = false
                  }}
                  class="window-action-bar__modal-button window-action-bar__modal-button--secondary"
                  secondary={true}>
                  取消
                </NButton>
              </NFlex>
            </div>
          </NModal>
        ) : null}
      </div>
    )
  }
})
