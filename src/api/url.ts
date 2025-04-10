/**
 * 请求地址
 */
import { URLEnum, VersionEnum } from '@/types/enums'

// 服务端域名
const { VITE_SERVICE_URL } = import.meta.env

// 地址前缀
const prefix = VITE_SERVICE_URL + '/api'

export default {
  // 验证模块
  registerUser: `${prefix + URLEnum.AUTH}/${VersionEnum.V1}/register`, // 使用邮箱注册用户
  emailVerifyCode: `${prefix + URLEnum.AUTH}/${VersionEnum.V1}/verifyCode`, // 邮箱验证码
  login: `${prefix + URLEnum.AUTH}/${VersionEnum.V1}/login`, // 邮箱密码登录
  logout: `${prefix + URLEnum.AUTH}/${VersionEnum.V1}/logout`, // 退出登录
  refreshToken: `${prefix + URLEnum.AUTH}/${VersionEnum.V1}/refreshToken`, // 续签
  forgetPassword: `${prefix + URLEnum.AUTH}/${VersionEnum.V1}/forgetHash`, // 忘记密码
  updatePassword: `${prefix + URLEnum.AUTH}/${VersionEnum.V1}/updateHash`, // 更新密码
  getRSAKey: `${prefix + URLEnum.AUTH}/${VersionEnum.V1}/rsa/getKey`, // 获取RSA密钥对
  saveRSAKey: `${prefix + URLEnum.AUTH}/${VersionEnum.V1}/rsa/save`, // 创建和更新RSA密钥对
  getQRCodeKey: `${prefix + URLEnum.AUTH}/${VersionEnum.V1}/qrcode/getKey`, // 获取二维码key
  getQRCodeStatus: `${prefix + URLEnum.AUTH}/${VersionEnum.V1}/qrcode/status`, // 获取二维码状态
  scanQRcode: `${prefix + URLEnum.AUTH}/${VersionEnum.V1}/qrcode/scan`, // 移动端扫描二维码
  confirmQRcode: `${prefix + URLEnum.AUTH}/${VersionEnum.V1}/qrcode/confirm`, // 移动端确认登录
  cancelQRcode: `${prefix + URLEnum.AUTH}/${VersionEnum.V1}/qrcode/cancel` // 移动端取消登录

  // 用户模块
}
