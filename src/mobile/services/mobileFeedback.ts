import {
  closeToast,
  showConfirmDialog,
  showFailToast,
  showLoadingToast,
  showSuccessToast,
  showToast,
  type DialogOptions,
  type ToastOptions,
  type ToastWrapperInstance
} from 'vant'

export interface MobileFeedbackAdapter {
  success: (message: string | ToastOptions) => ToastWrapperInstance
  error: (message: string | ToastOptions) => ToastWrapperInstance
  warning: (message: string | ToastOptions) => ToastWrapperInstance
  info: (message: string | ToastOptions) => ToastWrapperInstance
  loading: (message?: string | ToastOptions) => ToastWrapperInstance
  close: () => void
  confirm: (options: DialogOptions) => Promise<unknown>
}

export const mobileFeedback: MobileFeedbackAdapter = {
  success: (message) => showSuccessToast(message),
  error: (message) => showFailToast(message),
  warning: (message) => showToast(typeof message === 'string' ? { message, type: 'text' } : message),
  info: (message) => showToast(typeof message === 'string' ? { message, type: 'text' } : message),
  loading: (message = '加载中...') => showLoadingToast(message),
  close: () => closeToast(),
  confirm: (options) => showConfirmDialog(options)
}

export const { success, error, warning, info, loading, close, confirm } = mobileFeedback

export default mobileFeedback
