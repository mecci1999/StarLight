import request from '@/services/request'
import url from './url'

export const login = (data: any) => {
  return request.post(url.login, data)
}

export const verifyCode = (data: any) => {
  return request.post(url.emailVerifyCode, data)
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

export const getQRCodeStatus = (params: any) => {
  return request.get(url.getQRCodeStatus, params)
}

export const scanQRcode = (data: any) => {
  return request.post(url.scanQRcode, data)
}

export const confirmQRcode = (data: any) => {
  return request.post(url.confirmQRcode, data)
}

export const cancelQRcode = (data: any) => {
  return request.post(url.cancelQRcode, data)
}
