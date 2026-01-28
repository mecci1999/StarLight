import request from '@/services/request'
import url from './url'
import { UserInfoType } from '@/types/userInfo'

export const getUserInfo = (userId: string) => {
  return request.get<UserInfoType>(url.getUserInfo, { userId })
}
