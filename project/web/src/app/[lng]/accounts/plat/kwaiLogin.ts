import type { PlatType } from '@/app/config/platConfig'
import { createKwaiAuth, getKwaiAuthStatus } from '@/api/plat/kwai'
import { useAccountStore } from '@/store/account'
import { useUserStore } from '@/store/user'
import { sleep } from '@/utils'

export async function kwaiSkip(platType: PlatType, spaceId?: string): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await createKwaiAuth('pc', spaceId)
      if (res?.code == 1) {
        useUserStore.getState().logout()
        reject(new Error('login required'))
        return
      }
      if (!res?.data) {
        reject(new Error('no data'))
        return
      }

      window.open(res?.data.url)

      let queryCount = 0
      const maxQueryCount = 30 // 最大轮询次数

      const checkAuthStatus = async () => {
        try {
          queryCount++
          const autoStatusRes = await getKwaiAuthStatus(res.data.taskId)

          if (!autoStatusRes?.data) {
            resolve(autoStatusRes)
            return true
          }

          if (autoStatusRes?.data?.status === 1) {
            // 授权成功，返回结果，交由调用方处理
            resolve(autoStatusRes)
            return true
          }

          // 检查是否达到最大轮询次数
          if (queryCount >= maxQueryCount) {
            reject(new Error('timeout, max poll count reached'))
            return true
          }

          return false
        }
        catch (error) {
          reject(error)
          return true
        }
      }

      // 设置轮询间隔
      const interval = setInterval(async () => {
        const isFinished = await checkAuthStatus()
        if (isFinished) {
          clearInterval(interval)
        }
      }, 1000)

      // 5分钟后自动停止轮询
      setTimeout(() => {
        clearInterval(interval)
        reject(new Error('timeout'))
      }, 5 * 60 * 1000)
    }
    catch (error) {
      reject(error)
    }
  })
}
