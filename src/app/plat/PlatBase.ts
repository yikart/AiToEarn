import { SocialAccount } from "@/api/types/account.type";
import {
  IPlatConstrParams,
  IPublishResult,
  IVideoPublishItem,
  PubProgressType,
} from "@/app/plat/plat.type";

export abstract class PlatBase {
  access_token: string;
  refresh_token: string;
  account: SocialAccount;

  // 用户账户信息
  abstract getAccountInfo(): Promise<Partial<SocialAccount> | null>;

  constructor(params: IPlatConstrParams) {
    this.access_token = params.access_token;
    this.refresh_token = params.refresh_token;
    this.account = params.account!;
  }

  publishVideo(
    videoPubParams: IVideoPublishItem,
    onProgress: PubProgressType,
  ): Promise<IPublishResult> {
    throw new Error("Method not implemented.");
  }
}
