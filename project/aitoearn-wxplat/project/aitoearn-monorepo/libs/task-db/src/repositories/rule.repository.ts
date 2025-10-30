import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, RootFilterQuery } from 'mongoose'
import { Rule } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class RuleRepository extends BaseRepository<Rule> {
  constructor(
    @InjectModel(Rule.name) private ruleModel: Model<Rule>,
  ) {
    super(ruleModel)
  }

  async findById(id: string): Promise<Rule | null> {
    return await this.ruleModel.findById(id).exec()
  }

  async update(id: string, updateDto: Partial<Rule>): Promise<Rule | null> {
    return await this.ruleModel
      .findByIdAndUpdate(id, updateDto)
      .exec()
  }

  async delete(id: string) {
    await this.ruleModel.deleteOne({ _id: id }).exec()
  }

  async getList(
    page: {
      pageNo: number
      pageSize: number
    },
    filter: {
      name?: string
    },
  ) {
    const { pageNo, pageSize } = page
    const queryFilter: RootFilterQuery<Rule> = {
      ...(filter.name && { name: filter.name }),
    }

    const [total, list] = await Promise.all([
      this.ruleModel.countDocuments(queryFilter),
      this.ruleModel
        .find(queryFilter)
        .skip((pageNo - 1) * pageSize)
        .limit(pageSize)
        .sort({ createdAt: -1 })
        .exec(),
    ])

    return {
      list,
      total,
    }
  }
}
