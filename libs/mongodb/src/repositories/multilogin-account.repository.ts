import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { MultiloginAccounts } from '../schemas'

export class MultiloginAccountRepository {
  constructor(
    @InjectModel(MultiloginAccounts.name) private readonly multiloginAccountModel: Model<MultiloginAccounts>,
  ) {}

  async getById(id: string) {
    return await this.multiloginAccountModel.findById(id).exec()
  }

  async create(data: Partial<MultiloginAccounts>) {
    const created = new this.multiloginAccountModel(data)
    return await created.save()
  }

  async updateById(id: string, data: Partial<MultiloginAccounts>) {
    return await this.multiloginAccountModel.findByIdAndUpdate(id, data, { new: true }).exec()
  }

  async listWithPagination(filter: Record<string, unknown>, page: number, limit: number) {
    const skip = (page - 1) * limit
    const items = await this.multiloginAccountModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .exec()

    const total = await this.multiloginAccountModel.countDocuments(filter).exec()
    return {
      items,
      total,
      page,
      limit,
    }
  }
}
