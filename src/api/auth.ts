import request from '@/services/request'
import url from './url'

export const login = (data: any) => {
  return request.postWithOptions(url.login, data, { noRetry: true, suppressSuccessMessage: true, timeoutMs: 15000 })
}

export const verifyCode = (data: any, options?: { suppressSuccessMessage?: boolean }) => {
  return request.postWithOptions(url.emailVerifyCode, data, {
    noRetry: true,
    suppressErrorLog: true,
    suppressSuccessMessage: options?.suppressSuccessMessage,
    timeoutMs: 60000
  })
}

export const registerUser = (data: any) => {
  return request.post(url.registerUser, data)
}

export const forgetPassword = (data: any) => {
  return request.post(url.forgetPassword, data)
}

export const updatePassword = (data: any) => {
  return request.post(url.updatePassword, data)
}

export const refreshToken = (data: any) => {
  return request.post(url.refreshToken, data)
}

export const logout = () => {
  return request.post(url.logout, {})
}

export const getRSAKey = () => {
  return request.get(url.getRSAKey, {})
}

export const saveRSAKey = (data: any) => {
  return request.post(url.saveRSAKey, data)
}

export const getQRCodeKey = () => {
  return request.get(url.getQRCodeKey, {})
}

export type QrCodeRequest = {
  code: string
}

export const getQRCodeStatus = (params: QrCodeRequest) => {
  return request.get(url.getQRCodeStatus, params)
}

export const scanQRcode = (data: QrCodeRequest) => {
  return request.post(url.scanQRcode, data)
}

export const confirmQRcode = (data: QrCodeRequest) => {
  return request.post(url.confirmQRcode, data)
}

export const cancelQRcode = (data: QrCodeRequest) => {
  return request.post(url.cancelQRcode, data)
}
