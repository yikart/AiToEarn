// 平台类型
export enum AccountType {
  Douyin = 'douyin', // 抖音
  Xhs = 'xhs', // 小红书
  WxSph = 'wxSph', // 微信视频号
  KWAI = 'KWAI', // 快手
}
// 账号类型信息
export const AccountTypeInfoMap = new Map<
  AccountType,
  {
    name: string;
    icon: string;
    accountType: AccountType;
  }
>([
  [
    AccountType.Douyin,
    {
      accountType: AccountType.Douyin,
      name: '抖音',
      icon: 'https://ai-to-earn.oss-cn-beijing.aliyuncs.com/comment/platlogo/logo-douyin.png',
    },
  ],
  [
    AccountType.Xhs,
    {
      accountType: AccountType.Xhs,
      name: '小红书',
      icon: 'https://ai-to-earn.oss-cn-beijing.aliyuncs.com/comment/platlogo/logo-xiaohongshu.png',
    },
  ],
  [
    AccountType.WxSph,
    {
      accountType: AccountType.WxSph,
      name: '微信视频号',
      icon: 'https://ai-to-earn.oss-cn-beijing.aliyuncs.com/comment/platlogo/logo-shipinhao.png',
    },
  ],
  [
    AccountType.KWAI,
    {
      accountType: AccountType.KWAI,
      name: '快手',
      icon: 'https://ai-to-earn.oss-cn-beijing.aliyuncs.com/comment/platlogo/logo-kuaishou.png',
    },
  ],
]);

// 账号状态
export enum AccountStatus {
  // 未失效
  USABLE = 0,
  // 失效
  DISABLE = 1,
}
