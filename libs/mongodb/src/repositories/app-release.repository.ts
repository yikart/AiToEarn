import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { AppPlatform } from '../enums'
import { AppRelease } from '../schemas'
import { BaseRepository } from './base.repository'

export interface ListAppReleaseParams extends Pagination {
  platform?: AppPlatform
}

export class AppReleaseRepository extends BaseRepository<AppRelease> {
  constructor(
    @InjectModel(AppRelease.name) model: Model<AppRelease>,
  ) {
    super(model)
  }

  async listWithPagination(params: ListAppReleaseParams) {
    const { page, pageSize, platform } = params

    const filter: FilterQuery<AppRelease> = {}
    if (platform) {
      filter.platform = platform
    }

    return await this.findWithPagination({
      page,
      pageSize,
      filter,
      options: { sort: { buildNumber: -1 } },
    })
  }

  async getByPlatformAndVersion(platform: AppPlatform, version: string) {
    return await this.model.findOne({
      platform,
      version,
    }).exec()
  }

  async getLatestByPlatform(platform: AppPlatform) {
    return await this.model.findOne({
      platform,
    }).sort({ publishedAt: -1 }).exec()
  }

  async checkExistsByPlatformAndBuildNumber(platform: AppPlatform, buildNumber: number, excludeId?: string) {
    const filter: FilterQuery<AppRelease> = {
      platform,
      buildNumber,
    }

    if (excludeId) {
      filter._id = { $ne: excludeId }
    }

    return await this.exists(filter)
  }
}
