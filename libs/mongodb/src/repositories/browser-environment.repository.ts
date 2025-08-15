import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { BrowserEnvironment } from '../schemas'

export class BrowserEnvironmentRepository {
  constructor(
    @InjectModel(BrowserEnvironment.name) private readonly browserEnvironmentModel: Model<BrowserEnvironment>,
  ) {}

  async getById(id: string) {
    return await this.browserEnvironmentModel.findById(id).exec()
  }

  async create(data: Partial<BrowserEnvironment>) {
    const created = new this.browserEnvironmentModel(data)
    return await created.save()
  }

  async updateById(id: string, data: Partial<BrowserEnvironment>) {
    return await this.browserEnvironmentModel.findByIdAndUpdate(id, data, { new: true }).exec()
  }

  async listWithPagination(filter: Record<string, unknown>, page: number, limit: number) {
    const skip = (page - 1) * limit
    const items = await this.browserEnvironmentModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .exec()

    const total = await this.browserEnvironmentModel.countDocuments(filter).exec()
    return [items, total] as const
  }
}
