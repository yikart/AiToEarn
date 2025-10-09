import { PlatType } from "@/app/config/platConfig";
import { getLinkedInAuthUrlApi, checkMetaAuthApi } from "@/api/platAuth";
import { useUserStore } from "@/store/user";
import { useAccountStore } from "@/store/account";

/**
 * LinkedIn 被点击
 * @param platType 平台类型
 */
export async function linkedinSkip(platType: PlatType) {
  if (platType !== PlatType.LinkedIn) return;

  const res: any = await getLinkedInAuthUrlApi('pc');
  if (res?.code == 1) {
    useUserStore.getState().logout();
    return;
  }
  if (res?.code !== 0) return;
  const url = res.data.url;
  window.open(`${url}`);

  await linkedinLogin(res.data.taskId);
}

/**
 * LinkedIn 轮询登录结果
 * @param taskId 任务ID
 */
export function linkedinLogin(taskId: any): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      let pollCount = 0;
      const maxPollCount = 30;

      const checkAuthStatus = async () => {
        try {
          pollCount++;
          const authRess: any = await checkMetaAuthApi(taskId);
          const authRes = authRess;
          if (authRes?.code === 0 && authRes?.data.status == 1) {
            const accountStore = useAccountStore.getState();
            await accountStore.getAccountList();
            resolve(authRes);
            return true;
          }
          if (pollCount >= maxPollCount) {
            return true;
          }
        } catch (error) {
          return false;
        }
      };

      const interval = setInterval(async () => {
        const isSuccess = await checkAuthStatus();
        if (isSuccess) {
          clearInterval(interval);
          if (pollCount >= maxPollCount) {
            reject(new Error('授权超时，已达到最大轮询次数'));
          }
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(interval);
        reject(new Error('授权超时'));
      }, 5 * 60 * 1000);
    } catch (e) {
      reject(e);
    }
  });
}


