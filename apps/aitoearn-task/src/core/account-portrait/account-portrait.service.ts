import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { TableDto } from '@yikart/common'
import { AccountPortrait, AccountPortraitRepository, UserPortrait } from '@yikart/task-db'
import { FilterSetDto } from '../../common/filter-set.dto'
import { convertFilterSetToMongoQuery } from '../../utils/filter-set/filter-set.util'
import { UserPortraitService } from '../user-portrait'
import { ReportAccountPortraitDto } from './account-portrait.dto'

@Injectable()
export class AccountPortraitService {
  constructor(
    private readonly accountPortraitRepository: AccountPortraitRepository,
    private readonly userPortraitService: UserPortraitService,
  ) { }

  /**
   *  up ai same account
   * @param data
   */
  async reportAccountPortrait(data: ReportAccountPortraitDto): Promise<boolean> {
    // 如果用户ID被更新，获取用户画像数据, 并更新用户字段数据
    if (data.userId) {
      const userPortrait = await this.userPortraitService.getUserPortrait(
        data.userId,
      )

      if (userPortrait) {
        data.userPortrait = userPortrait
      }
    }

    return this.accountPortraitRepository.reportAccountPortrait(data)
  }

  async getAccountPortrait(accountId: string): Promise<AccountPortrait | null> {
    return await this.accountPortraitRepository.getAccountPortrait(accountId)
  }

  async listAccountPortraits(page: TableDto, filter: { keyword?: string, taskId?: string, rule?: FilterSetDto }): Promise<{ list: AccountPortrait[], total: number }> {
    const { pageNo, pageSize } = page

    // 构建基础匹配条件
    const baseMatch: any = {}

    // 关键字搜索条件
    if (filter.keyword) {
      baseMatch.$or = [
        { accountId: new RegExp(filter.keyword, 'i') },
        { nickname: new RegExp(filter.keyword, 'i') },
      ]
    }

    // 规则过滤条件
    let ruleFilter: any = {}
    if (filter.rule) {
      ruleFilter = convertFilterSetToMongoQuery(filter.rule)
    }

    const matchCondition = { ...baseMatch, ...ruleFilter }

    // 使用聚合管道进行关联查询和过滤
    const pipeline: any[] = []

    // 第一步：基础匹配（条件性添加）
    if (Object.keys(matchCondition).length > 0) {
      pipeline.push({ $match: matchCondition })
    }

    // 第二步：左连接TaskOpportunity集合
    pipeline.push({
      $lookup: {
        from: 'taskOpportunities', // TaskOpportunity集合名称（可能需要根据实际情况调整）
        localField: 'accountId',
        foreignField: 'accountId',
        as: 'taskOpportunities',
      },
    })

    // 第三步：过滤掉已经在TaskOpportunity中有记录的账户
    pipeline.push({
      $match: {
        'taskOpportunities.taskId': { $ne: filter.taskId },
      },
    })

    // 第四步：移除临时字段
    pipeline.push({
      $project: {
        taskOpportunities: 0,
      },
    })

    // 第五步：排序
    pipeline.push({
      $sort: { totalFollowers: -1 },
    })

    const listPipeline: any[] = [
      ...pipeline,
      { $skip: (pageNo - 1) * pageSize },
      { $limit: pageSize },
    ]

    const totalPipeline: any[] = [
      ...pipeline,
      { $count: 'count' },
    ]

    const [list, totalResult] = await Promise.all([
      this.accountPortraitRepository.aggregate(listPipeline),
      this.accountPortraitRepository.aggregate(totalPipeline),
    ])

    const total = totalResult[0]?.count || 0

    return {
      list,
      total,
    }
  }

  // 用户画像数据更新-引起账号数据更新
  @OnEvent('user.portrait.report')
  async updateAccountUserPortrait(payload: {
    userId: string
    userPortrait: UserPortrait
  }): Promise<void> {
    this.accountPortraitRepository.updateAccountUserPortrait(payload)
  }
}
