import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import { CheckVersionDto, CreateAppReleaseDto, DeleteAppReleaseDto, GetAppReleaseByIdDto, QueryAppReleaseDto, UpdateAppReleaseDto } from './app-release.dto'
import { AppReleaseService } from './app-release.service'
import { AppReleaseListVo, AppReleaseVo, CheckVersionVo } from './app-release.vo'

@Controller()
export class AppReleaseController {
  constructor(private readonly appReleaseService: AppReleaseService) {}

  // ============ 管理端接口 ============

  @NatsMessagePattern('other.appRelease.create')
  async create(@Payload() data: CreateAppReleaseDto) {
    await this.appReleaseService.create(data)
  }

  @NatsMessagePattern('other.appRelease.update')
  async update(@Payload() data: UpdateAppReleaseDto & { id: string }) {
    const { id, ...updateData } = data
    await this.appReleaseService.update(id, updateData)
  }

  @NatsMessagePattern('other.appRelease.delete')
  async delete(@Payload() data: DeleteAppReleaseDto) {
    await this.appReleaseService.delete(data)
  }

  @NatsMessagePattern('other.appRelease.detail')
  async getDetail(@Payload() data: GetAppReleaseByIdDto): Promise<AppReleaseVo> {
    const release = await this.appReleaseService.findById(data)
    return AppReleaseVo.create(release)
  }

  @NatsMessagePattern('other.appRelease.list')
  async getList(@Payload() query: QueryAppReleaseDto): Promise<AppReleaseListVo> {
    const [list, total] = await this.appReleaseService.findAll(query)
    return new AppReleaseListVo(list, total, query)
  }

  // ============ 客户端接口 ============

  @NatsMessagePattern('other.appRelease.checkVersion')
  async checkVersion(@Payload() data: CheckVersionDto): Promise<CheckVersionVo> {
    const result = await this.appReleaseService.checkVersion(data)
    return CheckVersionVo.create(result)
  }

  @NatsMessagePattern('other.appRelease.latest')
  async getLatest(@Payload() query: QueryAppReleaseDto): Promise<AppReleaseVo | null> {
    const [list] = await this.appReleaseService.findAll({ ...query, page: 1, pageSize: 1 })
    if (list.length === 0) {
      return null
    }
    return AppReleaseVo.create(list[0])
  }
}
