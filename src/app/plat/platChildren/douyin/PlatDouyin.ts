import { PlatBase } from "@/app/plat/PlatBase";
import { SocialAccount } from "@/api/types/account.type";

export class PlatDouyin extends PlatBase {
  getAccountInfo(): Promise<Partial<SocialAccount> | null> {
    return Promise.resolve(null);
  }
}
