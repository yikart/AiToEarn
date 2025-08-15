import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { BrowserProfile } from '../schemas'

export class BrowserProfileRepository {
  constructor(
    @InjectModel(BrowserProfile.name) private readonly browserProfileModel: Model<BrowserProfile>,
  ) {}

  async getById(id: string) {
    return await this.browserProfileModel.findById(id).exec()
  }

  async create(data: Partial<BrowserProfile>) {
    const created = new this.browserProfileModel(data)
    return await created.save()
  }

  async updateById(id: string, data: Partial<BrowserProfile>) {
    return await this.browserProfileModel.findByIdAndUpdate(id, data, { new: true }).exec()
  }

  async listWithPagination(filter: Record<string, unknown>, page: number, limit: number) {
    const skip = (page - 1) * limit
    const items = await this.browserProfileModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .exec()

    const total = await this.browserProfileModel.countDocuments(filter).exec()
    return {
      items,
      total,
      page,
      limit,
    }
  }
}
