/**
 * 登录相关hooks
 */
import { type } from '@tauri-apps/plugin-os'
import { invoke } from '@tauri-apps/api/core'

const isMobile = computed(() => type() === 'android' || type() === 'ios')

export const useLogin = () => {}
