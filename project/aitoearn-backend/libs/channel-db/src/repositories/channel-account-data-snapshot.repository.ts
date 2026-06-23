import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { DB_CONNECTION_NAME } from '../common'
import { ChannelAccountDataSnapshot } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class ChannelAccountDataSnapshotRepository extends BaseRepository<ChannelAccountDataSnapshot> {
  constructor(
    @InjectModel(ChannelAccountDataSnapshot.name, DB_CONNECTION_NAME)
    private readonly channelAccountDataSnapshotModel: Model<ChannelAccountDataSnapshot>,
  ) {
    super(channelAccountDataSnapshotModel)
  }
}
