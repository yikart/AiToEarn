// 发布类型
export enum PubType {
  VIDEO = 'video', // 视频
  ARTICLE = 'article', // 文章
}

// 可见性
export enum VisibleTypeEnum {
  // 仅自己可见
  Private = 1,
  // 好友可见
  Friend = 2,
  // 所有人可见
  Public = 3,
}

// 抖音自主声明
export enum DouyinDeclareEnum {
  // 内容自行拍摄
  Self = 1,
  // 内容取材网络
  Network = 2,
  // 内容由AI生成
  AI = 3,
  // 可能引人不适
  Uncomfortable = 4,
  // 虚构演绎，仅供娱乐
  Fiction = 5,
  // 危险行为，请勿模仿
  Danger = 6,
}
