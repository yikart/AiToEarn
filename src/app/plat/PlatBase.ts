import { SocialAccount } from "@/api/types/account.type";
import { Cookie } from "undici-types";
import { IPlatConstrParams } from "@/app/plat/plat.type";

export abstract class PlatBase {
  cookieStr: string;
  cookieList: Cookie[];
  proxy?: string;

  // 用户账户信息
  abstract getAccountInfo(): Promise<Partial<SocialAccount> | null>;

  constructor(params: IPlatConstrParams) {
    this.cookieList = params.cookieList;
    this.cookieStr = this.convertCookieToJson(params.cookieList);
    this.proxy = params.proxy;
  }

  convertCookieToJson(cookieJson: any) {
    if (typeof cookieJson === "string") {
      cookieJson = JSON.parse(cookieJson);
    }
    let cookieStr = "";
    cookieJson.forEach((cookie: any) => {
      cookieStr += `${cookie.name}=${cookie.value}; `;
    });
    return cookieStr;
  }
}
