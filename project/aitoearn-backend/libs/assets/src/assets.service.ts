import type { Readable } from 'node:stream'
import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode, UserType } from '@yikart/common'
import { Asset, AssetRepository, AssetStatus, AssetType } from '@yikart/mongodb'
import * as mime from 'mime-types'
import {
  ConfirmAssetDto,
  ListAssetsDto,
  UploadAssetDto,
  UploadFromBufferDto,
  UploadFromUrlDto,
} from './dto'
import { StorageProvider } from './storage-provider'
import { generateAssetPath, generateAssetPathFromFilename, PathGeneratorOptions } from './utils/path-generator'
import { VideoMetadataService } from './video-metadata.service'

export interface UploadResult {
  asset: Asset
  url: string
  uploadUrl?: string
}

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name)

  constructor(
    private readonly storage: StorageProvider,
    private readonly assetRepository: AssetRepository,
    private readonly videoMetadataService: VideoMetadataService,
  ) {}

  async createUploadSign(
    userId: string,
    dto: UploadAssetDto,
    userType: UserType = UserType.User,
  ): Promise<Required<UploadResult>> {
    const pathOptions: PathGeneratorOptions = {
      userId,
      userType,
      type: dto.type,
      mimeType: dto.mimeType,
      filename: dto.filename,
    }

    const path = generateAssetPath(pathOptions)

    const asset = await this.assetRepository.create({
      userId,
      userType,
      path,
      type: dto.type,
      status: AssetStatus.Pending,
      size: dto.size,
      mimeType: dto.mimeType,
      filename: dto.filename,
      metadata: dto.metadata,
      expiresAt: dto.expiresInSeconds
        ? new Date(Date.now() + dto.expiresInSeconds * 1000)
        : undefined,
    })

    const signUrl = await this.storage.getUploadSignUrl(path, dto.mimeType, dto.size, { assetId: asset.id })

    return {
      asset,
      url: this.buildUrl(path),
      uploadUrl: signUrl,
    }
  }

  async uploadFromUrl(
    userId: string,
    dto: UploadFromUrlDto,
    subPath?: string,
    userType: UserType = UserType.User,
  ): Promise<UploadResult> {
    const filename = dto.filename || new URL(dto.url).pathname.split('/').pop() || undefined

    const pathOptions: PathGeneratorOptions = {
      userId,
      userType,
      type: dto.type,
      mimeType: 'application/octet-stream',
      filename,
      subPath,
    }

    const tempPath = generateAssetPathFromFilename(pathOptions)

    const result = await this.storage.putObjectFromUrl(dto.url, tempPath)

    const headResult = await this.storage.headObject(result.path)

    const asset = await this.assetRepository.create({
      userId,
      userType,
      path: result.path,
      type: dto.type,
      status: AssetStatus.Confirmed,
      size: headResult.contentLength || 0,
      mimeType: headResult.contentType || 'application/octet-stream',
      filename: dto.filename,
      metadata: dto.metadata,
    })

    return {
      asset,
      url: this.buildUrl(result.path),
    }
  }

  async uploadFromBuffer(
    userId: string,
    buffer: Buffer,
    dto: UploadFromBufferDto,
    subPath?: string,
    userType: UserType = UserType.User,
  ): Promise<UploadResult> {
    const pathOptions: PathGeneratorOptions = {
      userId,
      userType,
      type: dto.type,
      mimeType: dto.mimeType,
      filename: dto.filename,
      subPath,
    }

    const path = generateAssetPath(pathOptions)

    await this.storage.putObject(path, buffer, dto.mimeType)

    const asset = await this.assetRepository.create({
      userId,
      userType,
      path,
      type: dto.type,
      status: AssetStatus.Confirmed,
      size: buffer.length,
      mimeType: dto.mimeType,
      filename: dto.filename,
      metadata: dto.metadata,
    })

    return {
      asset,
      url: this.buildUrl(path),
    }
  }

  async uploadFromStream(
    userId: string,
    stream: Buffer | Readable,
    dto: UploadFromBufferDto & { size: number },
    subPath?: string,
    userType: UserType = UserType.User,
  ): Promise<UploadResult> {
    const pathOptions: PathGeneratorOptions = {
      userId,
      userType,
      type: dto.type,
      mimeType: dto.mimeType,
      filename: dto.filename,
      subPath,
    }

    const path = generateAssetPath(pathOptions)

    await this.storage.putObject(path, stream, dto.mimeType)

    const asset = await this.assetRepository.create({
      userId,
      userType,
      path,
      type: dto.type,
      status: AssetStatus.Confirmed,
      size: dto.size,
      mimeType: dto.mimeType,
      filename: dto.filename,
      metadata: dto.metadata,
    })

    return {
      asset,
      url: this.buildUrl(path),
    }
  }

  async confirmUpload(dto: ConfirmAssetDto): Promise<Asset> {
    const asset = await this.assetRepository.getById(dto.assetId)

    if (!asset) {
      throw new AppException(ResponseCode.AssetNotFound)
    }

    if (asset.status !== AssetStatus.Pending) {
      return asset
    }

    const updateData: Partial<Asset> = {
      status: AssetStatus.Confirmed,
    }

    if (dto.size) {
      updateData.size = dto.size
    }

    if (dto.metadata) {
      updateData.metadata = { ...asset.metadata, ...dto.metadata }
    }

    const updated = await this.assetRepository.updateById(dto.assetId, updateData)
    return updated!
  }

  async getById(assetId: string): Promise<Asset | null> {
    return await this.assetRepository.getById(assetId)
  }

  async getByPath(path: string): Promise<Asset | null> {
    return await this.assetRepository.getByPath(path)
  }

  parsePathFromUrl(url: string): string {
    return this.storage.parsePathFromUrl(url)
  }

  async getOrCreateAssetByPath(path: string, userId: string, userType: UserType = UserType.User): Promise<Asset> {
    const existingAsset = await this.assetRepository.getByPath(path)
    if (existingAsset) {
      return existingAsset
    }

    let headResult
    try {
      headResult = await this.storage.headObject(path)
    }
    catch {
      throw new AppException(ResponseCode.AssetNotFound, 'File not found in storage')
    }

    if (!headResult) {
      throw new AppException(ResponseCode.AssetNotFound, 'File not found in storage')
    }

    const asset = await this.assetRepository.create({
      userId,
      userType,
      path,
      type: AssetType.Temp,
      status: AssetStatus.Confirmed,
      size: headResult.contentLength || 0,
      mimeType: headResult.contentType || 'application/octet-stream',
    })

    return asset
  }

  async listWithPagination(userId: string, dto: ListAssetsDto, userType: UserType = UserType.User) {
    return await this.assetRepository.listWithPagination({
      userId,
      userType,
      page: dto.page,
      pageSize: dto.pageSize,
      type: dto.type,
    })
  }

  async softDelete(userId: string, assetId: string, userType: UserType = UserType.User): Promise<void> {
    const asset = await this.assetRepository.getByIdAndUserId(assetId, userId, userType)

    if (!asset) {
      throw new AppException(ResponseCode.AssetNotFound)
    }

    await this.assetRepository.softDelete(assetId)
  }

  buildUrl(path: string): string {
    return this.storage.buildUrl(path)
  }

  async processPendingAssets(olderThanSeconds: number, limit = 100): Promise<{ confirmed: number, failed: number }> {
    const pendingAssets = await this.assetRepository.findPendingAssets(olderThanSeconds, limit)
    let confirmed = 0
    let failed = 0

    for (const asset of pendingAssets) {
      try {
        const exists = await this.storage.headObject(asset.path)
        if (exists) {
          await this.assetRepository.updateStatus(asset.id, AssetStatus.Confirmed, {
            size: exists.contentLength,
          })
          confirmed++
        }
        else {
          await this.assetRepository.updateStatus(asset.id, AssetStatus.Failed)
          failed++
        }
      }
      catch {
        await this.assetRepository.updateStatus(asset.id, AssetStatus.Failed)
        failed++
      }
    }

    return { confirmed, failed }
  }

  async processQuickPollPendingAssets(limit = 50): Promise<{ confirmed: number }> {
    const pendingAssets = await this.assetRepository.listByStatusAndAge(AssetStatus.Pending, 5, limit)
    let confirmed = 0

    for (const asset of pendingAssets) {
      try {
        const exists = await this.storage.headObject(asset.path)
        if (exists) {
          await this.assetRepository.updateStatus(asset.id, AssetStatus.Confirmed, {
            size: exists.contentLength,
          })
          confirmed++
        }
      }
      catch {
        // headObject 失败，文件可能还未上传完成，不做处理
      }
    }

    return { confirmed }
  }

  async cleanupExpiredPendingAssets(olderThanSeconds: number): Promise<{ affectedCount: number }> {
    return await this.assetRepository.markExpiredPendingAsFailed(olderThanSeconds)
  }

  async confirmUploadByUser(userId: string, assetId: string, userType: UserType = UserType.User): Promise<Asset> {
    const asset = await this.assetRepository.getByIdAndUserId(assetId, userId, userType)

    if (!asset) {
      throw new AppException(ResponseCode.AssetNotFound)
    }

    if (asset.status !== AssetStatus.Pending) {
      return asset
    }

    const headResult = await this.storage.headObject(asset.path)
    if (!headResult) {
      throw new AppException(ResponseCode.AssetUploadFailed)
    }

    const expectedMimeType = asset.filename
      ? (mime.lookup(asset.filename) || asset.mimeType)
      : asset.mimeType
    const currentContentType = headResult.contentType

    if (expectedMimeType && currentContentType !== expectedMimeType) {
      const contentDisposition = expectedMimeType.startsWith('video/') ? 'inline' : undefined
      await this.storage.copyObject(asset.path, {
        contentType: expectedMimeType,
        contentDisposition,
        metadata: {
          assetId: asset.id,
          userId: asset.userId,
        },
      })
    }

    const finalMimeType = expectedMimeType || asset.mimeType

    const updateData: Partial<Asset> = {
      status: AssetStatus.Confirmed,
      size: headResult.contentLength || asset.size,
      mimeType: finalMimeType,
    }

    if (finalMimeType?.startsWith('video/')) {
      try {
        const videoUrl = this.storage.buildUrl(asset.path)
        const videoMetadata = await this.videoMetadataService.probeVideoMetadata(videoUrl)
        updateData.metadata = {
          ...asset.metadata,
          width: videoMetadata.width,
          height: videoMetadata.height,
          duration: videoMetadata.duration,
          bitrate: videoMetadata.bitrate,
          frameRate: videoMetadata.frameRate,
        }
        this.logger.debug({ assetId, videoMetadata }, 'Video metadata extracted successfully')
      }
      catch (error) {
        this.logger.warn({ assetId, error }, 'Failed to extract video metadata, skipping')
      }
    }

    const updated = await this.assetRepository.updateById(assetId, updateData)

    return updated!
  }
}
