import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model } from 'mongoose'
import { DB_CONNECTION_NAME } from '../common'
import { PostMediaContainer, PostMediaStatus } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class PostMediaContainerRepository extends BaseRepository<PostMediaContainer> {
  constructor(
    @InjectModel(PostMediaContainer.name, DB_CONNECTION_NAME) private postMediaContainerModel: Model<PostMediaContainer>,
  ) {
    super(postMediaContainerModel)
  }

  async add(data: Partial<PostMediaContainer>): Promise<PostMediaContainer> {
    return await this.postMediaContainerModel.create(data)
  }

  async deleteList(filter: FilterQuery<PostMediaContainer>): Promise<boolean> {
    const res = await this.postMediaContainerModel.deleteMany(filter).exec()
    return res.deletedCount > 0
  }

  async upsertInfo(filter: FilterQuery<PostMediaContainer>, data: Partial<PostMediaContainer>): Promise<PostMediaContainer> {
    return await this.postMediaContainerModel.findOneAndUpdate(
      filter,
      data,
      { upsert: true, new: true },
    ).lean({ virtuals: true }).exec()
  }

  async getList(publishId: string, jobId: string): Promise<PostMediaContainer[]> {
    return await this.postMediaContainerModel.find({ publishId, jobId }).lean({ virtuals: true }).exec()
  }

  async getUnProcessedList(publishId: string): Promise<PostMediaContainer[]> {
    return this.postMediaContainerModel.find({
      publishId,
      $or: [
        { status: PostMediaStatus.CREATED },
        { status: PostMediaStatus.IN_PROGRESS },
      ],
    }).lean({ virtuals: true }).exec()
  }

  async getCompletedCount(publishId: string): Promise<number> {
    return this.postMediaContainerModel.countDocuments({ publishId, status: PostMediaStatus.FINISHED })
  }

  async updateInfo(id: string, data: Partial<PostMediaContainer>): Promise<PostMediaContainer | null> {
    return await this.postMediaContainerModel.findByIdAndUpdate(
      id,
      data,
      { new: true },
    ).lean({ virtuals: true }).exec()
  }
}
