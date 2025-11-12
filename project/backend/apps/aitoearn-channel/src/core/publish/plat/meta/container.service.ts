import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { PostMediaContainer, PostMediaStatus } from '../../../../libs/database/schema/postMediaContainer.schema'
import { CreatePostMediaContainerDto } from '../../dto/meta.container.dto'

@Injectable()
export class PostMediaContainerService {
  constructor(
    @InjectModel(PostMediaContainer.name)
    private readonly metaPostMediaModel: Model<PostMediaContainer>,
  ) {}

  async createMetaPostMedia(
    data: CreatePostMediaContainerDto,
  ): Promise<PostMediaContainer> {
    const subPublishTask = new this.metaPostMediaModel(data)
    return subPublishTask.save()
  }

  async getContainers(publishId: string): Promise<PostMediaContainer[]> {
    return this.metaPostMediaModel.find({ publishId }).sort({ createdAt: 1 })
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
