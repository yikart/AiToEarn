import qs from "qs";
import { PlatType } from "@/app/config/platConfig";
import { getPinterestAuthUrlApi, checkPinterestAuthApi } from "@/api/platAuth";
import { useAccountStore } from "@/store/account";



/**
 * b站被点击
 * @param platType
 */
export async function pinterestSkip(platType: PlatType) {
  if (platType !== PlatType.Pinterest) return;

  const res: any = await getPinterestAuthUrlApi('pc');
  if (res?.code !== 0) return;
  const url = res.data.url;
  window.open(`${url}`);

  const pinterestLoginRes = await pinterestLogin(res.data.taskId);
  
}

export function pinterestLogin(taskId:any): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
        // 开始轮询检查授权状态
        const checkAuthStatus = async () => {
          try {
            const authRess:any = await checkPinterestAuthApi(taskId);
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
