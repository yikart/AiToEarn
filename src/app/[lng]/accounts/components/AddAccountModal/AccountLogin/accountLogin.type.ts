export interface IAccountLoginPlatProps {
  // 登录成功
  onLoginSuccess: (cookie: string) => void;
  // 代理地址
  proxy?: string;
}
