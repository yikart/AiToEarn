import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { Model } from 'mongoose'
import { DB_CONNECTION_NAME } from '../common'
import { ChannelAuthIdentity } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class ChannelAuthIdentityRepository extends BaseRepository<ChannelAuthIdentity> {
  constructor(
    @InjectModel(ChannelAuthIdentity.name, DB_CONNECTION_NAME)
    channelAuthIdentityModel: Model<ChannelAuthIdentity>,
  ) {
    super(channelAuthIdentityModel)
  }

  async getByPlatformAndSubjectUid(platform: AccountType, subjectUid: string) {
    return this.findOne({ platform, subjectUid })
  }

  async createOrUpdateByPlatformAndSubjectUid(
    platform: AccountType,
    subjectUid: string,
    userId: string,
  ) {
    return this.updateOne(
      {
        platform,
        subjectUid,
      },
      { $set: { platform, subjectUid, userId } },
      { upsert: true },
    )
  }

  async deleteByPlatformAndUserId(platform: AccountType, userId: string): Promise<void> {
    await this.deleteOne({ platform, userId })
  }

  async deleteByPlatformAndSubjectUid(platform: AccountType, subjectUid: string): Promise<void> {
    await this.deleteOne({ platform, subjectUid })
  }
}
