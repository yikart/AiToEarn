/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description: Material material
 */
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { MaterialTask } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class MaterialTaskRepository extends BaseRepository<MaterialTask> {
  logger = new Logger(MaterialTaskRepository.name)
  constructor(
    @InjectModel(MaterialTask.name)
    private readonly materialTaskModel: Model<MaterialTask>,
  ) {
    super(materialTaskModel)
  }

  override async create(newData: Partial<MaterialTask>) {
    return await this.materialTaskModel.create(newData)
  }

  async update(id: string, newData: Partial<MaterialTask>): Promise<boolean> {
    const res = await this.materialTaskModel.updateOne({ _id: id }, newData)
    return res.modifiedCount > 0
  }

  async getInfo(id: string) {
    return await this.materialTaskModel.findOne({ _id: id })
  }
}
