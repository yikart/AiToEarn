import { apiCheckBilibiliAuth, apiGetBilibiliLoginUrl } from '@/api/plat/bilibili'
import { PlatType } from '@/app/config/platConfig'
import { useAccountStore } from '@/store/account'
import { useUserStore } from '@/store/user'

/**
 * Handle Bilibili platform click
 * @param platType - Platform type
 * @param spaceId - Optional space ID
 */
export async function bilibiliSkip(platType: PlatType, spaceId?: string) {
  if (platType !== PlatType.BILIBILI)
    return

  const res: any = await apiGetBilibiliLoginUrl('pc', spaceId)
  if (res?.code === 1) {
    useUserStore.getState().logout()
    return
  }
  if (res?.code !== 0)
    return
  const url = res.data.url
  window.open(`${url}`)

  await bilibiliLogin(res.data.taskId)
}

export function bilibiliLogin(taskId: any): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      let pollCount = 0
      const maxPollCount = 30 // Maximum poll count

      // Start polling to check authorization status
      const checkAuthStatus = async () => {
        try {
          pollCount++
          const authRess: any = await apiCheckBilibiliAuth(taskId)
          const authRes = authRess
          if (authRes?.code === 0 && authRes?.data.status == 1) {
            // message.success('Authorization successful');
            // useAccountStore
            const accountStore = useAccountStore.getState()
            await accountStore.getAccountList()
            resolve(authRes)
            return true
          }

          // Check if maximum poll count reached
          if (pollCount >= maxPollCount) {
            console.log('Maximum poll count reached, stopping polling')
            return true
          }

          // return false;
        }
        catch (error) {
          console.error('Failed to check authorization status:', error)
          return false
        }
      }

      // Set polling interval
      const interval = setInterval(async () => {
        const isSuccess = await checkAuthStatus()
        if (isSuccess) {
          clearInterval(interval)
          if (pollCount >= maxPollCount) {
            reject(new Error('Authorization timeout, maximum poll count reached'))
          }
        }
      }, 2000)

      // Auto stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(interval)
        // message.error('Authorization timeout, please retry');
        reject(new Error('Authorization timeout'))
      }, 5 * 60 * 1000)
    }
    catch (e) {
      reject(e)
    }
  })
}
