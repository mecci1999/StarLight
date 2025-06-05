/**
 * 登录相关的类型定义
 */

export type LoginUserReq = {
  /** 账号 */
  email: string
  /** 密码 */
  hash: string
  /** 邮箱验证码 */
  code: string
}

export type RegisterUserReq = {
  /** 邮箱账号 */
  email: string
  /** 密码 */
  hash: string
  /** 邮箱验证码 */
  code: string
}

export type QrCodeResponseItem = {
  /** 二维码key */
  code: string
  /** 过期时间 */
  expire: number
}
