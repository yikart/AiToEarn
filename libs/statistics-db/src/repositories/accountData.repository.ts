import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import dayjs from 'dayjs'
import { Connection, Model, RootFilterQuery } from 'mongoose'
import { NewChannel } from '../schemas/account.schema'
import { AuthorDatas } from '../schemas/authorData.schema'
import { BaseRepository } from './base.repository'

@Injectable()
export class AccountDataRepository extends BaseRepository<AuthorDatas> implements OnModuleInit {
  private readonly logger = new Logger(AccountDataRepository.name)

  constructor(
    @InjectConnection('statistics-db-connection') private readonly connection: Connection,
  ) {
    super(null as any) // 临时使用null，稍后会设置正确的模型
  }

  async onModuleInit() {
    // 等待数据库连接建立
    await this.waitForConnection()
  }

  /**
   * 根据平台获取模型
   */
  private getModelByPlatform(platform: string): Model<AuthorDatas> {
    // 根据平台名称格式化模型名称
    let formattedPlatform = platform.charAt(0).toUpperCase() + platform.slice(1)

    // 特殊处理各个平台名称
    if (platform === 'douyin') {
      formattedPlatform = 'DouYin'
    }
    else if (platform === 'wxGzh') {
      formattedPlatform = 'Gzh'
    }
    else if (platform === 'wxSph') {
      formattedPlatform = 'Sph'
    }
    else if (platform === 'facebook') {
      formattedPlatform = 'FaceBook'
    }
    else if (platform === 'xhs') {
      formattedPlatform = 'Xhs'
    }
    else if (platform === 'threads') {
      formattedPlatform = 'Threads'
    }
    else if (platform === 'linkedin') {
      formattedPlatform = 'LinkedIn'
    }
    else if (platform === 'instagram') {
      formattedPlatform = 'Instagram'
    }
    else if (platform === 'tiktok') {
      formattedPlatform = 'Tiktok'
    }
    else if (platform === 'twitter') {
      formattedPlatform = 'Twitter'
    }
    else if (platform === 'pinterest') {
      formattedPlatform = 'Pinterest'
    }
    else if (platform === 'youtube') {
      formattedPlatform = 'Youtube'
    }
    else if (platform === 'KWAI') {
      formattedPlatform = 'Kwai'
    }
    else if (platform === 'bilibili') {
      formattedPlatform = 'Bilibili'
    }

    const modelName = `${formattedPlatform}AuthorDayDatas`
    return this.connection.model(modelName) as Model<AuthorDatas>
  }

  /**
   * 获取AccountDayIncrease模型
   */
  private getAccountDayIncreaseModel(): Model<AuthorDatas> {
    return this.connection.model('AccountDayIncrease') as Model<AuthorDatas>
  }

  /**
   * 获取PostDayIncrease模型
   */
  private getPostDayIncreaseModel(): Model<AuthorDatas> {
    return this.connection.model('PostDayIncrease') as Model<AuthorDatas>
  }

  /**
   * 获取NewChannel模型
   */
  private getNewChannelModel(): Model<NewChannel> {
    return this.connection.model('NewChannel') as Model<NewChannel>
  }

  /**
   * 字段重命名工具：根据映射表重命名对象的顶层字段
   * 默认映射：followring -> fans，fave -> collect
   * 仅转换返回数据结构，不改动数据库字段
   */
  private renameIncreaseFields<T extends Record<string, unknown>>(
    source: T,
    mapping: Record<string, string> = {
      followerCountIncrease: 'fansCountIncrease',
      viewCountIncrease: 'readCountIncrease',
      favoriteCountIncrease: 'collectCountIncrease',
      shareCountIncrease: 'forwardCountIncrease',
      postCountIncrease: 'workCountIncrease',
    },
  ): T & Record<string, unknown> {
    const result: Record<string, unknown> = { ...source }
    for (const [fromKey, toKey] of Object.entries(mapping)) {
      if (Object.prototype.hasOwnProperty.call(result, fromKey)) {
        result[toKey] = result[fromKey]
        delete result[fromKey]
      }
    }
    return result as T & Record<string, unknown>
  }

  /**
   * 字段重命名工具：根据映射表重命名对象的顶层字段
   * 默认映射：followring -> fans，fave -> collect
   * 仅转换返回数据结构，不改动数据库字段
   */
  private renameIncre2CountFields<T extends Record<string, unknown>>(
    source: T,
    mapping: Record<string, string> = {
      followerCountIncrease: 'fansCount',
      viewCountIncrease: 'readCount',
      favoriteCountIncrease: 'collectCount',
      shareCountIncrease: 'forwardCount',
      postCountIncrease: 'workCount',
      likeCountIncrease: 'likeCount',
      followingCountIncrease: 'followingCount',
      commentCountIncrease: 'commentCount',
    },
  ): T & Record<string, unknown> {
    const result: Record<string, unknown> = { ...source }
    for (const [fromKey, toKey] of Object.entries(mapping)) {
      if (Object.prototype.hasOwnProperty.call(result, fromKey)) {
        result[toKey] = result[fromKey]
        delete result[fromKey]
      }
    }
    return result as T & Record<string, unknown>
  }

  /**
   * 等待数据库连接建立
   */
  private async waitForConnection(maxAttempts = 30): Promise<void> {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const currentState = this.connection.readyState
      this.logger.log(`等待数据库连接... (${attempt}/${maxAttempts}) - 状态: ${states[currentState as keyof typeof states]} (${currentState})`)
      this.logger.log(`数据库：- ${this.connection.db?.databaseName}`)
      if (currentState === 1) {
        this.logger.log('数据库连接已建立')
        return
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    this.logger.error('数据库连接超时')
  }

  /**
   * 获取数据库连接状态
   */
  async getConnectionState(): Promise<number> {
    return this.connection.readyState
  }

  /**
   * 调试方法：获取集合信息
   */
  async getCollectionInfo(platform: string) {
    const model = this.getModelByPlatform(platform)
    const collectionName = model.collection.name
    const dbName = this.connection.db?.databaseName

    this.logger.log(`数据库: ${dbName}`)
    this.logger.log(`集合名称: ${collectionName}`)
    this.logger.log(`模型名称: ${model.modelName}`)

    return {
      database: dbName,
      collection: collectionName,
      modelName: model.modelName,
      connectionState: this.connection.readyState,
    }
  }

  /**
   * 检查数据库连接状态
   */
  private async checkConnection(model: Model<AuthorDatas>): Promise<boolean> {
    try {
      // 检查连接状态
      const state = this.connection.readyState
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      }

      this.logger.debug(`当前连接状态: ${states[state as keyof typeof states]} (${state})`)

      if (state !== 1) {
        this.logger.error(`数据库连接状态异常: ${states[state as keyof typeof states]}`)
        return false
      }

      // 检查 db 对象是否存在
      if (!this.connection.db) {
        this.logger.error('数据库连接对象不存在')
        return false
      }

      // 执行一个简单的查询来检查连接
      await model.findOne().limit(1).lean()
      this.logger.debug('数据库连接检查通过')
      return true
    }
    catch (error) {
      this.logger.error('数据库连接检查失败:', error)
      return false
    }
  }

  /**
   * 带重试的数据库操作
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000,
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      }
      catch (error: unknown) {
        const e = error as Error
        this.logger.warn(`数据库操作失败，尝试 ${attempt}/${maxRetries}:`, e.message)

        if (attempt === maxRetries) {
          throw error
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
    throw new Error('所有重试都失败了')
  }

  /**
   * 根据账号和日期查询作者数据
   */
  async getAuthorDataByDate(accountId: string, platform: string, date: [Date, Date]) {
    const model = this.getModelByPlatform(platform)

    // 检查连接状态
    const isConnected = await this.checkConnection(model)
    if (!isConnected) {
      throw new Error('数据库连接不可用')
    }

    // const { start, end } = this.toolsService.getDayRangeUTC(date)

    return this.executeWithRetry(async () => {
      return model.findOne({
        accountId,
        updateTime: {
          $gte: date[0],
          $lte: date[1],
        },
      })
    })
  }

  /**
   * 根据账号查询频道最新数据
   */
  async getAccountDataLatest(accountId: string, platform: string, uid: string) {
    const model = this.getModelByPlatform(platform)

    this.logger.debug(`查询账号 ${accountId} 在平台 ${platform} 的最新数据`)

    return this.executeWithRetry(async () => {
      const result = await model.findOne({ uid }).sort({ snapshotDate: -1 })
      this.logger.debug(`查询结果: ${JSON.stringify(result)}`)
      return result
    })
  }

  /**
   * 根据账号查询频道最新增量数据
   */
  async getAccountDataIncrease(platform: string, uid: string) {
    return this.executeWithRetry(async () => {
      const result = await this.getAccountDayIncreaseModel().findOne({ platform, uid }).sort({ snapshotDate: -1 })
      this.logger.debug(`AccountDayIncrease result: ${JSON.stringify(result)}`)
      return result
    })
  }

  /**
   * 根据账号查询作品最新增量数据
   */
  async getPostDataIncrease(platform: string, uid: string) {
    return this.executeWithRetry(async () => {
      const result = await this.getPostDayIncreaseModel().findOne({ platform, uid }).sort({ snapshotDate: -1 })
      this.logger.debug(`PostDataIncrease result: ${JSON.stringify(result)}`)
      return result
    })
  }

  /**
   * 根据查询条件筛选账号
   */
  async getAccountDataByParams(params: RootFilterQuery<AuthorDatas>, sort: string, pageNo: number, pageSize: number) {
    return this.executeWithRetry(async () => {
      let result
      if (sort) {
        result = await this.getAccountDayIncreaseModel().find(params).sort(sort).skip(Math.floor(pageNo * pageSize)).limit(pageSize)
      }
      else {
        result = await this.getAccountDayIncreaseModel().find(params).skip(Math.floor(pageNo * pageSize)).limit(pageSize)
      }
      this.logger.debug(`查询结果: ${JSON.stringify(result)}`)
      return result
    })
  }

  /**
   * 根据账号查询频道一段时间数据
   */
  async getAccountDataPeriod(accountId: string, platform: string, uid: string, startDate: string, endDate: string) {
    const model = this.getModelByPlatform(platform)

    // 转换日期格式 - 参考 getChannelDataPeriodByUids 的实现
    const start = dayjs(startDate).startOf('day')
    const end = dayjs(endDate).endOf('day')

    this.logger.debug(`查询账号 ${accountId} 在平台 ${platform} ${uid}从 ${startDate} 到 ${endDate} 的数据`)
    return this.executeWithRetry(async () => {
      // 使用聚合查询，将字符串日期转换为Date对象后进行范围查询
      const result = await model.aggregate([
        { $match: { uid } },
        {
          $addFields: {
            snapshotDateAsDate: {
              $dateFromString: {
                dateString: '$snapshotDate',
                onError: null, // 解析失败时为 null
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
        { $sort: { snapshotDateAsDate: 1 } },
      ]).exec()

      this.logger.log(`聚合查询结果数量: ${result.length}`)
      return result
    })
  }

  /**
   * 根据platform和uid数组查询频道最新数据并汇总fansCount
   * @param queries 包含platform和uid组合的数组
   * @returns 汇总后的fansCount总数和查询到的所有数据
   */
  async getChannelDataLatestByUids(queries: Array<{ platform: string, uid: string }>) {
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error('查询参数必须是非空数组')
    }

    return this.executeWithRetry(async () => {
      const items: Array<{
        platform: string
        uid: string
        data: any
        increaseCount: any
        followerCount: number
      }> = []
      let totalFollowerCount = 0 // 总粉丝数
      let totalFollowerCountIncrease = 0 // 昨日新增总粉丝数

      // 遍历每个查询条件
      for (const query of queries) {
        const { platform, uid } = query
        const model = this.getModelByPlatform(platform)

        // 查询该平台和uid的最新数据
        const [result] = (await model.find({ uid }).sort({ snapshotDate: -1 }).limit(1))

        // 查询该平台和uid的最新增量数据
        const increaseQuery = await this.getAccountDataIncrease(platform, uid)
        const increaseResult: any = {}
        if (increaseQuery) {
          const iq = increaseQuery as any
          // 只有当字段存在且不为 undefined 时才添加到结果中
          // 确保能正确访问字段，处理 Mongoose Document 的情况
          const iqObj = iq.toObject ? iq.toObject() : JSON.parse(JSON.stringify(iq))

          if (iqObj.dailyDelta)
            increaseResult.dailyDelta = iqObj.dailyDelta
          // if (iqObj.increase7)
          //   increaseResult.increase7 = iqObj.increase7
          // if (iqObj.increase30)
          //   increaseResult.increase30 = iqObj.increase30
          // 可以根据需要添加其他需要的字段
          // 例如：if (iq.updateTime) increaseResult.updateTime = iq.updateTime
        }
        if (result) {
          items.push({
            platform,
            uid,
            data: result,
            increaseCount: increaseResult || {},
            followerCount: result.followerCount || 0,
          })
          // 累加fansCount
          totalFollowerCount += (result.followerCount || 0)
          // 累加 粉丝增量（安全判断，兼容两种拼写）
          const fansIncRaw = ((increaseQuery as any)?.increase?.fansCountIncrease ?? (increaseQuery as any)?.increase?.fansCountIncrese ?? 0)
          const fansInc = typeof fansIncRaw === 'number' ? fansIncRaw : Number(fansIncRaw) || 0
          totalFollowerCountIncrease += fansInc
        }
        else {
          // 如果没有找到数据，也记录一下
          items.push({
            platform,
            uid,
            increaseCount: {},
            data: null,
            followerCount: 0,
          })
        }
      }

      this.logger.debug(`查询结果数量: ${items.length}, 总fansCount: ${totalFollowerCount}`)

      return {
        totalFollowerCount,
        totalFollowerCountIncrease,
        items,
        queryCount: queries.length,
        successCount: items.filter(r => r.data !== null).length,
      }
    })
  }

  /**
   * 根据platform和uid数组查询频道一段时间增量数据
   * @param queries 包含platform和uid组合的数组
   * @param startDate 可选，格式示例 '2025-09-01'（默认 7 天前）
   * @param endDate 可选，格式示例 '2025-09-04'（默认 昨天）
   * @returns 查询到的所有增量数据
   */
  async getChannelDataPeriodByUids(
    queries: Array<{ platform: string, uid: string }>,
    startDate?: string,
    endDate?: string,
  ) {
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error('查询参数必须是非空数组')
    }
    // 默认开始时间：7天前
    const start = startDate
      ? dayjs(startDate).startOf('day')
      : dayjs().subtract(7, 'day').startOf('day')

    // 默认结束时间：昨天
    const end = endDate
      ? dayjs(endDate).endOf('day')
      : dayjs().subtract(1, 'day').endOf('day')

    this.logger.log(`查询增量数据时间范围: ${start.format('YYYY-MM-DD')} 到 ${end.format('YYYY-MM-DD')}`)
    // 并发执行每个 uid 的查询，从增量数据库查询数据
    const promises = queries.map(async (q) => {
      const { platform, uid } = q
      try {
        // 从 AccountDayIncreaseModel 查询增量数据
        const docs = await this.getAccountDayIncreaseModel().aggregate([
          {
            $match: {
              uid,
              platform,
              businessDate: {
                $gte: start.format('YYYY-MM-DD'),
                $lte: end.format('YYYY-MM-DD'),
              },
            },
          },
          { $sort: { businessDate: 1 } },
        ]).exec()

        // 诊断：记录每个查询返回的数量（便于排查）
        this.logger.debug(`[diag] 增量数据查询 platform=${platform} uid=${uid} matched=${Array.isArray(docs) ? docs.length : 0}`)

        return { platform, uid, items: docs && docs.length ? docs : null }
      }
      catch (err: any) {
        this.logger.warn(`[diag] 增量数据查询失败 platform=${platform} uid=${uid} -> ${err?.message || err}`)
        return { platform, uid, items: null, error: err?.message || String(err) }
      }
    })

    const results = await Promise.all(promises)

    // 提取 dailyDelta 字段并替换为 items 字段
    const items = results.map((r) => {
      if (!Array.isArray(r.items) || r.items.length === 0) {
        return {
          platform: r.platform,
          uid: r.uid,
          items: null,
          error: (r as any).error,
        }
      }

      // 从每个文档中提取 dailyDelta 字段，并应用字段重命名
      const dailyDeltaItems = r.items.map((doc: any) => {
        if (doc.dailyDelta && typeof doc.dailyDelta === 'object') {
          // 将 dailyDelta 中的字段提取出来，并应用字段重命名
          const dailyDeltaData = this.renameIncre2CountFields(doc.dailyDelta)
          return {
            ...dailyDeltaData,
            businessDate: doc.businessDate,
            platform: r.platform,
            uid: r.uid,
          }
        }
        return null
      }).filter(item => item !== null)

      return {
        platform: r.platform,
        uid: r.uid,
        items: dailyDeltaItems.length > 0 ? dailyDeltaItems : null,
        error: (r as any).error,
      }
    })

    // 将所有文档扁平化并按日期分组
    const groupedByDate: Record<string, any[]> = {}

    for (const r of items) {
      if (!r.items)
        continue
      for (const doc of r.items as any[]) {
        // 使用 businessDate 字段作为日期分组键
        const dateKey = (doc as any).businessDate ? dayjs((doc as any).businessDate).format('YYYY-MM-DD') : 'unknown'
        if (!groupedByDate[dateKey])
          groupedByDate[dateKey] = []
        groupedByDate[dateKey].push(doc)
      }
    }

    // 把 groupedByDate 转成有序数组，方便前端渲染
    const groupedArray = Object.keys(groupedByDate)
      .sort()
      .map(date => ({ date, records: groupedByDate[date], count: groupedByDate[date].length }))

    // 增量数据汇总
    // const increaseDelta = await this.getChannelDeltaByUids(queries)

    return {
      items,
      queryCount: queries.length,
      successCount: items.filter(r => r.items !== null).length,
      groupedByDate: groupedArray,
      // increaseDelta,
    }
  }

  /**
   * 根据platform和uid数组查询频道最新增量
   * @param queries 包含platform和uid组合的数组
   * @returns 返回dailyDelta字段的汇总数据
   */
  async getChannelDeltaByUids(queries: Array<{ platform: string, uid: string }>) {
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error('查询参数必须是非空数组')
    }
    // 昨天
    const yesterday = dayjs().subtract(1, 'day').endOf('day')
    // 并发执行每个 uid 的查询
    const promises = queries.map(async (q) => {
      const { platform, uid } = q
      try {
        // 从AccountDayIncreaseModel查询数据
        const docs = await this.getAccountDayIncreaseModel().aggregate([
          {
            $match: {
              uid,
              platform,
              businessDate: yesterday.toDate(),
            },
          },
          { $sort: { businessDate: 1 } },
        ]).exec()

        // 诊断：记录每个查询返回的数量
        this.logger.debug(`[diag] platform=${platform} uid=${uid} matched=${Array.isArray(docs) ? docs.length : 0}`)

        return { platform, uid, items: docs && docs.length ? docs : null }
      }
      catch (err: any) {
        this.logger.warn(`[diag] 查询失败 platform=${platform} uid=${uid} -> ${err?.message || err}`)
        return { platform, uid, items: null, error: err?.message || String(err) }
      }
    })

    // 执行
    const results = await Promise.all(promises)

    // 汇总dailyDelta字段
    const summary = this.summarizeDailyDelta(results)

    return {
      dailyDelta: {
        summary,
        // details: results,
      },
      queryDate: yesterday.format('YYYY-MM-DD'),
      totalQueries: queries.length,
      successCount: results.filter(r => r.items && !r.error).length,
      errorCount: results.filter(r => r.error).length,
    }
  }

  /**
   * 汇总dailyDelta字段的数值
   * @param results 查询结果数组
   * @returns dailyDelta字段汇总结果
   */
  private summarizeDailyDelta(results: Array<{ platform: string, uid: string, items: any[] | null, error?: string }>) {
    // 定义dailyDelta中需要汇总的数值字段
    const deltaFields = [
      'followerCountIncrease',
      'followingCountIncrease',
      'viewCountIncrease',
      'likeCountIncrease',
      'favoriteCountIncrease',
      'shareCountIncrease',
      'commentCountIncrease',
      'postCountIncrease',
    ]

    // 初始化汇总对象
    const summary: Record<string, number> = {}
    deltaFields.forEach((field) => {
      summary[field] = 0
    })

    // 遍历所有查询结果
    results.forEach((result) => {
      if (result.items && Array.isArray(result.items)) {
        result.items.forEach((item) => {
          // 检查是否存在dailyDelta字段
          if (item.dailyDelta && typeof item.dailyDelta === 'object') {
            // 对dailyDelta中的每个数值字段进行累加
            deltaFields.forEach((field) => {
              const value = item.dailyDelta[field]
              if (typeof value === 'number' && !Number.isNaN(value)) {
                summary[field] += value
              }
            })
          }
        })
      }
    })

    // 应用字段重命名映射
    const renamedSummary = this.renameIncreaseFields(summary)

    return renamedSummary
  }

  /**
   * 新增账号推送
   */
  async setNewChannels(platform: string, uid: string) {
    return this.executeWithRetry(async () => {
      const newData = { type: platform, uid }
      const result = await this.getNewChannelModel().updateOne({ type: platform, uid }, { $set: newData }, { upsert: true })
      this.logger.debug(`setNewChannels result: ${JSON.stringify(result)}`)
      return result
    })
  }
}
