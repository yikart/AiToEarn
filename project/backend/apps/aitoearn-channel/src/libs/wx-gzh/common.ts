export enum MediaType {
  image = 'image',
  voice = 'voice',
  video = 'video',
  thumb = 'thumb',
}

export interface WxGzhArticleNews {
  article_type: 'news'
  title: string // TITLE;
  author?: string // AUTHOR;
  digest?: string // DIGEST;
  content: string // CONTENT;
  content_source_url?: string // CONTENT_SOURCE_URL;
  thumb_media_id: string // THUMB_MEDIA_ID; 永久素材的
  need_open_comment?: number // 0;是否打开评论，0不打开(默认)，1打开
  only_fans_can_comment?: number // 0;否粉丝才可评论，0所有人可评论(默认)，1粉丝才可评论
  pic_crop_235_1?: string // X1_Y1_X2_Y2;
  pic_crop_1_1?: string // X1_Y1_X2_Y2;
}

export interface WxGzhArticleNewsPic {
  article_type: 'newspic'
  title: string // TITLE;
  content: string // CONTENT;
  image_info: {
    image_list: {
      image_media_id: string // IMAGE_MEDIA_ID;
    }[]
  }
  need_open_comment?: number // 0;是否打开评论，0不打开(默认)，1打开
  only_fans_can_comment?: number // 0;否粉丝才可评论，0所有人可评论(默认)，1粉丝才可评论
  cover_info?: {
    crop_percent_list?: {
      ratio: string // '1_1';
      x1: string // '0.166454';
      y1: string // '0';
      x2: string // '0.833545';
      y2: string // '1';
    }[]
  }
  product_info?: {
    footer_product_info?: {
      product_key?: string // PRODUCT_KEY;
    }
  }
}

export interface WechatApiCommonResponse {
  errcode?: number
  errmsg?: string
}

export type WechatApiResponse<T> = T & WechatApiCommonResponse
