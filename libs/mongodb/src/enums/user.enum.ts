export enum UserStatus {
  STOP = 0,
  OPEN = 1,
}

export enum EarnInfoStatus {
  CLOSE = 0,
  OPEN = 1,
}

export enum GenderEnum {
  MALE = 1, // 男
  FEMALE = 2, // 女
}

export enum VipStatus {
  none = 'none', // 无会员
  expired = 'expired', // 过期
  trialing = 'trialing', // 试用中
  monthly_once = 'monthly_once', // 包月一次性
  yearly_once = 'yearly_once', // 包年一次性
  active_monthly = 'active_monthly', // 连续包月中
  active_yearly = 'active_yearly', // 连续包年中
  active_nonrenewing = 'active_nonrenewing', // 有效(未续订)
  // pending_payment = 'pending_payment', // 支付中
  // unpaid = 'unpaid', // 支付失败
  // canceled = 'canceled', // 取消
}

// 有效会员状态数组
export const VipActiveStatusArr = [
  VipStatus.trialing,
  VipStatus.monthly_once,
  VipStatus.yearly_once,
  VipStatus.active_monthly,
  VipStatus.active_yearly,
  VipStatus.active_nonrenewing,
]
