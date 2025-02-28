export enum WalletAccountType {
  ZFB = 'ZFB',
  WX_PAY = 'WX_PAY',
}

export interface UserWalletAccount {
  id: string;
  userId: string;
  userName: string; // 真实姓名
  cardNum: string; // 身份证号
  phone: string; // 绑定的手机号
  type: WalletAccountType;
}

export interface CreateUserWalletAccountParams {
  userName: string; // 真实姓名
  cardNum: string; // 身份证号
  phone: string; // 绑定的手机号
  type: WalletAccountType;
}
