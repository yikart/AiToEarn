import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { PostMediaContainer, PostMediaStatus } from '../../../libs/database/schema/postMediaContainer.schema'
import { CreatePostMediaContainerDto } from '../dto/meta.container.dto'

@Injectable()
export class PostMediaContainerService {
  constructor(
    @InjectModel(PostMediaContainer.name)
    private readonly metaPostMediaModel: Model<PostMediaContainer>,
  ) {}

  async createMetaPostMedia(
    data: CreatePostMediaContainerDto,
  ): Promise<PostMediaContainer> {
    return await this.metaPostMediaModel.insertOne(data)
  }

  async deleteMetaPostMedia(publishId: string): Promise<void> {
    await this.metaPostMediaModel.deleteMany({ publishId }).exec()
  }

  async upsertMetaPostMedia(
    data: CreatePostMediaContainerDto,
  ): Promise<PostMediaContainer> {
    return await this.metaPostMediaModel.findOneAndUpdate(
      { publishId: data.publishId, platform: data.platform },
      data,
      { upsert: true, new: true },
    ).exec()
  }

  async getContainers(publishId: string, jobId: string): Promise<PostMediaContainer[]> {
    return this.metaPostMediaModel.find({ publishId, jobId }).sort({ createdAt: 1 })
  }

  async getUnProcessedContainers(publishId: string): Promise<PostMediaContainer[]> {
    return this.metaPostMediaModel.find({ publishId, $or: [
      { status: PostMediaStatus.CREATED },
      { status: PostMediaStatus.IN_PROGRESS },
    ] }).exec()
  }

  async getCompletedContainersCount(publishId: string): Promise<number> {
    return this.metaPostMediaModel.countDocuments({ publishId, status: PostMediaStatus.FINISHED })
  }

  async updateContainer(
    id: string,
    data: Partial<CreatePostMediaContainerDto>,
  ): Promise<PostMediaContainer | null> {
    return this.metaPostMediaModel.findByIdAndUpdate(
      id,
      data,
      { new: true },
    ).exec()
  }
}
