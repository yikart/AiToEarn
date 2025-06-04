import { IPubParams } from "../videoPage/videoPage.type";
import { SocialAccount } from "@/api/types/account.type";

export interface IImageAccountItem {
  account: SocialAccount;
  pubParams: IPubParams;
}
