export interface BilibiliAuthInfo {
  state: string
  userId: string
  accountId?: string
}

export enum WebhookEvent {
  VerifyWebhook = 'verify_webhook',
  PublishVideo = 'publish_video',
}

export interface WebhookPublishData {
  event: WebhookEvent.PublishVideo
  from_user_id: string // 投稿用户的open_id
  client_key: string // 发起投稿的client_key
  log_id: string // 请求唯一标识，可用于oncall快速定位问题
  content: {
    share_id: string // 分享ID
    item_id: string // 加密视频ID
    video_id: string // 真实视频ID
    has_default_hashtag: boolean // 标识用户最终的投稿是否携带了开发者设置的默认话题
  }
}
