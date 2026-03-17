import { Injectable, Logger } from '@nestjs/common'
import { AitoearnAiClientService } from '@yikart/aitoearn-ai-client'
import { AppException, FileUtil, ResponseCode, UserType } from '@yikart/common'
import { AiLogStatus, QrCodeArtImageRepository } from '@yikart/mongodb'

import { CreateQrCodeArtImageDto, GenerateQrCodeArtDto, GetQrCodeArtTaskStatusDto, ListQrCodeArtImagesDto } from './tools.dto'

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(ToolsService.name)

  constructor(
    private readonly aiClient: AitoearnAiClientService,
    private readonly qrCodeArtImageRepo: QrCodeArtImageRepository,
  ) {}

  async generateQrCodeArt(userId: string, dto: GenerateQrCodeArtDto) {
    const result = await this.aiClient.ai.generateQrCodeArt({
      userId,
      userType: UserType.User,
      content: dto.content,
      referenceImageUrl: dto.referenceImageUrl,
      prompt: dto.prompt,
      model: dto.model,
      size: dto.size,
    })
    return result
  }

  async createQrCodeArtImage(userId: string, dto: CreateQrCodeArtImageDto) {
    const image = await this.qrCodeArtImageRepo.create({
      userId,
      userType: UserType.User,
      relId: dto.relId,
      relType: dto.relType,
      logId: dto.logId,
      content: dto.content,
      referenceImageUrl: dto.referenceImageUrl,
      prompt: dto.prompt,
      model: dto.model,
      size: dto.size,
      status: dto.status as AiLogStatus,
      imageUrl: dto.imageUrl,
    })
    return image
  }

  async listQrCodeArtImagesByRelIdWithPagination(userId: string, dto: ListQrCodeArtImagesDto) {
    const [list, total] = await this.qrCodeArtImageRepo.listByRelIdWithPagination({
      userId,
      relId: dto.relId,
      relType: dto.relType,
      page: dto.page,
      pageSize: dto.pageSize,
    })
    return { list, total }
  }

  async getQrCodeArtImageById(id: string, userId: string) {
    const image = await this.qrCodeArtImageRepo.getByIdAndUserId(id, userId)
    if (!image) {
      throw new AppException(ResponseCode.QrCodeArtImageNotFound)
    }
    return image
  }

  async getQrCodeArtTaskStatus(dto: GetQrCodeArtTaskStatusDto) {
    const result = await this.aiClient.ai.getImageTaskStatus({ logId: dto.logId })
    const images = (result.images as Array<{ url?: string, b64_json?: string, revised_prompt?: string }> | undefined)
      ?.map(image => ({
        ...image,
        url: image.url ? FileUtil.buildUrl(image.url) : image.url,
      }))
    return { ...result, images }
  }
}
