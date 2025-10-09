import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { AppReleaseRepository } from '@yikart/mongodb'
import { CheckVersionDto, CreateAppReleaseDto, DeleteAppReleaseDto, GetAppReleaseByIdDto, QueryAppReleaseDto, UpdateAppReleaseDto } from './app-release.dto'

@Injectable()
export class AppReleaseService {
  private readonly logger = new Logger(AppReleaseService.name)

  constructor(
    private readonly appReleaseRepo: AppReleaseRepository,
  ) {}

  /**
   * 创建版本发布
   */
  async create(data: CreateAppReleaseDto) {
    // 检查是否存在相同平台和构建号的发布
    const exists = await this.appReleaseRepo.checkExistsByPlatformAndBuildNumber(data.platform, data.buildNumber)

    if (exists) {
      throw new AppException(ResponseCode.AppReleaseAlreadyExists)
    }

    return await this.appReleaseRepo.create({
      ...data,
      publishedAt: new Date(data.publishedAt),
    })
  }

  /**
   * 更新版本发布
   */
  async update(id: string, data: UpdateAppReleaseDto) {
    const existing = await this.appReleaseRepo.getById(id)
    if (!existing) {
      throw new AppException(ResponseCode.AppReleaseNotFound)
    }

    // 如果更新了平台或构建号，检查是否冲突
    if (data.platform || data.buildNumber) {
      const conflict = await this.appReleaseRepo.checkExistsByPlatformAndBuildNumber(
        data.platform || existing.platform,
        data.buildNumber || existing.buildNumber,
        id,
      )

      if (conflict) {
        throw new AppException(ResponseCode.AppReleaseAlreadyExists)
      }
    }

    return await this.appReleaseRepo.updateById(id, data)
  }

  /**
   * 删除版本发布
   */
  async delete(data: DeleteAppReleaseDto): Promise<void> {
    const existing = await this.appReleaseRepo.getById(data.id)
    if (!existing) {
      throw new AppException(ResponseCode.AppReleaseNotFound)
    }

    await this.appReleaseRepo.deleteById(data.id)
  }

  /**
   * 获取版本发布详情
   */
  async findById(data: GetAppReleaseByIdDto) {
    const release = await this.appReleaseRepo.getById(data.id)
    if (!release) {
      throw new AppException(ResponseCode.AppReleaseNotFound)
    }
    return release
  }

  /**
   * 查询版本发布列表（带分页）
   */
  async findAll(query: QueryAppReleaseDto) {
    return await this.appReleaseRepo.listWithPagination(query)
  }

  /**
   * 检查版本更新（客户端使用）
   */
  async checkVersion(data: CheckVersionDto) {
    // 获取该平台的最新版本
    const latestRelease = await this.appReleaseRepo.getLatestByPlatform(data.platform)

    if (!latestRelease) {
      throw new AppException(ResponseCode.AppReleaseNotFound)
    }

    // 优先比较 buildNumber，如果没有传入则比较 version
    let hasUpdate: boolean
    if (data.currentBuildNumber !== undefined) {
      // 使用 buildNumber 比较
      hasUpdate = data.currentBuildNumber < latestRelease.buildNumber
    }
    else {
      // 使用 version 比较
      hasUpdate = this.compareVersion(data.currentVersion, latestRelease.version) < 0
    }

    return {
      hasUpdate,
      forceUpdate: hasUpdate && latestRelease.forceUpdate,
      latestVersion: latestRelease.version,
      latestBuildNumber: latestRelease.buildNumber,
      currentVersion: data.currentVersion,
      currentBuildNumber: data.currentBuildNumber ?? 0,
      notes: latestRelease.notes,
      links: latestRelease.links,
      publishedAt: latestRelease.publishedAt,
    }
  }

  /**
   * 比较版本号
   * @returns -1: v1 < v2, 0: v1 = v2, 1: v1 > v2
   */
  private compareVersion(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)
    const maxLength = Math.max(parts1.length, parts2.length)

    for (let i = 0; i < maxLength; i++) {
      const num1 = parts1[i] || 0
      const num2 = parts2[i] || 0

      if (num1 < num2)
        return -1
      if (num1 > num2)
        return 1
    }

    return 0
  }
}
