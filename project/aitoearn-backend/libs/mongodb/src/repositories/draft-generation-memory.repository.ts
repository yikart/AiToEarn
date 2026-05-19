import type { DraftGenerationMemoryContentType } from '@yikart/aitoearn-ai-shared'
import type { UpdateQuery } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { DraftGenerationMemory } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class DraftGenerationMemoryRepository extends BaseRepository<DraftGenerationMemory> {
  constructor(
    @InjectModel(DraftGenerationMemory.name)
    private readonly draftGenerationMemoryModel: Model<DraftGenerationMemory>,
  ) {
    super(draftGenerationMemoryModel)
  }

  async getByUserIdAndContentType(userId: string, contentType: DraftGenerationMemoryContentType) {
    return await this.findOne({ userId, contentType })
  }

  async listByUserId(userId: string, contentType?: DraftGenerationMemoryContentType) {
    return await this.find(
      { userId, ...(contentType && { contentType }) },
      { sort: { contentType: 1 } },
    )
  }

  async updateByUserIdAndContentType(
    userId: string,
    contentType: DraftGenerationMemoryContentType,
    update: UpdateQuery<DraftGenerationMemory>,
  ) {
    return await this.draftGenerationMemoryModel.findOneAndUpdate(
      { userId, contentType },
      update,
      { upsert: true, new: true },
    ).lean({ virtuals: true }).exec()
  }

  async deleteItemByUserIdAndItemId(userId: string, itemId: string) {
    return await this.draftGenerationMemoryModel.findOneAndUpdate(
      { userId, 'items.id': itemId },
      { $pull: { items: { id: itemId } } },
      { new: true },
    ).lean({ virtuals: true }).exec()
  }
}
