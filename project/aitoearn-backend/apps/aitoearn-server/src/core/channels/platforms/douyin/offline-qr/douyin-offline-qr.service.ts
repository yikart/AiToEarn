import type { PublishContentInput, PublishMediaInput } from '../../../publish/schemas/publish-content.schema'
import type { CreateDouyinOfflineQrPublishDto } from './douyin-offline-qr.dto'
import { Injectable } from '@nestjs/common'
import { AccountType, AppException, getLocale, ResponseCode } from '@yikart/common'
import { MaterialGroupRepository, MaterialRepository, PublishRecordRepository, PublishRecordSource, PublishStatus, PublishType } from '@yikart/mongodb'
import { MediaService } from '../../../media/media.service'
import { PublishMediaType } from '../../../platforms/platforms.interface'
import { formatPublishValidationIssue, parseTopicsFromBody } from '../../publish.schema'
import { DouyinPublishProvider } from '../douyin-publish.provider'
import { DOUYIN_METADATA } from '../douyin.constants'
import { DouyinMediaType, parseDouyinDataOption } from '../douyin.interface'

@Injectable()
export class DouyinOfflineQrService {
  constructor(
    private readonly publishRecordRepo: PublishRecordRepository,
    private readonly materialGroupRepo: MaterialGroupRepository,
    private readonly materialRepo: MaterialRepository,
    private readonly douyinPublishProvider: DouyinPublishProvider,
    private readonly mediaService: MediaService,
  ) {}

  async createPublish(dto: CreateDouyinOfflineQrPublishDto) {
    await this.validateMaterial(dto.materialGroupId, dto.materialId)
    const content = await this.prepareContent(dto.content)

    const result = await this.douyinPublishProvider.createHandoffPublishResult({
      content,
      option: dto.option,
    })
    const dataOption = parseDouyinDataOption(result.dataOption)
    if (!result.platformWorkId || !dataOption?.schema || !dataOption.shortLink || !dataOption.expiresAt) {
      throw new AppException(ResponseCode.ChannelPlatformResponseInvalid, { platform: AccountType.Douyin })
    }

    const type = this.resolvePublishType(content)
    const media = this.resolveRecordMedia(content, type)
    const record = await this.publishRecordRepo.create({
      userId: '',
      accountId: '',
      uid: '',
      materialGroupId: dto.materialGroupId,
      materialId: dto.materialId,
      accountType: AccountType.Douyin,
      type,
      status: PublishStatus.WaitingForUserAction,
      title: content.title,
      desc: content.body,
      topics: parseTopicsFromBody(content.body),
      publishTime: new Date(),
      source: PublishRecordSource.OfflineQr,
      option: dto.option,
      videoUrl: media.videoUrl,
      imgUrlList: media.imgUrlList,
      coverUrl: content.cover?.url,
      platformWorkId: result.platformWorkId,
      dataId: result.platformWorkId,
      uniqueId: `${AccountType.Douyin}_${result.platformWorkId}`,
      dataOption,
      inQueue: false,
      queued: false,
    })

    return {
      recordId: record.id,
      status: PublishStatus.WaitingForUserAction,
      userAction: {
        shareId: dataOption.shareId,
        schemeUrl: dataOption.schema,
        shortLink: dataOption.shortLink,
        expiresAt: new Date(dataOption.expiresAt),
      },
    }
  }

  private async validateMaterial(materialGroupId: string, materialId: string): Promise<void> {
    const materialGroup = await this.materialGroupRepo.getInfo(materialGroupId)
    if (!materialGroup) {
      throw new AppException(ResponseCode.MaterialGroupNotFound)
    }

    const material = await this.materialRepo.getInfo(materialId)
    if (!material || material.groupId !== materialGroupId) {
      throw new AppException(ResponseCode.MaterialNotFound)
    }
  }

  private async prepareContent(content: PublishContentInput): Promise<PublishContentInput> {
    const prepared = await this.mediaService.preparePublishContentMedia({
      userId: '',
      content,
      mediaRules: DOUYIN_METADATA.mediaRules,
    })
    if (prepared.issues.length) {
      const locale = getLocale()
      throw new AppException(ResponseCode.ChannelPublishValidationFailed, {
        platform: AccountType.Douyin,
        accountId: '',
        issues: prepared.issues.map(issue => formatPublishValidationIssue(issue, locale)),
      })
    }
    return prepared.content
  }

  private resolvePublishType(content: PublishContentInput): PublishType {
    return content.media.some(media => this.getMediaType(media) === DouyinMediaType.Video)
      ? PublishType.VIDEO
      : PublishType.ARTICLE
  }

  private resolveRecordMedia(
    content: PublishContentInput,
    type: PublishType,
  ): { videoUrl?: string, imgUrlList?: string[] } {
    if (type === PublishType.VIDEO) {
      return {
        videoUrl: content.media.find(media => this.getMediaType(media) === DouyinMediaType.Video)?.url ?? content.media[0]?.url,
        imgUrlList: [],
      }
    }

    return {
      imgUrlList: content.media.map(media => media.url),
    }
  }

  private getMediaType(media: PublishMediaInput): DouyinMediaType | undefined {
    const metadataType = media.metadata?.['type']
    if (metadataType === PublishMediaType.Video) {
      return DouyinMediaType.Video
    }
    if (metadataType === PublishMediaType.Image) {
      return DouyinMediaType.Image
    }

    const pathname = this.getUrlPathname(media.url).toLowerCase()
    if (['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'].some(extension => pathname.endsWith(extension))) {
      return DouyinMediaType.Video
    }
    if (['.jpg', '.jpeg', '.png', '.bmp', '.webp'].some(extension => pathname.endsWith(extension))) {
      return DouyinMediaType.Image
    }
    return undefined
  }

  private getUrlPathname(url: string): string {
    try {
      return new URL(url).pathname
    }
    catch {
      return url
    }
  }
}
