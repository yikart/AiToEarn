export interface YoutubePublishOption {
  privacyStatus?: string // 隐私状态
  tag?: string // 标签, 多个标签用英文逗号分隔，总长度小于200
  categoryId?: string // 分类id
  publishAt?: string // 定时发布
}
