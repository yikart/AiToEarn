import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { DB_CONNECTION_NAME } from '../common'
import { ChannelWorkDataSnapshot } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class ChannelWorkDataSnapshotRepository extends BaseRepository<ChannelWorkDataSnapshot> {
  constructor(
    @InjectModel(ChannelWorkDataSnapshot.name, DB_CONNECTION_NAME)
    private readonly channelWorkDataSnapshotModel: Model<ChannelWorkDataSnapshot>,
  ) {
    super(channelWorkDataSnapshotModel)
  }
}
