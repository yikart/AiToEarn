import { Injectable } from '@nestjs/common'
import { PostMediaContainer, PostMediaContainerRepository } from '@yikart/channel-db'
import { CreateMediaContainerDto } from './media-container.dto'

@Injectable()
export class MediaStagingService {
  constructor(
    private readonly postMediaContainerRepository: PostMediaContainerRepository,
  ) {}

  async createMediaContainer(
    data: CreateMediaContainerDto,
  ): Promise<PostMediaContainer> {
    return await this.postMediaContainerRepository.add(data)
  }

  async deleteMediaContainer(publishId: string): Promise<void> {
    await this.postMediaContainerRepository.deleteList({ publishId })
  }

  async upsertMediaContainer(
    data: CreateMediaContainerDto,
  ): Promise<PostMediaContainer> {
    return await this.postMediaContainerRepository.upsertInfo(
      { publishId: data.publishId, platform: data.platform },
      data,
    )
  }

  async getMediaContainers(publishId: string, jobId: string): Promise<PostMediaContainer[]> {
    return await this.postMediaContainerRepository.getList(publishId, jobId)
  }

  async getUnProcessedMediaContainers(publishId: string): Promise<PostMediaContainer[]> {
    return await this.postMediaContainerRepository.getUnProcessedList(publishId)
  }

  async getCompletedMediaContainersCount(publishId: string): Promise<number> {
    return await this.postMediaContainerRepository.getCompletedCount(publishId)
  }

  async updateMediaContainer(
    id: string,
    data: Partial<CreateMediaContainerDto>,
  ): Promise<PostMediaContainer | null> {
    return await this.postMediaContainerRepository.updateInfo(
      id,
      data,
    )
  }
}
