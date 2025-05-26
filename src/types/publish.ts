export enum PubType {
  VIDEO = 'video', // 视频
  ARTICLE = 'article', // 文章
  IMAGE_TEXT = 'image-text', // 图文
}

export enum PubStatus {
  UNPUBLISH = 0, // 未发布/草稿
  RELEASED = 1, // 已发布
  FAIL = 2, // 发布失败
  PART_SUCCESS = 3, // 部分成功
}

export type PublishType = `${PubType}`;
export type PublishStatus = `${PubStatus}`; 