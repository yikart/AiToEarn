export enum UserStatus {
  STOP = 0,
  OPEN = 1,
}

export enum GenderEnum {
  MALE = 1, // 男
  FEMALE = 2, // 女
}

export enum VipStatus {
  Active = 'active',
  Expired = 'expired',
}

// 有效会员状态数组
export const VipActiveStatusArr = [
  VipStatus.Active,
]
