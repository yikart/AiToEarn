import qs from "qs";
import { PlatType } from "@/app/config/platConfig";
import { requestPlatApi } from "@/utils/otherRequest";
import { KwaiPlat } from "@/app/plat/platChildren/kwai/KwaiPlat";
import { createOrUpdateAccountApi } from "@/api/account";

export const kwaiAppId = "ks715790869885446758";
export const kwaiAppSecret = "cqSvJvBSPJjd-4pBH_4N0Q";

export function kwaiSkip(platType: PlatType) {
  const authParams = qs.stringify({
    app_id: kwaiAppId,
    scope: "user_info,user_video_publish",
    response_type: "code",
    ua: "pc",
    redirect_uri: `https://localhost:6060/accounts/add?platType=${platType}`,
  });
  window.open(`https://open.kuaishou.com/oauth2/authorize?${authParams}`);
}

export function kwaiLogin(code: string): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      const accessTokenRes = await requestPlatApi({
        url: `/kuaishoApi/oauth2/access_token`,
        method: "GET",
        params: {
          app_id: kwaiAppId,
          app_secret: kwaiAppSecret,
          code,
          grant_type: "authorization_code",
        },
      });
      if (accessTokenRes?.result !== 1) {
        return reject("accessToken 获取失败！");
      }
      const kwaiPlat = new KwaiPlat({
        access_token: accessTokenRes.access_token,
        refresh_token: accessTokenRes.refresh_token,
      });
      const userInfo = await kwaiPlat.getAccountInfo();
      userInfo!.account = accessTokenRes.open_id;
      userInfo!.uid = accessTokenRes.open_id;
      userInfo!["refresh_token"] = accessTokenRes.refresh_token;
      userInfo!["access_token"] = accessTokenRes.access_token;

      const res = await createOrUpdateAccountApi({
        ...userInfo,
      }).catch(() => false);
      resolve(!!res);
    } catch (e) {
      reject(e);
    }
  });
}
