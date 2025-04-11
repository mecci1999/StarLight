/**
 * 自动管理tauri Listener事件监听器的hooks
 */
import { type UnlistenFn } from '@tauri-apps/api/event'

export const useTauriListener = () => {
  const listeners: Promise<UnlistenFn>[] = []
  const instance = getCurrentInstance()

  /**
   * 添加事件监听器
   * @param listener Promise<UnlistenFn>
   */
  const addListener = (listener: Promise<UnlistenFn>) => {
    listeners.push(listener)
    return listener
  }

  /**
   * 批量添加事件监听器
   * @param listenerPromises Promise<UnlistenFn>数组
   */
  const pushListeners = (listenerPromises: Promise<UnlistenFn>[]) => {
    listeners.push(...listenerPromises)
    return listenerPromises
  }

  // 只在组件实例存在时才注册 onUnmounted 钩子
  if (instance) {
    onUnmounted(async () => {
      // 等待所有的 unlisten 函数 resolve
      const unlistenFns = await Promise.all(listeners)
      // 执行所有的 unlisten 函数
      unlistenFns.forEach((unlisten) => unlisten())
      listeners.length = 0
    })
  }

  return {
    addListener,
    pushListeners,
    cleanup: async () => {
      const unlistenFns = await Promise.all(listeners)
      unlistenFns.forEach((unlisten) => unlisten())
      listeners.length = 0
    }
  }
}
