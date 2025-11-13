import { apiCheckBilibiliAuth, apiGetBilibiliLoginUrl } from '@/api/plat/bilibili'
import { PlatType } from '@/app/config/platConfig'
import { useAccountStore } from '@/store/account'
import { useUserStore } from '@/store/user'

/**
 * b站被点击
 * @param platType
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
      const maxPollCount = 30 // 最大轮询次数

      // 开始轮询检查授权状态
      const checkAuthStatus = async () => {
        try {
          pollCount++
          const authRess: any = await apiCheckBilibiliAuth(taskId)
          const authRes = authRess
          if (authRes?.code === 0 && authRes?.data.status == 1) {
            // message.success('授权成功');
            // useAccountStore
            const accountStore = useAccountStore.getState()
            await accountStore.getAccountList()
            resolve(authRes)
            return true
          }

          // 检查是否达到最大轮询次数
          if (pollCount >= maxPollCount) {
            console.log('达到最大轮询次数，停止轮询')
            return true
          }

          // return false;
        }
        catch (error) {
          console.error('检查授权状态失败:', error)
          return false
        }
      }

      // 设置轮询间隔
      const interval = setInterval(async () => {
        const isSuccess = await checkAuthStatus()
        if (isSuccess) {
          clearInterval(interval)
          if (pollCount >= maxPollCount) {
            reject(new Error('授权超时，已达到最大轮询次数'))
          }
        }
      }, 2000)

      // 5分钟后自动停止轮询
      setTimeout(() => {
        clearInterval(interval)
        // message.error('授权超时，请重试');
        reject(new Error('授权超时'))
      }, 5 * 60 * 1000)
    }
    catch (e) {
      reject(e)
    }
  })
}
