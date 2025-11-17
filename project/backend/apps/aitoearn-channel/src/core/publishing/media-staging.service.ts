import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { PostMediaContainer, PostMediaStatus } from '../../libs/database/schema/postMediaContainer.schema'
import { CreateMediaContainerDto } from './dto/media-container.dto'

@Injectable()
export class MediaStagingService {
  constructor(
    @InjectModel(PostMediaContainer.name)
    private readonly mediaContainerModel: Model<PostMediaContainer>,
  ) {}

  async createMediaContainer(
    data: CreateMediaContainerDto,
  ): Promise<PostMediaContainer> {
    return await this.mediaContainerModel.create(data)
  }

  async deleteMediaContainer(publishId: string): Promise<void> {
    await this.mediaContainerModel.deleteMany({ publishId }).exec()
  }

  async upsertMediaContainer(
    data: CreateMediaContainerDto,
  ): Promise<PostMediaContainer> {
    return await this.mediaContainerModel.findOneAndUpdate(
      { publishId: data.publishId, platform: data.platform },
      data,
      { upsert: true, new: true },
    ).exec()
  }

  async getMediaContainers(publishId: string, jobId: string): Promise<PostMediaContainer[]> {
    return this.mediaContainerModel.find({ publishId, jobId }).sort({ createdAt: 1 })
  }

  async getUnProcessedMediaContainers(publishId: string): Promise<PostMediaContainer[]> {
    return this.mediaContainerModel.find({ publishId, $or: [
      { status: PostMediaStatus.CREATED },
      { status: PostMediaStatus.IN_PROGRESS },
    ] }).exec()
  }

  async getCompletedMediaContainersCount(publishId: string): Promise<number> {
    return this.mediaContainerModel.countDocuments({ publishId, status: PostMediaStatus.FINISHED })
  }

  async updateMediaContainer(
    id: string,
    data: Partial<CreateMediaContainerDto>,
  ): Promise<PostMediaContainer | null> {
    return this.mediaContainerModel.findByIdAndUpdate(
      id,
      data,
      { new: true },
    ).exec()
  }
}
