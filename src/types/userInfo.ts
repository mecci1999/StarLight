export type UserInfoType = {
  /** 用户唯一标识 */
  userId: string
  /** 用户邮箱 */
  email: string
  /** 密码 */
  password?: string
  /** 用户头像 */
  avatar: string
  /** 用户名 */
  nickName: string
  /** 权限 */
  power?: number
  /** 用户状态id */
  userStateId: string
  /** 头像更新时间 */
  avatarUpdateTime: number
  /** 客户端 */
  client: string
}
