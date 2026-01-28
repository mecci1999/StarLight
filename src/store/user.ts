import { defineStore } from 'pinia'
import apis from '@/api'
import { StoresEnum } from '@/types/enums'
import { UserInfoType } from '@/types/userInfo'
import { removeCookie } from '@/utils/Cookie'

export const useUserStore = defineStore(StoresEnum.USER, () => {
  const userInfo = ref<Partial<UserInfoType>>({})
  const isSign = ref(false)

  const getUserDetailAction = (userId: string) => {
    apis.user
      .getUserInfo(userId)
      .then((res) => {
        userInfo.value = { ...userInfo.value, ...res }
        // 获取用户信息成功后，将userInfo存储到localStorage中
        localStorage.setItem('user', JSON.stringify(userInfo.value))
      })
      .catch(() => {
        // 删除Cookie中的ACCESS_TOKEN和REFRESH_TOKEN
        removeCookie('ACCESS_TOKEN')
        removeCookie('REFRESH_TOKEN')
      })
  }

  return { userInfo, isSign, getUserDetailAction }
})
