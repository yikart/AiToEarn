import type { SocialAccount } from '@/api/accounts/account.types'

export interface IImgFile {
  id: string
  size: number
  file: File
  // 前端临时路径，注意不要存到数据库
  imgUrl: string
  filename: string
  // 图片在硬盘上的路径
  imgPath: string
  // 图片宽度
  width: number
  // 图片高度
  height: number
  // 前端上传到oss后的url
  ossUrl?: string
  // 上传任务ID（用于取消/进度追踪）
  uploadTaskId?: string
}

export interface IVideoFile {
  size: number
  file: Blob
  // 前端临时路径，注意不要存到数据库
  videoUrl: string
  // 前端上传到oss后的url
  ossUrl?: string
  filename: string
  // 视频宽度
  width: number
  // 视频高度
  height: number
  // 视频下取整的时长,单位秒
  duration: number
  // 视频首帧图片
  cover: IImgFile
  // 上传任务ID（用于取消/进度追踪）
  uploadTaskIds?: {
    video?: string
    cover?: string
  }
}

export interface IWxSphPoiInfo {
  latitude?: number
  longitude?: number
  poiCity?: string
  poiName?: string
  poiAddress?: string
  poiId?: string
  province?: string
  region?: string
  fullAddress?: string
  poiCheckSum?: string
}

export interface IWxSphEventInfo {
  eventTopicId: string
  eventName: string
  eventCreatorNickname?: string
  eventAttendCount?: number
}
export type IXhsUserDeclarationOrigin = 1 | 2 | 3

export interface IXhsUserDeclarationBind {
  origin: IXhsUserDeclarationOrigin
}

export type PlatformPublishOption = Record<string, unknown>

// 发布 每个平台的独有参数
export interface IPlatOption {
  bilibili?: PlatformPublishOption & {
    // 分区ID，由获取分区信息接口得到
    tid?: number
    // 1-原创，2-转载(转载时source必填)
    copyright?: number
    // 如果copyright为转载，则此字段表示转载来源
    source?: string
    // 是否允许转载 0-允许，1-不允许
    no_reprint?: number
    // 话题 ID
    topic_id?: number
    // 投稿活动 ID
    mission_id?: number
  }
  wxGzh?: PlatformPublishOption & {
    // 平台独立标题，仅用于微信公众号
    title?: string
    // 图文作者
    author?: string
    // 图文摘要
    digest?: string
    // 是否开启评论
    open_comment?: number
    // 是否仅粉丝可评论
    only_fans_can_comment?: number
    // 是否显示封面
    showCoverPic?: boolean
    // 原文链接
    sourceUrl?: string
  }
  facebook?: PlatformPublishOption & {
    // 页面 ID
    page_id?: string
    // 是否发布为 Reels
    isReel?: boolean
    // Feed 链接
    link?: string
    // 内容类型：post(Post)、reel(Reel)、story(Story)
    content_category?: string
    // 内容标签
    content_tags?: string[]
    // 自定义标签
    custom_labels?: string[]
    // 直接分享状态
    direct_share_status?: number
    // 是否可嵌入
    embeddable?: boolean
    // Feed 定向
    feed_targeting?: Record<string, unknown>
    // Reels/视频发布状态
    video_state?: string
  }
  instagram?: PlatformPublishOption & {
    // 内容类型：post(Post)、reel(Reel)、story(Story)
    content_category?: string
    // 是否发布为 Reels
    isReel?: boolean
    // 替代文本
    alt_text?: string
    // 覆盖标题
    caption?: string
    // 协作者
    collaborators?: string[]
    // 封面 URL
    cover_url?: string
    // 图片 URL
    image_url?: string
    // 位置 ID
    location_id?: string
    // 媒体类型
    media_type?: string
    // 商品标签
    product_tags?: Record<string, unknown>[]
    // 用户标签
    user_tags?: Record<string, unknown>[]
  }
  youtube?: PlatformPublishOption & {
    // 隐私状态：public、unlisted、private
    privacyStatus?: string
    // 标签列表
    tags?: string[]
    // 许可证类型：youtube、creativeCommon
    license?: string
    // 视频分类ID
    categoryId?: string
    // 定时发布时间
    publishAt?: string
    // 是否通知订阅者
    notifySubscribers?: boolean
    // 是否允许嵌入
    embeddable?: boolean
    // 是否为儿童内容
    selfDeclaredMadeForKids?: boolean
    // YouTube 审核后的儿童内容标记
    madeForKids?: boolean
  }
  pinterest?: PlatformPublishOption & {
    // Board ID，由获取Pinterest Board信息接口得到
    boardId?: string
    // Pin 跳转链接
    link?: string
    // 替代文本
    altText?: string
    // 视频 Pin 封面 URL
    coverImageUrl?: string
  }
  xhs?: PlatformPublishOption & {
    // 小红书用户声明绑定：1=虚拟演绎，仅供娱乐、2=笔记含AI合成内容、3=内容包含营销广告
    userDeclarationBind?: IXhsUserDeclarationBind | null
  }
  wxSph?: PlatformPublishOption & {
    // WeChat Channels location
    poiInfo?: IWxSphPoiInfo
    // WeChat Channels activity
    activity?: IWxSphEventInfo
    // WeChat Channels extension link
    extLink?: string
    // Declare original content
    isOriginal?: boolean
  }
  tiktok?: PlatformPublishOption & {
    // 隐私级别：PUBLIC_TO_EVERYONE、MUTUAL_FOLLOW_FRIENDS、SELF_ONLY
    privacy_level?: string
    // 是否禁用评论
    comment_disabled?: boolean
    // 是否禁用合拍
    duet_disabled?: boolean
    // 是否禁用拼接
    stitch_disabled?: boolean
    // 品牌有机内容开关
    brand_organic_toggle?: boolean
    // 品牌内容开关
    brand_content_toggle?: boolean
    // 商业内容披露开关
    brand_disclosure_enabled?: boolean
    // 图文发布自动配乐
    auto_add_music?: boolean
    // 图文封面图片下标
    photo_cover_index?: number
    // 视频上传来源
    source?: string
  }
  threads?: PlatformPublishOption & {
    // 回复控制
    reply_control?: string
    // 位置信息
    location_id?: string | null
    // 允许的国家代码
    allowlisted_country_codes?: string[]
    // 替代文本
    alt_text?: string
    // 是否自动发布文本
    auto_publish_text?: boolean
    // 话题标签
    topic_tag?: string
    // 链接附件 URL
    link_attachment_url?: string
    // 回复的 Threads 帖子 ID
    reply_to_id?: string
    // 引用的 Threads 帖子 ID
    quote_post_id?: string
  }
  twitter?: PlatformPublishOption & {
    // 回复的推文 ID
    reply_to_tweet_id?: string
    // 回复权限
    replySettings?: 'following' | 'mentionedUsers' | 'subscribers' | 'verified'
    // 后端回复权限字段
    reply_settings?: 'following' | 'mentionedUsers' | 'subscribers' | 'verified'
    // 是否包含 AI 生成媒体
    madeWithAi?: boolean
    // 后端 AI 内容字段
    made_with_ai?: boolean
    // 投票配置
    poll?: {
      options: string[]
      durationMinutes: number
      replySettings?: 'following' | 'mentionedUsers' | 'subscribers' | 'verified'
    }
    // 媒体标记用户 ID（仅图片帖，最多 10 个）
    mediaTaggedUserIds?: string[]
    // 媒体无障碍描述（顺序需与媒体上传顺序一致）
    mediaMetadata?: {
      altText?: string
    }[]
    // 引用推文 ID
    quote_tweet_id?: string
    // 是否为付费合作
    paid_partnership?: boolean
    // 后端媒体替代文本字段
    alt_text?: string
  }
  douyin?: PlatformPublishOption & {
    // 分享 ID
    shareId?: string
    // 话题标签列表
    hashtag_list?: string[]
    // 标题
    title?: string
    // 短标题
    short_title?: string
    // 标题话题标签列表
    title_hashtag_list?: Record<string, unknown>[]
    // 自定义封面 URL
    custom_cover_image_url?: string
    // 封面时间戳，单位毫秒
    cover_tsp?: number
    // 下载类型 1-允许，2-不允许
    download_type?: number
    // 私密状态
    private_status?: number
    // 图片路径列表
    image_list_path?: string[]
    // 视频路径
    video_path?: string
  }
  KWAI?: PlatformPublishOption & {
    // 封面 URL
    cover?: string
    // 话题
    photo_topic?: string
    // 视频类型
    stereo_type?: string
    // 挂载商品 ID
    merchant_product_id?: string
  }
  linkedin?: PlatformPublishOption & {
    // 可见性
    visibility?: string
    // 发帖主体 URN
    authorUrn?: string
    // 分发渠道
    distribution?: string
    // 覆盖正文
    commentary?: string
    // 账号类型
    accountType?: string
  }
}

// 发布参数
export interface IPubParams {
  des: string
  // 视频和图片不能同时存在，存在图片本次发布则为图文，存在视频则本次发布为视频发布 --------------
  // 图片
  images?: IImgFile[]
  // 视频
  video?: IVideoFile
  // 话题
  topics?: string[]
  // 标题
  title?: string
  // 发布 每个平台的独有参数
  option: IPlatOption
}

// 发布数据 item
export interface PubItem {
  account: SocialAccount
  params: IPubParams
}

// b站分区 item
export interface BiblPartItem {
  description: string
  id: number
  name: string
  parent: number
  children: BiblPartItem[]
}

// YouTube视频分类 item
export interface YouTubeCategoryItem {
  id: string
  snippet: {
    title: string
    description?: string
  }
}
