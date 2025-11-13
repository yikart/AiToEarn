import { InitUploadVideoDto } from '../../core/platforms/youtube/dto/youtube.dto'
import { AddArchiveData } from '../../libs/bilibili/common'
import {
  PublishStatus,
  PublishTask,
} from '../../libs/database/schema/publishTask.schema'
import { FacebookPost } from '../../libs/facebook/facebook.interfaces'
import { InstagramPost } from '../../libs/instagram/instagram.interfaces'
import { IPinterestOptions } from '../../libs/pinterest/common'
import { ThreadsPost } from '../../libs/threads/threads.interfaces'
import { TiktokPostOptions } from '../../libs/tiktok/tiktok.interfaces'
import { WxGzhArticleNewsPic } from '../../libs/wx-gzh/common'

export interface PlatPulOption {
  bilibili?: Partial<Pick<
    AddArchiveData,
     'no_reprint' | 'source' | 'topic_id'
  >>
  & Required<Pick<AddArchiveData, 'tid' | 'copyright'>>
  youtube?: Pick<
    InitUploadVideoDto,
    'tag' | 'categoryId' | 'privacyStatus' | 'license' | 'embeddable' | 'notifySubscribers' | 'selfDeclaredMadeForKids'
  >
  wxGzh?: Pick<
    WxGzhArticleNewsPic,
    | 'need_open_comment'
    | 'only_fans_can_comment'
    | 'cover_info'
    | 'product_info'
  >
  facebook?: FacebookPost
  instagram?: InstagramPost
  threads?: ThreadsPost
  pinterest?: IPinterestOptions
  tiktok?: TiktokPostOptions
}

export interface NewPulData<T extends PlatPulOption>
  extends Omit<
    PublishTask,
    'id' | 'option' | 'status' | 'createdAt' | 'updatedAt'
  > {
  option?: T
}

export interface DoPubRes {
  status: PublishStatus
  message: string
  noRetry?: boolean
  data?: any
}
