import { SocialAccount } from "@/api/types/account.type";

export interface IAccountLoginPlatProps {
  // 登录成功
  onLoginSuccess: (accountInfo: null | Partial<SocialAccount>) => void;
  // 代理地址
  proxy?: string;
}
