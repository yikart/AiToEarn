export interface PhoneLoginParams {
  phone: string;
  code: string;
  openId?: string; // 微信公众号的openId
  inviteCode?: string;
}

export interface IUserInfo {
  _id: string;
  id: string;
  name: string;
  phone?: string;
  gender?: number;
  avatar?: string;
  desc?: string;
  wxOpenId?: string;
}

export interface IRefreshToken {
  token: string;
  userInfo: IUserInfo;
  // 过期时间。秒
  exp: number;
}
