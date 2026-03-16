// 账号状态
export enum AccountStatus {
  // 未失效
  USABLE = 1,
  // 失效
  DISABLE = 0,
}

// 小红书账号异常状态
export enum XhsAccountAbnormal {
  // 账号正常
  Normal = 1,
  // 账号异常（无法发布视频）
  Abnormal = 2,
}
