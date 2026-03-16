import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { AiLogStatus } from '../enums'
import { QrCodeArtImage } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListQrCodeArtImageParams extends Pagination {
  userId: string
  relId: string
  relType: string
}

export class QrCodeArtImageRepository extends BaseRepository<QrCodeArtImage> {
  constructor(
    @InjectModel(QrCodeArtImage.name) qrCodeArtImageModel: Model<QrCodeArtImage>,
  ) {
    super(qrCodeArtImageModel)
  }

  async listByRelIdWithPagination(params: ListQrCodeArtImageParams) {
    const { page, pageSize, userId, relId, relType } = params

    const filter: FilterQuery<QrCodeArtImage> = {
      userId,
      relId,
      relType,
    }

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
      options: { sort: { createdAt: -1 } },
    })
  }

  async getByIdAndUserId(id: string, userId: string) {
    return await this.findOne({ _id: id, userId })
  }

  async getByLogId(logId: string) {
    return await this.findOne({ logId })
  }

  async updateStatusById(id: string, status: AiLogStatus, imageUrl?: string) {
    const update: Partial<QrCodeArtImage> = { status }
    if (imageUrl) {
      update.imageUrl = imageUrl
    }
    return await this.updateById(id, update)
  }
}
