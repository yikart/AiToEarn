import { Pagination } from '@aitoearn/common'
import { InjectModel } from '@nestjs/mongoose'
import { Document, FilterQuery, Model } from 'mongoose'
import { MultiloginAccounts } from '../schemas'
import { BaseRepository } from './base.repository'

export type MultiloginAccountDocument = MultiloginAccounts & Document

export interface ListMultiloginAccountParams extends Pagination {
  username?: string
  minMaxProfiles?: number
  maxMaxProfiles?: number
  hasAvailableSlots?: boolean
}

export class MultiloginAccountRepository extends BaseRepository<MultiloginAccountDocument> {
  constructor(
    @InjectModel(MultiloginAccounts.name) multiloginAccountModel: Model<MultiloginAccountDocument>,
  ) {
    super(multiloginAccountModel)
  }

  async listWithPagination(params: ListMultiloginAccountParams): Promise<[MultiloginAccountDocument[], number]> {
    const { page, pageSize, username, minMaxProfiles, maxMaxProfiles, hasAvailableSlots } = params

    const filter: FilterQuery<MultiloginAccountDocument> = {}
    if (username)
      filter.username = username
    if (minMaxProfiles !== undefined)
      filter.maxProfiles = { $gte: minMaxProfiles }
    if (maxMaxProfiles !== undefined)
      filter.maxProfiles = { ...filter.maxProfiles, $lte: maxMaxProfiles }
    if (hasAvailableSlots === true)
      filter.$expr = { $lt: ['$currentProfiles', '$maxProfiles'] }
    else if (hasAvailableSlots === false)
      filter.$expr = { $gte: ['$currentProfiles', '$maxProfiles'] }

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
    })
  }
}
