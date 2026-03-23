import { Injectable } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { FileUtil, TableDto, UserType } from '@yikart/common'
import { Asset, AssetType, Media, MediaRepository, MediaType } from '@yikart/mongodb'
import { config } from '../../config'
import { CreateMediaDto } from './media.dto'

@Injectable()
export class MediaService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly mediaRepository: MediaRepository,
  ) { }

  async create(userId: string, newData: CreateMediaDto) {
    const fullUrl = newData.url.startsWith('http://') || newData.url.startsWith('https://')
      ? newData.url
      : FileUtil.buildUrl(newData.url)

    const url = new URL(fullUrl)
    const isOurStorage = url.origin === config.assets.endpoint
      || (config.assets.cdnEndpoint && url.origin === config.assets.cdnEndpoint)

    let asset: Asset | null = null

    if (isOurStorage) {
      const objectPath = url.pathname.substring(1)
      const existingAsset = await this.assetsService.getByPath(objectPath)
      if (existingAsset?.userId === userId) {
        asset = existingAsset
      }
    }

    if (!asset) {
      const result = await this.assetsService.uploadFromUrl(userId, {
        url: fullUrl,
        type: AssetType.UserMedia,
      })
      asset = result.asset
    }

    return await this.mediaRepository.create({
      ...newData,
      userId,
      userType: UserType.User,
      url: asset.path,
      metadata: {
        size: asset.size,
        mimeType: asset.mimeType,
      },
    })
  }

  /**
   * delete media
   * @param id
   * @returns
   */
  async del(id: string) {
    const res = await this.mediaRepository.deleteById(id)
    return res !== null
  }

  /**
   * delete media
   * @param ids
   * @returns
   */
  async delByIds(userId: string, ids: string[]) {
    const res = await this.mediaRepository.deleteManyByIds(ids, {
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
    const res = await this.mediaRepository.deleteByFilter(filter)
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
      materialGroupId?: string
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
    const res = await this.mediaRepository.updateManyUseCountByIds(ids, {
      userId,
    })
    return res
  }

  async updateInfo(id: string, newData: Partial<Media>) {
    const oldMedia = await this.mediaRepository.getInfo(id)
    if (oldMedia?.url !== newData.url && newData.url) {
      const objectPath = newData.url.startsWith('http://') || newData.url.startsWith('https://')
        ? FileUtil.trimHost(newData.url)
        : newData.url

      const asset = await this.assetsService.getByPath(objectPath)
      if (asset) {
        newData.metadata = {
          size: asset.size,
          mimeType: asset.mimeType,
        }

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
    const exists = await this.mediaRepository.getIsEmptyByGroup(groupId)
    return exists
  }

  async addUseCount(id: string): Promise<boolean> {
    const res = await this.mediaRepository.updateUseCountById(id)
    return res
  }
}
