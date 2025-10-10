import qs from "qs";
import { PlatType } from "@/app/config/platConfig";
import { checkTiktokAuthApi, getTiktokAuthUrlApi } from "@/api/platAuth";
import { useAccountStore } from "@/store/account";
import { useUserStore } from "@/store/user";


/**
 * Tiktok被点击
 * @param platType
 */
export async function tiktokSkip(platType: PlatType, spaceId?: string) {
  if (platType !== PlatType.Tiktok) return;

  const res: any = await getTiktokAuthUrlApi('pc', spaceId);
    if (res?.code == 1) {
            useUserStore.getState().logout();
            return
          }
  if (res?.code !== 0) return;
  const url = res.data.url;
  window.open(`${url}`);

  const tiktokLoginRes = await tiktokLogin(res.data.taskId);
  
}

export function tiktokLogin(taskId:any): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
        let pollCount = 0;
        const maxPollCount = 30; // 最大轮询次数

        // 开始轮询检查授权状态
        const checkAuthStatus = async () => {
          try {
            pollCount++;
            const authRess:any = await checkTiktokAuthApi(taskId);
            let authRes = authRess;
            console.log('authRes', authRes)
            if (authRes?.code === 0 && authRes?.data.status == 1) {
              // message.success('授权成功');
              // useAccountStore
              const accountStore = useAccountStore.getState();
              await accountStore.getAccountList();
              resolve(authRes);
              return true;
            }
            
            // 检查是否达到最大轮询次数
            if (pollCount >= maxPollCount) {
              console.log('达到最大轮询次数，停止轮询');
              return true;
            }
            
            // return false;
          } catch (error) {
            console.error('检查授权状态失败:', error);
            return false;
          }
        };

        // 设置轮询间隔
        const interval = setInterval(async () => {
          const isSuccess = await checkAuthStatus();
          if (isSuccess) {
            clearInterval(interval);
            if (pollCount >= maxPollCount) {
              reject(new Error('授权超时，已达到最大轮询次数'));
            }
          }
        }, 2000);

        // 5分钟后自动停止轮询
        setTimeout(() => {
          clearInterval(interval);
          // message.error('授权超时，请重试');
          reject(new Error('授权超时'));
        }, 5 * 60 * 1000);
     
    } catch (e) {
      reject(e);
    }
  });
}
