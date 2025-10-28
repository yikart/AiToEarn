import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { MultiloginAccount } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListMultiloginAccountParams extends Pagination {
  email?: string
  minMaxProfiles?: number
  maxMaxProfiles?: number
  hasAvailableSlots?: boolean
}

export class MultiloginAccountRepository extends BaseRepository<MultiloginAccount> {
  constructor(
    @InjectModel(MultiloginAccount.name) multiloginAccountModel: Model<MultiloginAccount>,
  ) {
    super(multiloginAccountModel)
  }

  async listWithPagination(params: ListMultiloginAccountParams) {
    const { page, pageSize, email, minMaxProfiles, maxMaxProfiles, hasAvailableSlots } = params

    const filter: FilterQuery<MultiloginAccount> = {}
    if (email)
      filter.email = email
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
