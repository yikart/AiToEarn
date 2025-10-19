import { basename, join } from 'node:path'
import { Injectable } from '@nestjs/common'
import { S3Service } from '@yikart/aws-s3'
import { TableDto, UserType } from '@yikart/common'
import { Media, MediaRepository, MediaType } from '@yikart/mongodb'
import { config } from '../config'
import { StorageService } from '../user/storage.service'
import { CreateMediaDto } from './dto/media.dto'

@Injectable()
export class MediaService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly mediaRepository: MediaRepository,
    private readonly storageService: StorageService,
  ) { }

  async create(userId: string, newData: CreateMediaDto) {
    let path = newData.url
    try {
      const url = new URL(newData.url)
      if (url.hostname === config.awsS3.hostUrl) {
        path = url.pathname.substring(1)
      }
      else {
        path = join(userId, `${Date.now().toString(36)}-${basename(url.pathname)}`)
        await this.s3Service.putObjectFromUrl(url.href, path)
      }
    }
    catch { }

    const metadata = await this.s3Service.headObject(path)

    await this.storageService.addUsedStorage({
      userId,
      amount: metadata.ContentLength!,
    })

    const res = await this.mediaRepository.create({
      ...newData,
      userId,
      userType: UserType.User,
      url: path,
      metadata: {
        size: metadata.ContentLength!,
        mimeType: metadata.ContentType!,
      },
    })
    return res
  }

  /**
   * delete media
   * @param id
   * @returns
   */
  async del(id: string) {
    const media = await this.mediaRepository.getInfo(id)
    if (media?.userType === UserType.User && media?.url && media.metadata?.size) {
      await this.storageService.deductUsedStorage({
        userId: media.userId,
        amount: media.metadata.size,
      })
    }

    const res = await this.mediaRepository.delOne(id)
    return res
  }

  /**
   * delete media
   * @param ids
   * @returns
   */
  async delByIds(ids: string[]) {
    const mediaList = await this.mediaRepository.getListByIds(ids)
    for (const media of mediaList) {
      if (media?.userType === UserType.User && media?.url && media.metadata?.size) {
        this.storageService.deductUsedStorage({
          userId: media.userId,
          amount: media.metadata.size,
        })
      }
    }

    const res = await this.mediaRepository.delByIds(ids)
    return res
  }

  /**
   * 获取素材信息
   * @param id
   * @returns
   */
  async getInfo(id: string): Promise<Media | null> {
    const res = await this.mediaRepository.getInfo(id)
    return res
  }

  /**
   * 获取素材列表
   * @param page
   * @param filter
   * @param filter.userId
   * @param filter.groupId
   * @param filter.type
   * @returns
   */
  async getList(
    page: TableDto,
    filter: { userId: string, groupId?: string, type?: MediaType },
  ) {
    const res = await this.mediaRepository.getList(filter, page)
    return res
  }

  async addUseCountOfList(ids: string[]): Promise<boolean> {
    const res = await this.mediaRepository.addUseCountOfList(ids)
    return res
  }

  /**
   * delete media
   * @param id
   * @returns
   */
  async updateInfo(id: string, newData: Partial<Media>) {
    const oldMedia = await this.mediaRepository.getInfo(id)
    if (oldMedia?.url !== newData.url) {
      const metadata = await this.s3Service.headObject(newData.url!)
      newData.metadata = {
        size: metadata.ContentLength!,
        mimeType: metadata.ContentType!,
      }

      if (newData.userType === UserType.User) {
        await this.storageService.deductUsedStorage({
          userId: newData.userId!,
          amount: oldMedia?.metadata?.size || 0,
        })
        await this.storageService.addUsedStorage({
          userId: newData.userId!,
          amount: metadata.ContentLength!,
        })
      }
    }

    const res = await this.mediaRepository.updateInfo(id, newData)
    return res
  }
}
