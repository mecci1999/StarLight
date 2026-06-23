import request from '@/services/request'
import url from './url'
import { UserInfoType } from '@/types/userInfo'

export type UserProfilePatch = Partial<UserInfoType> & { userId: string; nickname?: string }
export type UserProfilePayload = Partial<UserInfoType> & { nickname?: string }
export type UserUpdateResponse = UserProfilePayload & { user?: UserProfilePayload }
export type UserUpdateResponseEnvelope = UserUpdateResponse & {
  content?: UserUpdateResponse
  data?: {
    content?: UserUpdateResponse
  }
}

export const extractUpdatedUser = (response: UserUpdateResponseEnvelope): UserProfilePayload => {
  const content = response.data?.content || response.content || response
  const { user, ...profile } = content
  const updatedUser = user || profile
  if (import.meta.env.DEV) {
    console.info('[AvatarSync][api:user:extractUpdatedUser]', {
      response,
      content,
      avatar: updatedUser.avatar
    })
  }
  return updatedUser
}

export const getUserInfo = (userId: string) => {
  return request.get<UserInfoType>(url.getUserInfo, { userId })
}

export const updateUserInfo = (data: UserProfilePatch) => {
  return request.post<UserUpdateResponseEnvelope>(url.updateUserInfo, data)
}

export const updateUserAvatar = (data: { userId: string; avatar: string; avatarFileId?: string }) => {
  return request.post<UserUpdateResponseEnvelope>(url.updateUserAvatar, data)
}
