import qs from "qs";
import { PlatType } from "@/app/config/platConfig";
import { getFacebookAuthUrlApi, checkMetaAuthApi } from "@/api/platAuth";
import { useAccountStore } from "@/store/account";

// 导入Facebook页面选择弹窗
import FacebookPagesModal from "@/components/FacebookPagesModal";

/**
 * Facebook被点击
 * @param platType
 */
export async function facebookSkip(platType: PlatType) {
  if (platType !== PlatType.Facebook) return;

  const res: any = await getFacebookAuthUrlApi('pc');
  if (res?.code !== 0) return;
  const url = res.data.url;
  window.open(`${url}`);

  const facebookLoginRes = await facebookLogin(res.data.taskId);
  
}

export function facebookLogin(taskId: any): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      // 开始轮询检查授权状态
      const checkAuthStatus = async () => {
        try {
          const authRess: any = await checkMetaAuthApi(taskId);
          let authRes = authRess;
          console.log('authRes', authRes)
          if (authRes?.code === 0 && authRes?.data.status == 1) {
            // 授权成功，不再直接刷新账户列表
            // 而是触发页面选择弹窗
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

// 导出Facebook页面选择弹窗组件，供外部使用
export { FacebookPagesModal };
