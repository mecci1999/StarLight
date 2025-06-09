export type UserInfoType = {
  /** 用户唯一标识 */
  userId: string
  /** 用户邮箱 */
  email: string
  /** 密码 */
  hash?: string
  /** 用户头像 */
  avatar: string
  /** 用户名 */
  nickName: string
  /** 权限 */
  isAdmin: boolean
  /** 注册来源 */
  source?: string
  /** 用户状态 */
  status: string
  /** 客户端 */
  client: string
  /** 最后登录时间 */
  lastActiveAt: string
  /** 设备信息 */
  devices?: { [key: string]: any }
  /** 元数据 */
  meta?: { [key: string]: any }
  /** 时区 */
  timezone?: string
  /** 语言 */
  locale?: string
}
