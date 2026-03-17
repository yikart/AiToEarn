import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { MaterialAdaptation } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class MaterialAdaptationRepository extends BaseRepository<MaterialAdaptation> {
  constructor(
    @InjectModel(MaterialAdaptation.name)
    private readonly materialAdaptationModel: Model<MaterialAdaptation>,
  ) {
    super(materialAdaptationModel)
  }

  async getByMaterialIdAndPlatform(materialId: string, platform: string): Promise<MaterialAdaptation | null> {
    return this.findOne({ materialId, platform })
  }

  async listByMaterialId(materialId: string): Promise<MaterialAdaptation[]> {
    return this.find({ materialId })
  }

  async upsertByMaterialIdAndPlatform(
    materialId: string,
    userId: string,
    platform: string,
    data: {
      title?: string
      desc?: string
      topics: string[]
      platformOptions?: Record<string, unknown>
    },
  ): Promise<MaterialAdaptation> {
    const result = await this.materialAdaptationModel.findOneAndUpdate(
      { materialId, platform },
      { $set: { userId, ...data } },
      { upsert: true, new: true },
    ).lean({ virtuals: true })
    return result!
  }

  async updateByMaterialIdAndPlatform(
    materialId: string,
    platform: string,
    data: { title?: string, desc?: string, topics?: string[] },
  ): Promise<MaterialAdaptation | null> {
    return this.updateOne({ materialId, platform }, { $set: data })
  }

  async deleteByMaterialIdAndPlatform(materialId: string, platform: string): Promise<boolean> {
    const res = await this.materialAdaptationModel.deleteOne({ materialId, platform })
    return res.deletedCount > 0
  }

  async deleteManyByMaterialId(materialId: string): Promise<boolean> {
    const res = await this.materialAdaptationModel.deleteMany({ materialId })
    return res.deletedCount > 0
  }
}
