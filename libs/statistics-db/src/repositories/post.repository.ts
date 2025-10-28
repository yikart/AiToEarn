import { Injectable, Logger } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import dayjs from 'dayjs'
import { Connection, Model, PipelineStage, RootFilterQuery } from 'mongoose'
import { PostData } from '../common'
import { AccountType, PostDatas as PostModel } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class PostRepository extends BaseRepository<PostModel> {
  private models: { [key: string]: Model<PostModel> } = {}
  private readonly logger = new Logger(PostRepository.name)
  constructor(
    @InjectConnection('statistics-db-connection') private readonly connection: Connection,
  ) {
    super(null as any) // 临时使用null，稍后会设置正确的模型
    this.models = {} // 将在onModuleInit中初始化
  }

  async onModuleInit() {
    // 初始化模型映射
    this.models = {
      bilibili: this.connection.model('bilibili_snapshot') as Model<PostModel>,
      douyin: this.connection.model('douyin_snapshot') as Model<PostModel>,
      facebook: this.connection.model('facebook_snapshot') as Model<PostModel>,
      wxgzh: this.connection.model('wxgzh_snapshot') as Model<PostModel>,
      wxsph: this.connection.model('wxsph_snapshot') as Model<PostModel>,
      instagram: this.connection.model('instagram_snapshot') as Model<PostModel>,
      kwai: this.connection.model('kwai_snapshot') as Model<PostModel>,
      pinterest: this.connection.model('pinterest_snapshot') as Model<PostModel>,
      threads: this.connection.model('threads_snapshot') as Model<PostModel>,
      tiktok: this.connection.model('tiktok_snapshot') as Model<PostModel>,
      twitter: this.connection.model('twitter_snapshot') as Model<PostModel>,
      xhs: this.connection.model('xhs_snapshot') as Model<PostModel>,
      youtube: this.connection.model('youtube_snapshot') as Model<PostModel>,
      linkedin: this.connection.model('linkedin_snapshot') as Model<PostModel>,
    }
  }

  /**
   * 获取各平台的 Insights 模型（指向 `${platform}_post_insights_snapshot` 集合）
   * 使用统一的模型命名缓存：`${platform}_insights`
   */
  private getInsightsModel(platform: string): Model<PostModel> {
    const modelName = `${platform}_insights`
    if (this.connection.models[modelName]) {
      const existing = this.connection.models[modelName] as Model<PostModel>
      this.logger.debug(`Using insights collection (cached): ${existing.collection.name}`)
      return existing
    }
    // 复用与普通帖子相同的 Schema，但绑定到 insights 集合
    // 注意：PostSchema 已在模块层注册；这里直接通过连接创建/复用模型即可
    const collectionName = `${platform}_post_insights_snapshot`
    const model = this.connection.model<PostModel>(modelName, this.models['xhs'].schema, collectionName)
    this.logger.debug(`Using insights collection (new): ${model.collection.name}`)
    return model
  }

  /**
   * 获取各平台的 Insights 模型（指向 `${platform}_post_snapshot` 集合）
   * 使用统一的模型命名缓存：`${platform}_snapshot`
   */
  private getSnapshotModel(platform: string): Model<PostModel> {
    const modelName = `${platform}_snapshot`
    // if (this.connection.models[modelName]) {
    //   const existing = this.connection.models[modelName] as Model<PostModel>
    //   this.logger.debug(`Using insights collection (cached): ${existing.collection.name}`)
    //   return existing
    // }
    // 复用与普通帖子相同的 Schema，但绑定到 snapshot 集合
    // 注意：PostSchema 已在模块层注册；这里直接通过连接创建/复用模型即可
    const collectionName = `${platform}_post_snapshot`
    const model = this.connection.model<PostModel>(modelName, this.models['xhs'].schema, collectionName)
    this.logger.debug(`Using insights collection (new): ${model.collection.name}`)
    return model
  }

  // 根据平台platform和uid 获取作品
  async getPostsByPlatform(payload: {
    platform: AccountType
    uid: string
    page?: number
    pageSize?: number
  }) {
    const { uid } = payload
    const platform = (payload.platform as string).toLowerCase()
    const page = Math.max(1, payload.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, payload.pageSize ?? 20))

    const postModel = this.getSnapshotModel(platform)
    if (!postModel) {
      throw new Error(`Unsupported platform: ${payload.platform}`)
    }
    const skip = (page - 1) * pageSize
    const filters: RootFilterQuery<PostModel> = { uid, platform: payload.platform }
    this.logger.log(`${uid}, ${payload.platform}, ${postModel.collection.name}`)
    const [postDocs, total] = await Promise.all([
      postModel
        .find(filters, null, { sort: { publishTime: -1 }, skip, limit: pageSize + 1 })
        .lean(),
      postModel.countDocuments(filters),
    ])

    const hasMore = postDocs.length > pageSize
    if (hasMore) {
      postDocs.pop()
    }

    const posts: PostData[] = (postDocs).map(doc => ({
      id: doc._id.toString(),
      postId: doc.postId ?? '',
      platform: doc.platform ?? platform,
      title: doc.title ?? null,
      content: doc.desc ?? null,
      thumbnail: doc.cover ?? null,
      mediaType: (doc.mediaType as 'video' | 'image' | 'article') ?? 'image',
      permaLink: doc.url ?? null,
      publishTime: doc.publishTime ? new Date(doc.publishTime).getTime() : 0,
      viewCount: doc.viewCount ?? 0,
      commentCount: doc.commentCount ?? 0,
      likeCount: doc.likeCount ?? 0,
      shareCount: doc.shareCount ?? 0,
      clickCount: doc.clickCount ?? 0,
      impressionCount: doc.impressionCount ?? 0,
      favoriteCount: doc.favoriteCount ?? 0,
      updatedAt: doc.updatedAt ?? null,
    }))

    return {
      total,
      posts,
      hasMore,
    }
  }

  // 根据平台platform和作品id数组postIds 获取作品
  async getPostsByPids(
    payload: {
      platform: AccountType
      postIds: string[]
      page?: number
      pageSize?: number
    },
  ) {
    const platform = (payload.platform as string).toLowerCase()
    const page = Math.max(1, payload.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, payload.pageSize ?? 20))

    const postModel = this.models[platform]
    if (!postModel) {
      throw new Error(`Unsupported platform: ${payload.platform}`)
    }
    const skip = (page - 1) * pageSize
    const filters: RootFilterQuery<PostModel> = { postId: { $in: payload.postIds }, platform: payload.platform }

    const [postDocs, total] = await Promise.all([
      postModel
        .find(filters, null, { sort: { publishTime: -1 }, skip, limit: pageSize + 1 })
        .lean(),
      postModel.countDocuments(filters),
    ])

    const hasMore = postDocs.length > pageSize
    if (hasMore) {
      postDocs.pop()
    }

    const posts: PostData[] = (postDocs).map(doc => ({
      id: doc._id.toString(),
      postId: doc.postId ?? '',
      platform: doc.platform ?? platform,
      title: doc.title ?? null,
      content: doc.desc ?? null,
      thumbnail: doc.cover ?? null,
      mediaType: (doc.mediaType as 'video' | 'image' | 'article') ?? 'image',
      permaLink: doc.url ?? null,
      publishTime: doc.publishTime ? new Date(doc.publishTime).getTime() : 0,
      viewCount: doc.viewCount ?? 0,
      commentCount: doc.commentCount ?? 0,
      likeCount: doc.likeCount ?? 0,
      shareCount: doc.shareCount ?? 0,
      clickCount: doc.clickCount ?? 0,
      impressionCount: doc.impressionCount ?? 0,
      favoriteCount: doc.favoriteCount ?? 0,
      updatedAt: doc.updatedAt ?? null,
    }))

    return {
      total,
      posts,
      hasMore,
    }
  }

  // 根据平台platform和作品postId 获取单个作品数据
  async getPostsByPid(
    payload: {
      platform: AccountType
      postId: string
    },
  ) {
    const platform = (payload.platform as string).toLowerCase()

    const postModel = this.models[platform]
    if (!postModel) {
      throw new Error(`Unsupported platform: ${payload.platform}`)
    }
    // const skip = (page - 1) * pageSize
    const filters: RootFilterQuery<PostModel> = { postId: { $in: payload.postId } }

    const postDoc = await postModel.findOne(filters).lean()
    if (!postDoc) {
      return {}
    }

    const work = {
      id: postDoc._id.toString(),
      postId: postDoc.postId ?? '',
      platform: postDoc.platform ?? platform,
      title: postDoc.title ?? null,
      desc: postDoc.desc ?? null,
      cover: postDoc.cover ?? null,
      mediaType: (postDoc.mediaType as 'video' | 'image' | 'article') ?? 'image',
      url: postDoc.url ?? null,
      publishTime: postDoc.publishTime ? new Date(postDoc.publishTime).getTime() : 0,
      readCount: postDoc.viewCount ?? 0,
      commentCount: postDoc.commentCount ?? 0,
      likeCount: postDoc.likeCount ?? 0,
      forwardCount: postDoc.shareCount ?? 0,
      // clickCount: postDoc.clickCount ?? 0,
      // impressionCount: postDoc.impressionCount ?? 0,
      collectCount: postDoc.favoriteCount ?? 0,
    }
    return work
  }

  /**
   * 根据平台、postId 与时间范围查询帖子数据
   * - startDate 为空时，默认取 endDate 往前 90 天
   * - endDate 为空时，默认取今天
   * - 时间字段使用 publishTime（number 时间戳）
   */
  async getPostDataByDateRange(payload: {
    platform: string
    postId: string
    startDate?: string | number | Date
    endDate?: string | number | Date
    page?: number
    pageSize?: number
  }) {
    const platform = (payload.platform as string).toLowerCase()
    const page = Math.max(1, payload.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, payload.pageSize ?? 20))

    // 使用 insights 集合模型
    const postModel = this.getInsightsModel(platform)
    this.logger.debug(`Querying collection: ${postModel.collection.name}`)

    // 默认开始时间：90天前
    const start = payload.startDate
      ? dayjs(payload.startDate).startOf('day')
      : dayjs().subtract(90, 'day').startOf('day')

    // 默认结束时间：昨天
    const end = payload.endDate
      ? dayjs(payload.endDate).endOf('day')
      : dayjs().subtract(0, 'day').endOf('day')
    // snapshotDate 为 'YYYY-MM-DD' 字符串，范围需使用字符串比较
    const startStr = start.format('YYYY-MM-DD')
    const endStr = end.format('YYYY-MM-DD')
    const skip = (page - 1) * pageSize
    this.logger.debug(`Date range: ${startStr} ~ ${endStr}`)

    // 使用聚合，统一按 snapshotDate 字符串转换为日期后再筛选，避免字符串比较误差
    const pipeline: PipelineStage[] = [
      {
        $match: {
          postId: payload.postId,
          platform: { $regex: new RegExp(`^${payload.platform}$`, 'i') },
        },
      },
      {
        $addFields: {
          snapshotDateAsDate: {
            $dateFromString: {
              dateString: '$snapshotDate',
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $match: {
          snapshotDateAsDate: { $gte: start.toDate(), $lte: end.toDate() },
        },
      },
      { $sort: { snapshotDateAsDate: -1 } },
      {
        $facet: {
          rows: [{ $skip: skip }, { $limit: pageSize }],
          total: [{ $count: 'count' }],
        },
      },
      {
        $project: {
          rows: 1,
          total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
        },
      },
    ]

    const agg = await postModel.aggregate(pipeline).exec()
    const rows = (agg?.[0]?.rows || []) as PostModel[]
    const total = Number(agg?.[0]?.total || 0)
    const hasMore = skip + rows.length < total

    return {
      total,
      posts: rows as unknown as PostData[],
      hasMore,
    }
  }

  async getUserAllPosts(
    payload: {
      userId: string
      range?: {
        start: string | number
        end: string | number
      }
    },
  ) {
    const { userId } = payload
    const filters: RootFilterQuery<PostModel> = { userId }
    if (payload.range) {
      if (payload.range.start || payload.range.end) {
        const start = new Date(payload.range.start)
        const end = new Date(payload.range.end)
        filters.publishTime = { $gte: start, $lte: end }
      }
    }
    const platforms = [
      'bilibili',
      'douyin',
      'wxgzh',
      'instagram',
      'kwai',
      'pinterest',
      'threads',
      'tiktok',
      'twitter',
      'xhs',
      'youtube',
    ]
    const queries = []
    for (const platform of platforms) {
      const postModel = this.models[platform]
      if (postModel) {
        queries.push(
          postModel.find(filters, null, { sort: { publishTime: -1 } }).exec(),
        )
      }
    }
    const postDocGroups = await Promise.all(queries)
    const postDocs = postDocGroups.flat().sort((a, b) => {
      return new Date(b.publishTime || 0).getTime() - new Date(a.publishTime || 0).getTime()
    })
    const posts: PostData[] = postDocs.map(doc => ({
      id: doc.id,
      postId: doc.postId ?? '',
      platform: doc.platform,
      title: doc.title ?? null,
      content: doc.desc ?? null,
      thumbnail: doc.cover ?? null,
      mediaType: (doc.mediaType as 'video' | 'image' | 'article') ?? 'image',
      permaLink: doc.url ?? null,
      publishTime: doc.publishTime ? new Date(doc.publishTime).getTime() : 0,
      viewCount: doc.viewCount ?? 0,
      commentCount: doc.commentCount ?? 0,
      likeCount: doc.likeCount ?? 0,
      shareCount: doc.shareCount ?? 0,
      clickCount: doc.clickCount ?? 0,
      impressionCount: doc.impressionCount ?? 0,
      favoriteCount: doc.favoriteCount ?? 0,
      updatedAt: doc.updatedAt ?? null,
    }))

    return { total: posts.length, posts, hasMore: false }
  }

  async getUserAllPostsByPlatform(
    payload: {
      uid?: string
      userId: string
      platform?: string
      range?: {
        start: string | number
        end: string | number
      }
    },
  ) {
    const { uid, userId } = payload
    if (!payload.platform && !uid) {
      return this.getUserAllPosts(payload)
    }
    const platform = (payload.platform as string).toLowerCase()

    const postModel = this.models[platform]
    if (!postModel) {
      throw new Error(`Unsupported platform: ${payload.platform}`)
    }
    const filters: RootFilterQuery<PostModel> = { platform: payload.platform }
    if (uid) {
      filters.uid = uid
    }
    if (userId) {
      filters.userId = userId
    }
    if (payload.range) {
      if (payload.range.start || payload.range.end) {
        const start = new Date(payload.range.start)
        const end = new Date(payload.range.end)
        filters.publishTime = { $gte: start, $lte: end }
      }
    }

    const postDocs = await postModel.find(filters, null, { sort: { publishTime: -1 } })

    const posts: PostData[] = postDocs.map(doc => ({
      id: doc._id.toString(),
      postId: doc.postId ?? '',
      platform: doc.platform ?? platform,
      title: doc.title ?? null,
      content: doc.desc ?? null,
      thumbnail: doc.cover ?? null,
      mediaType: (doc.mediaType as 'video' | 'image' | 'article') ?? 'image',
      permaLink: doc.url ?? null,
      publishTime: doc.publishTime ? new Date(doc.publishTime).getTime() : 0,
      viewCount: doc.viewCount ?? 0,
      commentCount: doc.commentCount ?? 0,
      likeCount: doc.likeCount ?? 0,
      shareCount: doc.shareCount ?? 0,
      clickCount: doc.clickCount ?? 0,
      impressionCount: doc.impressionCount ?? 0,
      favoriteCount: doc.favoriteCount ?? 0,
      updatedAt: doc.updatedAt ?? null,
    }))

    return { total: posts.length, posts, hasMore: false }
  }

  /**
   * 计算查询到的作品列表中核心指标的平均值
   * - 输入范围由 payload 决定（如有传入 range 则按范围过滤）
   * - 平均字段：viewCount、commentCount、likeCount、shareCount
   * - 当无数据时，平均值返回 0
   */
  async getAverageSummaryMonthly(payload: {
    platform?: string
    userId: string
    range?: {
      start: string | number
      end: string | number
    }
  }) {
    const { posts, total } = await this.getUserAllPostsByPlatform(payload)

    if (!Array.isArray(posts) || posts.length === 0) {
      return {
        total: 0,
        averages: {
          viewCountAvg: 0,
          commentCountAvg: 0,
          likeCountAvg: 0,
          shareCountAvg: 0,
          favoriteCountAvg: 0,
        },
      }
    }

    const sums = posts.reduce(
      (acc, cur) => {
        acc.view += (cur.viewCount as number) || 0
        acc.comment += (cur.commentCount as number) || 0
        acc.like += (cur.likeCount as number) || 0
        acc.share += (cur.shareCount as number) || 0
        acc.favorite += (cur.favoriteCount as number) || 0
        return acc
      },
      { view: 0, comment: 0, like: 0, share: 0, favorite: 0 },
    )

    const count = posts.length
    return {
      total,
      averages: {
        viewCountAvg: Number((sums.view / count).toFixed(2)),
        commentCountAvg: Number((sums.comment / count).toFixed(2)),
        likeCountAvg: Number((sums.like / count).toFixed(2)),
        shareCountAvg: Number((sums.share / count).toFixed(2)),
        favoriteCountAvg: Number((sums.favorite / count).toFixed(2)),
      },
    }
  }
}
