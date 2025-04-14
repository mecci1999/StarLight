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
    currentLable: { type: String }
  },
  setup(props) {
    const appWindow = WebviewWindow.getCurrent()
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
    const isCompatibility = computed(() => type() === 'windows' || type() === 'linux')

    // 窗口是否置顶状态
    const alwaysOnTopStatus = computed(() => {
      if (props.topWinLable === void 0) return false

      return getWindowTop(props.topWinLable)
    })

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
            if (type() === 'macos') {
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

      if (escClose.value && type() === 'windows') {
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
        await appWindow.unmaximize()
      } else {
        // 最大化
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
      appWindow.isMaximizable().then((res) => {
        state.windowMaxmized = res
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
      state.osType = type()
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    return () => (
      <div
        class={{
          'action-bar': true,
          'flex justify-end select-none': isCompatibility.value,
          'h-24px select-none w-full': !isCompatibility.value
        }}
        data-tauri-drag-region>
        {isCompatibility.value ? (
          <>
            {/* 固定在最顶层 */}
            {props.topWinLable !== void 0 ? (
              <div class="hover-box" onClick={handleAlwaysOnTop}>
                <NPopover trigger="hover">
                  {{
                    trigger: () =>
                      alwaysOnTopStatus.value ? (
                        <svg class={'size-14px color-[--color-fill-5] outline-none cursor-pointer'}>
                          <use href="#onTop" />
                        </svg>
                      ) : (
                        <svg class={'size-16px color-[--color-fill-5] outline-none cursor-pointer'}>
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
                      <svg class={'size-14px color-[--color-fill-5] outline-none cursor-pointer'}>
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
              <div class="hover-box" onClick={() => appWindow.minimize()}>
                <svg class={'size-24px color-[--color-fill-5]  opacity-66  cursor-pointer'}>
                  <use href="#maximize" />
                </svg>
              </div>
            ) : null}

            {/* 最大化 */}
            {props.maxW ? (
              <div class="hover-box" onClick={restoreWindow}>
                {!state.windowMaxmized ? (
                  <svg class={'size-18px color-[--color-fill-5]  cursor-pointer'}>
                    <use href="#rectangle-small" />
                  </svg>
                ) : (
                  <svg class={'size-16px color-[--color-fill-5] cursor-pointer'}>
                    <use href="#internal-reduction" />
                  </svg>
                )}
              </div>
            ) : null}
            {/* 关闭 */}
            {props.closeW ? (
              <div class={{ 'action-close': true, 'rounded-rt-8px': state.windowMaxmized }} onClick={handleCloseWin}>
                <svg class={'size-14px color-[--color-fill-5] cursor-pointer'}>
                  <use href="#close" />
                </svg>
              </div>
            ) : null}
          </>
        ) : null}
        {/* 是否退到托盘提示框 */}
        {!tips.value.notTips && isCompatibility.value ? (
          <NModal show={state.tipsRef.show} class={'rounded-8px'}>
            <div class="bg-[--color-bg-3] w-360px h-full p-20px box-border flex flex-col">
              <svg
                onClick={() => {
                  state.tipsRef.show = false
                }}
                class="size-12px color-[--color-text-1] ml-a cursor-pointer select-none">
                <use href="#close"></use>
              </svg>
              <NFlex vertical size={20} class={' select-none'}>
                <span class="text-16px color-[--color-text-1]">最小化还是直接退出程序?</span>
                <label class="text-14px color-[--color-text-3] flex gap-6px lh-16px items-center">
                  <NRadio
                    checked={state.tipsRef.type === CloseBxEnum.HIDE}
                    onUpdateChecked={() => {
                      state.tipsRef.type = CloseBxEnum.HIDE
                    }}
                  />
                  <span>最小化到系统托盘</span>
                </label>
                <label class="text-14px color-[--color-text-3] flex gap-6px lh-16px items-center">
                  <NRadio
                    checked={state.tipsRef.type === CloseBxEnum.CLOSE}
                    onUpdateChecked={() => {
                      state.tipsRef.type = CloseBxEnum.CLOSE
                    }}
                  />
                  <span>直接退出程序</span>
                </label>
                <label class="text-12px color-[--color-text-4] flex gap-6px justify-end items-center">
                  <NCheckbox size={'small'} checked={state.tipsRef.notTips} />
                  <span>下次不出现此提示</span>
                </label>
              </NFlex>
              <NFlex justify="end" class={'p-t-16px'}>
                <NButton onClick={handleConfirm} class="w-78px rounded-6px" type={'primary'}>
                  确定
                </NButton>
                <NButton
                  onClick={() => {
                    state.tipsRef.show = false
                  }}
                  class="w-78px rounded-6px color-[--color-text-2]"
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
