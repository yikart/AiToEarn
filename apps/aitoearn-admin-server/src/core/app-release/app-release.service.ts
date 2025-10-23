import { Injectable } from '@nestjs/common'
import { AppException } from '@yikart/common'
import { AppReleaseRepository } from '@yikart/mongodb'
import { CreateAppReleaseDto, DeleteAppReleaseDto, GetAppReleaseByIdDto, QueryAppReleaseDto, UpdateAppReleaseDto } from './app-release.dto'

@Injectable()
export class AppReleaseService {
  // private readonly logger = new Logger(AppReleaseService.name)

  constructor(
    private readonly appReleaseRepo: AppReleaseRepository,
  ) { }

  /**
   * 创建版本发布（管理端）
   */
  async createAppRelease(data: CreateAppReleaseDto) {
    const exists = await this.appReleaseRepo.checkExistsByPlatformAndBuildNumber(data.platform, data.buildNumber)

    if (exists) {
      throw new AppException(1000, '版本发布已存在')
    }

    return await this.appReleaseRepo.create({
      ...data,
      publishedAt: new Date(data.publishedAt),
    })
  }

  /**
   * 更新版本发布（管理端）
   */
  async updateAppRelease(id: string, data: UpdateAppReleaseDto) {
    const existing = await this.appReleaseRepo.getById(id)
    if (!existing) {
      throw new AppException(1000, '版本发布不存在')
    }

    // 如果更新了平台或构建号，检查是否冲突
    if (data.platform || data.buildNumber) {
      const conflict = await this.appReleaseRepo.checkExistsByPlatformAndBuildNumber(
        data.platform || existing.platform,
        data.buildNumber || existing.buildNumber,
        id,
      )

      if (conflict) {
        throw new AppException(1000, '版本发布已存在')
      }
    }

    return await this.appReleaseRepo.updateById(id, data)
  }

  /**
   * 删除版本发布（管理端）
   */
  async deleteAppRelease(data: DeleteAppReleaseDto) {
    const existing = await this.appReleaseRepo.getById(data.id)
    if (!existing) {
      throw new AppException(1000, '版本发布不存在')
    }

    await this.appReleaseRepo.deleteById(data.id)
  }

  /**
   * 获取版本发布详情（管理端）
   */
  async getAppReleaseDetail(data: GetAppReleaseByIdDto) {
    const release = await this.appReleaseRepo.getById(data.id)
    if (!release) {
      throw new AppException(1000, '版本发布不存在')
    }
    return release
  }

  /**
   * 查询版本发布列表（管理端）
   */
  async getAppReleaseList(query: QueryAppReleaseDto) {
    const [list, total] = await this.appReleaseRepo.listWithPagination(query)
    return {
      list,
      total,
    }
  }
}
