import { basename, join } from 'node:path'
import { Injectable, Logger } from '@nestjs/common'
import { S3Service } from '@yikart/aws-s3'
import { TableDto, UserType } from '@yikart/common'
import { Media, MediaRepository, MediaType } from '@yikart/mongodb'
import { fileUtil } from '../common/utils/file.util'
import { config } from '../config'
import { StorageService } from '../user/storage.service'
import { CreateMediaDto } from './dto/media.dto'

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name)
  constructor(
    private readonly s3Service: S3Service,
    private readonly mediaRepository: MediaRepository,
    private readonly storageService: StorageService,
  ) { }

  async create(userId: string, newData: CreateMediaDto) {
    let path = newData.url
    try {
      const url = new URL(newData.url)
      const s3Endpoint = config.awsS3.endpoint
      const cdnEndpoint = config.awsS3.cdnEndpoint

      if (url.origin === s3Endpoint || (cdnEndpoint && url.origin === cdnEndpoint)) {
        path = url.pathname.substring(1)
      }
      else {
        path = join(userId, `${Date.now().toString(36)}-${basename(url.pathname)}`)
        await this.s3Service.putObjectFromUrl(url.href, path)
      }
    }
    catch (error) {
      this.logger.error('处理媒体URL失败', error)
    }

    const objectPath = path.startsWith('http://') || path.startsWith('https://')
      ? fileUtil.trimHost(path)
      : path

    const metadata = await this.s3Service.headObject(objectPath)

    await this.storageService.addUsedStorage({
      userId,
      amount: metadata.ContentLength!,
    })

    const res = await this.mediaRepository.create({
      ...newData,
      userId,
      userType: UserType.User,
      url: objectPath,
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
  async delByIds(userId: string, ids: string[]) {
    const mediaList = await this.mediaRepository.getListByIds(ids)
    for (const media of mediaList) {
      if (media?.userType === UserType.User && media?.url && media.metadata?.size) {
        this.storageService.deductUsedStorage({
          userId: media.userId,
          amount: media.metadata.size,
        })
      }
    }

    const res = await this.mediaRepository.delByIds(ids, {
      userType: UserType.User,
      userId,
    })
    return res
  }

  /**
   * delete media (TODO: 待优化)
   * @param userId
   * @param inFilter
   * @returns
   */
  async delByFilter(
    userId: string,
    inFilter: {
      groupId?: string
      type?: MediaType
      useCount?: number
    },
  ) {
    const { groupId, type, useCount } = inFilter
    const filter = {
      userId,
      userType: UserType.User,
      ...(groupId && { groupId }),
      ...(type && { type }),
      ...(useCount !== undefined && { useCount: { $gte: useCount } }),
    }
    const mediaList = await this.mediaRepository.getListByFilter(filter)
    for (const media of mediaList) {
      if (media?.userType === UserType.User && media?.url && media.metadata?.size) {
        this.storageService.deductUsedStorage({
          userId: media.userId,
          amount: media.metadata.size,
        })
      }
    }

    const res = await this.mediaRepository.delByFilter(filter)
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
    filter: {
      userId: string
      groupId?: string
      type?: MediaType
      userType?: UserType
      useCount?: number
    },
  ) {
    const res = await this.mediaRepository.getList(filter, page)
    return res
  }

  async getListByGroup(groupId: string) {
    const res = await this.mediaRepository.getListByGroup(groupId)
    return res
  }

  async addUseCountOfList(userId: string, ids: string[]): Promise<boolean> {
    const res = await this.mediaRepository.addUseCountOfList(ids, {
      userId,
    })
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
      // 如果 newData.url 是完整 URL，先提取路径
      const objectPath = newData.url && (newData.url.startsWith('http://') || newData.url.startsWith('https://'))
        ? fileUtil.trimHost(newData.url)
        : newData.url!

      const metadata = await this.s3Service.headObject(objectPath)
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

      // 如果 newData.url 是完整 URL，保存时只保存路径
      if (newData.url && (newData.url.startsWith('http://') || newData.url.startsWith('https://'))) {
        newData.url = objectPath
      }
    }

    const res = await this.mediaRepository.updateInfo(id, newData)
    return res
  }

  /**
   * 检查指定组是否为空（不包含任何媒体文件）
   * @param groupId 组ID
   * @returns 如果组为空返回true，否则返回false
   */
  async checkIsEmptyGroup(groupId: string): Promise<boolean> {
    const exists = await this.mediaRepository.checkIsEmptyGroup(groupId)
    return exists
  }

  async addUseCount(id: string): Promise<boolean> {
    const res = await this.mediaRepository.addUseCount(id)
    return res
  }
}
