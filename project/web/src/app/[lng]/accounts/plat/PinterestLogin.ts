import qs from 'qs'
import { checkPinterestAuthApi, getPinterestAuthUrlApi } from '@/api/platAuth'
import { PlatType } from '@/app/config/platConfig'
import { useAccountStore } from '@/store/account'
import { useUserStore } from '@/store/user'

/**
 * Pinterest被点击
 * @param platType
 */
export async function pinterestSkip(platType: PlatType, spaceId?: string) {
  if (platType !== PlatType.Pinterest)
    return

  const res: any = await getPinterestAuthUrlApi('pc', spaceId)
  if (res?.code == 1) {
    useUserStore.getState().logout()
    return
  }
  if (res?.code !== 0)
    return
  const url = res.data.uri
  window.open(`${url}`)

  const pinterestLoginRes = await pinterestLogin(res.data.taskId)
}

export function pinterestLogin(taskId: any): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      let pollCount = 0
      const maxPollCount = 30 // 最大轮询次数

      // 开始轮询检查授权状态
      const checkAuthStatus = async () => {
        try {
          pollCount++
          const authRess: any = await checkPinterestAuthApi(taskId)
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
            return true
          }

          // return false;
        }
        catch (error) {
          
          return false
        }
      }

      // 设置轮询间隔
      const interval = setInterval(async () => {
        const isSuccess = await checkAuthStatus()
        if (isSuccess) {
          clearInterval(interval)
          if (pollCount >= maxPollCount) {
            reject(new Error('timeout, max poll count reached'))
          }
        }
      }, 2000)

      // 5分钟后自动停止轮询
      setTimeout(() => {
        clearInterval(interval)
        // message.error('授权超时，请重试');
        reject(new Error('timeout'))
      }, 5 * 60 * 1000)
    }
    catch (e) {
      reject(e)
    }
  })
}
