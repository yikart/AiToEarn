import { PlatformType } from '../../../config/accountConfig';

export interface PlatAccountInfo {
  type: PlatformType;
  loginCookie: string;
  uid: string;
  account: string;
  avatar: string;
  nickname: string;
  fansCount?: number;
}
