/**
 * 请求接口
 */
import request from '@/services/request'
import urls from './url'
import { LoginUserReq, QrCodeResponseItem, RegisterUserReq } from '@/types/login'
import { QrCodeStatus } from '@/types/enums'
import { UserInfoType } from '../types/userInfo'
import logsApi from './logs'

const GET = <T>(url: string, params?: any, abort?: AbortController) => request.get<T>(url, params, abort)
const POST = <T>(url: string, params?: any, abort?: AbortController) => request.post<T>(url, params, abort)
const PUT = <T>(url: string, params?: any, abort?: AbortController) => request.put<T>(url, params, abort)
const DELETE = <T>(url: string, params?: any, abort?: AbortController) => request.delete<T>(url, params, abort)

export default {
  /** 邮箱密码登录 */
  login: (user: LoginUserReq, abort?: AbortController) =>
    POST<{ userId: string; userInfo?: UserInfoType }>(urls.login, user, abort),
  /** 退出登录 */
  logout: (autoLogin: boolean) => POST(urls.logout, { autoLogin }),
  /** 注册账号 */
  register: (user: RegisterUserReq, abort?: AbortController) =>
    POST<{ userId: string }>(urls.registerUser, user, abort),
  /** 获取邮箱验证码 */
  verifyCode: (params: { email: string; type: 'login' | 'register' | 'forget' | 'update' }, abort?: AbortController) =>
    POST(urls.emailVerifyCode, params, abort),
  /** 忘记密码 */
  forgetPassword: (params: { email: string; hash: string; code: string }, abort?: AbortController) =>
    POST(urls.forgetPassword, params, abort),
  /** 更新密码 */
  updatePassword: (params: { hash: string; code: string }, abort?: AbortController) =>
    POST(urls.updatePassword, params, abort),

  /** 获取登录二维码 */
  getLoginQrCode: () => GET<QrCodeResponseItem>(urls.getQRCodeKey),
  /** 二维码状态 */
  qrcodeStatus: (code: string) =>
    POST<{ status: QrCodeStatus; userInfo?: { userId: string } }>(urls.getQRCodeStatus, { code }),
  /** 移动端扫码 */
  qrcodeScan: (code: string, abort?: AbortController) => POST(urls.scanQRcode, { code }, abort),
  /** 移动端扫码确认 */
  qrcodeConfirm: (code: string, abort?: AbortController) => POST(urls.confirmQRcode, { code }, abort),
  /** 移动端扫码取消 */
  qrcodeCancel: (code: string, abort?: AbortController) => POST(urls.cancelQRcode, { code }, abort),

  /** 生成rsa密钥 */
  generateRsaKey: () => GET<{ publicKey: string; privateKey: string }>(urls.saveRSAKey),
  /** 获取rsa密钥 */
  getRsaKey: () => GET<{ publicKey: string; privateKey: string }>(urls.getRSAKey),

  /** 日志相关API */
  logs: logsApi,

  /** 获取用户详细信息 */
  getUserInfo: (userId: string, abort?: AbortController) => POST<UserInfoType>(urls.getUserInfo, { userId }, abort)
}
