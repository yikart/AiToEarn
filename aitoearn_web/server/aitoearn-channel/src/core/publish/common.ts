import { AddArchiveData } from '@libs/bilibili/comment';
import { InitUploadVideoDto } from '@/core/plat/youtube/dto/youtube.dto';
import {
  PublishStatus,
  PublishTask,
} from '@/libs/database/schema/publishTask.schema';
import { FacebookPost } from '@/libs/facebook/facebook.interfaces'
import { InstagramPost } from '@/libs/instagram/instagram.interfaces'
import { ThreadsPost } from '@/libs/threads/threads.interfaces'
import { WxGzhArticleNewsPic } from '@/libs/wxGzh/common';

export interface PlatPulOption {
  bilibili?: Partial<Pick<
    AddArchiveData,
     'no_reprint' | 'source' | 'topic_id'
  >>
  & Required<Pick<AddArchiveData, 'tid' | 'copyright'>>;
  youtube?: Pick<
    InitUploadVideoDto,
    'tag' | 'categoryId' | 'privacyStatus' | 'publishAt'
  >;
  wxGzh?: Pick<
    WxGzhArticleNewsPic,
    | 'need_open_comment'
    | 'only_fans_can_comment'
    | 'cover_info'
    | 'product_info'
  >;
  facebook?: FacebookPost
  instagram?: InstagramPost;
  threads?: ThreadsPost;
}

export interface NewPulData<T extends PlatPulOption>
  extends Omit<
    PublishTask,
    'id' | 'option' | 'status' | 'createdAt' | 'updatedAt'
  > {
  option?: T;
}

export interface DoPubRes {
  status: PublishStatus;
  message: string;
  noRetry?: boolean;
  data?: any;
}
