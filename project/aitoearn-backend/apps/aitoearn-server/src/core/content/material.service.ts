import { Injectable, Logger } from '@nestjs/common'
import { AssetsService, VideoMetadataService } from '@yikart/assets'
import { AccountType, FileUtil, TableDto, UserType } from '@yikart/common'
import { AssetType, Material, MaterialRepository, MaterialStatus, MaterialType, MediaType } from '@yikart/mongodb'
import { NewMaterial, UpMaterial } from './common'
import { MediaService } from './media.service'

@Injectable()
export class MaterialService {
  private readonly logger = new Logger(MaterialService.name)

  constructor(
    private readonly materialRepository: MaterialRepository,
    private readonly mediaService: MediaService,
    private readonly videoMetadataService: VideoMetadataService,
    private readonly assetsService: AssetsService,
  ) { }

  async create(newData: NewMaterial) {
    const dataWithCover = await this.ensureVideoCover(newData)
    const res = await this.materialRepository.create(dataWithCover)
    return res
  }

  /**
   * 视频类型草稿无封面时，自动从视频截帧生成封面
   */
  private async ensureVideoCover(data: NewMaterial): Promise<NewMaterial> {
    if (data.type !== MaterialType.VIDEO || data.coverUrl) {
      return data
    }

    const videoMedia = data.mediaList.find(
      m => m.type === MediaType.VIDEO && m.url,
    )
    if (!videoMedia) {
      return data
    }

    try {
      const fullUrl = FileUtil.buildUrl(videoMedia.url)
      const thumbnailBuffer = await this.videoMetadataService.extractThumbnailFromUrl(fullUrl, 2)
      const uploadResult = await this.assetsService.uploadFromBuffer(data.userId, thumbnailBuffer, {
        type: AssetType.VideoThumbnail,
        mimeType: 'image/png',
        filename: 'thumbnail.png',
      })
      const coverUrl = uploadResult.asset.path

      return {
        ...data,
        coverUrl,
        mediaList: data.mediaList.map(m =>
          m === videoMedia ? { ...m, thumbUrl: m.thumbUrl || coverUrl } : m,
        ),
      }
    }
    catch (error) {
      this.logger.warn({ error }, 'Failed to extract video thumbnail for cover, proceeding without cover')
      return data
    }
  }

  async del(id: string) {
    const material = await this.getInfo(id)
    if (!material)
      return true
    const res = await this.materialRepository.deleteById(id)
    if (!res)
      return false
    if (material.autoDeleteMedia) {
      for (const item of material.mediaList) {
        if (!item.mediaId)
          continue
        this.mediaService.del(item.mediaId)
      }
    }
    return res
  }

  async delByIds(userId: string, ids: string[]): Promise<boolean> {
    const res = await this.materialRepository.deleteManyByIds(ids, { userId })
    return res
  }

  async delByFilter(
    userId: string,
    inFilter: {
      title?: string
      groupId?: string
      status?: MaterialStatus
      useCount?: number
      type?: MaterialType
    },
  ) {
    const { groupId, type, useCount, title, status } = inFilter
    const filter = {
      userId,
      userType: UserType.User,
      ...(groupId && { groupId }),
      ...(type && { type }),
      ...(useCount !== undefined && { useCount: { $gte: useCount } }),
      ...(title && { title: { $regex: title, $options: 'i' } }),
      ...(status !== undefined && { status }),
    }
    const res = await this.materialRepository.deleteByFilter(filter)
    return res
  }

  async deleteByUseCount(userId: string, groupId: string, minUseCount: number): Promise<boolean> {
    return this.materialRepository.deleteByFilter({
      userId,
      userType: UserType.User,
      groupId,
      useCount: { $gte: minUseCount },
    })
  }

  async updateInfo(id: string, data: UpMaterial): Promise<boolean> {
    const res = await this.materialRepository.updateInfo(id, data)
    return res
  }

  async getInfo(id: string): Promise<Material | null> {
    const res = await this.materialRepository.getInfo(id)
    return res
  }

  async optimalInGroup(groupId: string, type?: MaterialType, accountType?: AccountType): Promise<Material | null> {
    const res = await this.materialRepository.getOptimalByGroup(groupId, type, accountType)
    return res
  }

  async getList(
    page: TableDto,
    filter: {
      userId?: string
      userType?: UserType
      title?: string
      groupId?: string
      status?: MaterialStatus
      ids?: string[]
      useCount?: number
    },
  ) {
    const res = await this.materialRepository.getList(filter, page)
    return res
  }

  async optimalByIds(materialIds: string[]) {
    const res = await this.materialRepository.getOptimalByIds(materialIds)
    return res
  }

  async getListByIds(ids: string[]) {
    const res = await this.materialRepository.listByIds(ids)
    return res
  }

  async updateStatus(id: string, status: MaterialStatus, message: string) {
    const res = await this.materialRepository.updateStatus(id, status, message)
    return res
  }

  async addUseCount(id: string): Promise<boolean> {
    const material = await this.materialRepository.updateUseCountById(id)
    if (!material) {
      return false
    }

    // 检查是否达到最大使用次数
    if (
      material.maxUseCount !== null
      && material.maxUseCount !== undefined
      && material.useCount >= material.maxUseCount
    ) {
      await this.del(id)
    }

    return true
  }

  /**
   * 通过 photoReference upsert 素材
   */
  async upsertByPhotoReference(newData: NewMaterial): Promise<Material> {
    if (!newData.brandInfo?.photoReference) {
      return this.materialRepository.create(newData)
    }
    return this.materialRepository.upsertByPhotoReference(newData)
  }
}
