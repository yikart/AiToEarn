// 平台类型
export enum PlatType {
  Douyin = 'douyin', // 抖音
  Xhs = 'xhs', // 小红书
  WxSph = 'wxSph', // 微信视频号
  KWAI = 'KWAI', // 快手
}

// 账号状态
export enum AccountStatus {
  // 未失效
  USABLE = 0,
  // 失效
  DISABLE = 1,
}

// 小红书账号异常状态
export enum XhsAccountAbnormal {
  // 账号正常
  Normal = 1,
  // 账号异常（无法发布视频）
  Abnormal = 2,
}

export const defaultAccountGroupId = 1;
