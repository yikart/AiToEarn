import { Injectable } from '@nestjs/common'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { UserPortrait, UserPortraitRepository } from '@yikart/task-db'
import { ReportUserPortraitDto, UserPortraitListQueryDto } from './user-portrait.dto'

@Injectable()
export class UserPortraitService {
  constructor(
    private readonly taskPunishRepository: UserPortraitRepository,
    private eventEmitter: EventEmitter2,
  ) { }

  /**
   * 报告用户画像数据
   * @param data
   */
  async reportUserPortrait(data: ReportUserPortraitDto): Promise<void> {
    const newData = {
      ...data,
      lastLoginTime: data.lastLoginTime ? new Date(data.lastLoginTime) : undefined,
    }

    const res = await this.taskPunishRepository.findOneAndUpdate(
      data.userId,
      newData,
    )

    if (res) {
      this.eventEmitter.emit('user.portrait.report', res)
    }
  }

  async getUserPortrait(userId: string): Promise<UserPortrait | null> {
    return await this.taskPunishRepository.getUserPortrait(userId)
  }

  async listUserPortraits(query: UserPortraitListQueryDto): Promise<{ list: UserPortrait[], total: number }> {
    const filter = {
      ...query.filter,
      time: query.filter?.time ? [new Date(query.filter.time[0]), new Date(query.filter.time[1])] as [Date, Date] : undefined,
    }
    return await this.taskPunishRepository.listUserPortraits(query.page, filter)
  }

  /**
   * 更改违约次数
   * @param payload
   */
  @OnEvent('user.portrait.updateTotalViolations')
  async updateTotalViolations(payload: {
    userId: string
    count: number
  }) {
    await this.taskPunishRepository.updateTotalViolations(
      payload,
    )
  }
}
