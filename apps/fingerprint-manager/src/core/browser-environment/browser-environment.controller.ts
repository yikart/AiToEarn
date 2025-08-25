import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import {
  CreateBrowserEnvironmentDto,
  DeleteBrowserEnvironmentDto,
  GetBrowserEnvironmentStatusDto,
  ListBrowserEnvironmentsDto,
} from './browser-environment.dto'
import { BrowserEnvironmentService } from './browser-environment.service'
import {
  BrowserEnvironmentListVo,
  BrowserEnvironmentVo,
} from './browser-environment.vo'

@Controller()
export class BrowserEnvironmentController {
  constructor(private readonly browserEnvironmentService: BrowserEnvironmentService) {}

  @NatsMessagePattern('fingerprint.environment.create')
  async createEnvironment(@Payload() dto: CreateBrowserEnvironmentDto): Promise<BrowserEnvironmentVo> {
    const environment = await this.browserEnvironmentService.createEnvironment(dto)
    return BrowserEnvironmentVo.create(environment)
  }

  @NatsMessagePattern('fingerprint.environment.list')
  async listEnvironments(@Payload() dto: ListBrowserEnvironmentsDto): Promise<BrowserEnvironmentListVo> {
    const [environments, total] = await this.browserEnvironmentService.listEnvironments(dto)
    return new BrowserEnvironmentListVo(environments, total, dto)
  }

  @NatsMessagePattern('fingerprint.environment.status')
  async getEnvironmentStatus(@Payload() dto: GetBrowserEnvironmentStatusDto): Promise<BrowserEnvironmentVo> {
    const environment = await this.browserEnvironmentService.getEnvironmentStatus(dto.environmentId)
    return BrowserEnvironmentVo.create(environment)
  }

  @NatsMessagePattern('fingerprint.environment.delete')
  async deleteEnvironment(@Payload() dto: DeleteBrowserEnvironmentDto): Promise<void> {
    await this.browserEnvironmentService.deleteEnvironment(dto.environmentId)
  }
}
