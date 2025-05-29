import {PlatBase} from "@/app/plat/PlatBase";
import {requestPlatApi} from "@/utils/otherRequest";
import {SocialAccount} from "@/api/types/account.type";
import {PlatType} from "@/app/config/platConfig";

export class PlatXhs extends PlatBase {
  async getAccountInfo(): Promise<Partial<SocialAccount> | null> {
    try {
      const res = await requestPlatApi({
        url: "xhs/me",
        method: "POST",
        data: {
          proxy: this.proxy,
          cookie: this.cookieStr,
        },
      });
      const { basic_info, interactions } = res.data.response_body.data;

      return {
        loginCookie: JSON.stringify(this.cookieList),
        type: PlatType.Xhs,
        uid: basic_info.red_id,
        account: basic_info.red_id,
        nickname: basic_info.nickname,
        avatar: basic_info.images,
        fansCount: interactions.find((v: any) => v.type === "fans").count,
      };
    } catch (e) {
      console.warn(e);
      return null;
    }
  }
}
