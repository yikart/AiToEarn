import { SocialAccount } from "@/api/types/account.type";

export abstract class PlatBase {
  abstract login(): Promise<SocialAccount>;
}
