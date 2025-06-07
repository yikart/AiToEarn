import { PlatBase } from "@/app/plat/PlatBase";
import { SocialAccount } from "@/api/types/account.type";
import { RequestParams } from "@/utils/FetchService/types";
import { requestPlatApi } from "@/utils/otherRequest";
import { KwaiApiProxyUrl } from "@/constant";
import { kwaiAppId } from "@/app/[lng]/accounts/plat/kwaiLogin";
import { PlatType } from "@/app/config/platConfig";

export class KwaiPlat extends PlatBase {
  async getAccountInfo(): Promise<Partial<SocialAccount> | null> {
    const { user_info } = await this.request({
      url: "openapi/user_info",
      method: "GET",
    });
    return {
      avatar: user_info.bigHead,
      forwardCount: user_info.follow,
      fansCount: user_info.fan,
      nickname: user_info.name,
      type: PlatType.KWAI,
      account: "",
      uid: "",
    };
  }

  request(params: RequestParams) {
    params.url = `${KwaiApiProxyUrl}${params.url}`;
    params.params = {
      access_token: this.access_token,
      app_id: kwaiAppId,
      ...(params.params ?? {}),
    };
    return requestPlatApi(params);
  }
}
