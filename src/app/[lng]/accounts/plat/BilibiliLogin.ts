import qs from "qs";
import { PlatType } from "@/app/config/platConfig";
import { requestPlatApi } from "@/utils/otherRequest";
import { KwaiPlat } from "@/app/plat/platChildren/kwai/KwaiPlat";
import { createOrUpdateAccountApi } from "@/api/account";
import { apiGetBilibiliLoginUrl } from "@/api/bilibili";

export const kwaiAppId = "ks715790869885446758";
export const kwaiAppSecret = "cqSvJvBSPJjd-4pBH_4N0Q";

/**
 * b站被点击
 * @param platType
 */
export async function bilibiliSkip(platType: PlatType) {
  if (platType !== PlatType.BILIBILI) return;

  const res = await bilibiliLogin();
  // 获取跳转地
  const url = res.url;
  window.open(`${url}`);
}

export function bilibiliLogin(): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      // TODO: 类型根据页面判断
      const res = await apiGetBilibiliLoginUrl('pc');
      console.log("-----bilibiliLogin--", res);

      resolve(res?.data);
    } catch (e) {
      reject(e);
    }
  });
}
