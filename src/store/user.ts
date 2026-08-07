import { defineStore } from 'pinia'
import apis from '@/api'
import { StoresEnum } from '@/types/enums'
import { UserInfoType } from '@/types/userInfo'
import { getStoredUserInfo, persistStoredUserInfo } from '@/services/authSession'

export const useUserStore = defineStore(StoresEnum.USER, () => {
  const userInfo = ref<Partial<UserInfoType>>({})
  const isSign = ref(false)

  const getUserDetailAction = (userId: string) => {
    apis.user
      .getUserInfo(userId)
      .then((res) => {
        const storedUser = getStoredUserInfo()
        const nextUserInfo = {
          ...storedUser,
          ...userInfo.value,
          ...res,
          isAdmin: typeof (res as any)?.isAdmin === 'boolean' ? (res as any).isAdmin : false
        }
        userInfo.value = nextUserInfo
        persistStoredUserInfo(userInfo.value)
      })
      .catch((error) => {
        // A profile request can fail for an offline device or a transient
        // backend error. Token expiry is handled only by the refresh flow.
        console.warn('刷新用户资料失败，将保留现有会话。', error)
      })
  }

  return { userInfo, isSign, getUserDetailAction }
})
