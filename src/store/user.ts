import { defineStore } from 'pinia'
import apis from '@/api'
import { StoresEnum } from '@/types/enums'
import { UserInfoType } from '@/types/userInfo'
import { clearStoredAuthSession, getStoredUserInfo, persistStoredUserInfo } from '@/services/authSession'

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
      .catch(() => {
        clearStoredAuthSession()
      })
  }

  return { userInfo, isSign, getUserDetailAction }
})
