// 平台类型
export enum AccountType {
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

export const defaultAccountGroupId = 1;
