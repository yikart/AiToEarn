import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { WithdrawRecordRepository, WithdrawRecordStatus } from '@yikart/mongodb'

@Injectable()
export class WithdrawAdminService {
  constructor(
    private readonly withdrawRecordRepository: WithdrawRecordRepository,
  ) {}

  // 获取提现信息
  getInfo(id: string) {
    return this.withdrawRecordRepository.getById(id)
  }

  async getList(page: TableDto, query: { userId?: string, status?: WithdrawRecordStatus }) {
    const { pageNo, pageSize } = page
    const filter = {
      ...(query.userId && { userId: query.userId }),
      ...(query.status !== undefined && { status: query.status }),
    }

    const [list, total] = await Promise.all([
      this.withdrawRecordRepository.listWithAggregation([
        { $match: filter },
        {
          $addFields: {
            statusOrder: {
              $switch: {
                branches: [
                  { case: { $eq: ['$status', 0] }, then: 1 }, // WAIT 排第一
                  { case: { $eq: ['$status', 1] }, then: 2 }, // SUCCESS 排第二
                  { case: { $eq: ['$status', -1] }, then: 3 }, // FAIL 排第三
                ],
                default: 4,
              },
            },
          },
        },
        { $sort: { statusOrder: 1, createdAt: -1 } },
        { $skip: (pageNo - 1) * pageSize },
        { $limit: pageSize },
        {
          $project: {
            statusOrder: 0,
          },
        }, // 移除辅助字段
      ]),
      this.withdrawRecordRepository.countByFilter(filter),
    ])

    return {
      list,
      total,
    }
  }

  // 发放提现
  release(id: string, data: { desc?: string, screenshotUrls?: string[], status?: WithdrawRecordStatus }) {
    return this.withdrawRecordRepository.updateById(id, data)
  }
}
