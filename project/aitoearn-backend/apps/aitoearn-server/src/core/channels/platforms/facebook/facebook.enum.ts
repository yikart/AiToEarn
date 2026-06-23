export enum FacebookVideoState {
  Draft = 'DRAFT',
  Scheduled = 'SCHEDULED',
  Published = 'PUBLISHED',
}

export enum FacebookContentCategory {
  Post = 'post',
  Reel = 'reel',
  Story = 'story',
}

export enum FacebookVideoStatus {
  Ready = 'ready',
  Published = 'published',
  Processing = 'processing',
  Error = 'error',
}

export enum FacebookOAuthGrantType {
  ExchangeToken = 'fb_exchange_token',
}

export enum FacebookWebhookObject {
  Page = 'page',
}

export enum FacebookWebhookField {
  Feed = 'feed',
  Comments = 'comments',
  Ratings = 'ratings',
}

export enum FacebookWebhookFeedItem {
  Comment = 'comment',
  Like = 'like',
  Photo = 'photo',
  Post = 'post',
  Reaction = 'reaction',
  Share = 'share',
  Status = 'status',
  Video = 'video',
}

export enum FacebookWebhookVerb {
  Add = 'add',
  Edited = 'edited',
  Remove = 'remove',
  Hide = 'hide',
  Unhide = 'unhide',
}

export enum FacebookWebhookStatus {
  Failed = 'failed',
}
