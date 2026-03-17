import { Prop, Schema } from '@nestjs/mongoose'
import mongoose from 'mongoose'

@Schema({})
export class BiliBiliPublishTaskMeta {
  @Prop({ required: true })
  tid: number

  @Prop({ required: true })
  no_reprint: number

  @Prop({ required: true })
  copyright: number

  @Prop({ required: false })
  source?: string
}

@Schema({})
export class TiktokPublishTaskMeta {
  @Prop({ required: true })
  privacy_level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY' | 'FOLLOWER_OF_CREATOR'

  @Prop({ required: false })
  disable_duet?: boolean

  @Prop({ required: false })
  disable_stitch?: boolean

  @Prop({ required: false })
  disable_comment?: boolean

  @Prop({ required: false })
  brand_organic_toggle?: boolean

  @Prop({ required: false })
  brand_content_toggle?: boolean
}

@Schema({})
export class FacebookPublishTaskMeta {
  @Prop({ required: true })
  content_category: 'post' | 'reel' | 'story'
}

@Schema({})
export class InstagramPublishTaskMeta {
  @Prop({ required: true })
  content_category: 'post' | 'reel' | 'story'
}

@Schema({})
export class YoutubePublishTaskMeta {
  @Prop({ required: true })
  privacyStatus: 'public' | 'unlisted' | 'private'

  @Prop({ required: true })
  license: 'youtube' | 'creativeCommon'

  @Prop({ required: true })
  categoryId: string
}

@Schema({})
export class PinterestPublishTaskMeta {
  @Prop({ required: true })
  boardId: string
}

@Schema({})
export class ThreadsPublishTaskMeta {
  @Prop({ required: false })
  reply_control?: string

  @Prop({ required: false })
  allowlisted_country_codes?: string[]

  @Prop({ required: false })
  alt_text?: string

  @Prop({ required: false })
  auto_publish_text?: boolean

  @Prop({ required: false })
  topic_tags?: string

  @Prop({ required: false })
  location_id?: string
}

@Schema({})
export class WxGzhPublishTaskMeta {
  @Prop({ required: false })
  open_comment?: number

  @Prop({ required: false })
  only_fans_can_comment?: number
}

@Schema({})
export class PublishingTaskMeta {
  @Prop({ required: false })
  bilibili?: BiliBiliPublishTaskMeta

  @Prop({ required: false })
  tiktok?: TiktokPublishTaskMeta

  @Prop({ required: false })
  facebook?: FacebookPublishTaskMeta

  @Prop({ required: false })
  instagram?: InstagramPublishTaskMeta

  @Prop({ required: false })
  youtube?: YoutubePublishTaskMeta

  @Prop({ required: false })
  pinterest?: PinterestPublishTaskMeta

  @Prop({ required: false })
  threads?: ThreadsPublishTaskMeta

  @Prop({ required: false })
  wxGzh?: WxGzhPublishTaskMeta
}

@Schema({})
export class PublishErrorData {
  @Prop({ required: true })
  type: string

  @Prop({ required: true })
  code: string

  @Prop({ required: true, default: '' })
  message: string

  @Prop({ required: false, type: mongoose.Schema.Types.Mixed })
  originalData?: any
}
