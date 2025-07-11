// 发布类型
export enum PubType {
  VIDEO = "video", // 视频
  ImageText = "image-text", // 图文
}

// 可见性
export enum VisibleTypeEnum {
  // 所有人可见
  Public = 1,
  // 仅自己可见
  Private = 2,
  // 好友可见
  Friend = 3,
}

export enum PubStatus {
  UNPUBLISH = 0, // 未发布/草稿
  RELEASED = 1, // 已发布
  FAIL = 2, // 发布失败
  PartSuccess = 3, // 部分成功
  Audit = 4, // 审核中
}
