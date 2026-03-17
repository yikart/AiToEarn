// 平台类型
export enum AccountType {
  Douyin = 'douyin', // 抖音
  Xhs = 'xhs', // 小红书
  WxSph = 'wxSph', // 微信视频号
  KWAI = 'KWAI', // 快手
  YOUTUBE = 'youtube', // youtube
  WxGzh = 'wxGzh', // 微信公众号
  BILIBILI = 'bilibili', // B站
  TWITTER = 'twitter', // twitter
  TIKTOK = 'tiktok', // tiktok
  FACEBOOK = 'facebook', // facebook
  INSTAGRAM = 'instagram', // instagram
  THREADS = 'threads', // threads
  PINTEREST = 'pinterest', // pinterest
  LINKEDIN = 'linkedin', // linkedin
  GOOGLE_BUSINESS = 'google_business', // Google Business Profile
}

export enum AccountStatus {
  NORMAL = 1, // 可用
  ABNORMAL = 0, // 不可用
}

export enum TaskRewardDataType {
  VIEW = 'view', // 浏览
  LIKE = 'like', // 点赞
  COMMENT = 'comment', // 评论
  SHARE = 'share', // 分享
  FOLLOW = 'follow', // 关注
  SUBSCRIBE = 'subscribe', // 订阅
  DOWNLOAD = 'download', // 下载
  INSTALL = 'install', // 安装
  REGISTER = 'register', // 注册
}
