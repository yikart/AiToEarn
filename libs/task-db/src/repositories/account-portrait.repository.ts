import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, PipelineStage } from 'mongoose'
import { AccountStatus, AccountType } from '../enums'
import { AccountPortrait, UserPortrait } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class AccountPortraitRepository extends BaseRepository<AccountPortrait> {
  constructor(
    @InjectModel(AccountPortrait.name)
    private portraitModel: Model<AccountPortrait>,
  ) {
    super(portraitModel)
  }

  async reportAccountPortrait(data: {
    accountId?: string
    userId?: string
    type: AccountType
    uid: string
    avatar?: string
    nickname?: string
    status?: AccountStatus
    contentTags?: Record<string, number>
    totalFollowers?: number
    totalWorks?: number
    totalViews?: number
    totalLikes?: number
    totalCollects?: number
  }): Promise<boolean> {
    const oldData = await this.portraitModel.findOne({
      type: data.type,
      uid: data.uid,
    })

    if (!oldData) {
      const res = await this.portraitModel.create(data)
      return !!res
    }

    const res = await this.portraitModel.updateMany(
      { type: data.type, uid: data.uid },
      {
        $set: {
          ...data,
        },
        lastUpdatedAt: new Date(),
      },
    )
    return res.modifiedCount > 0
  }

  async getAccountPortrait(accountId: string): Promise<AccountPortrait | null> {
    return await this.portraitModel.findOne({ accountId }).exec()
  }

  aggregate(data: PipelineStage[]) {
    return this.portraitModel.aggregate(data).exec()
  }

  // 用户画像数据更新-引起账号数据更新
  async updateAccountUserPortrait(payload: {
    userId: string
    userPortrait: UserPortrait
  }): Promise<void> {
    const { userId, userPortrait } = payload
    this.portraitModel.updateMany(
      { userId },
      {
        $set: {
          userPortrait,
          lastUpdatedAt: new Date(),
        },
      },
    )
  }
}
