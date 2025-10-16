import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import {
  CreateCloudSpaceDto,
  DeleteCloudSpaceDto,
  GetCloudSpaceStatusDto,
  ListCloudSpacesByUserIdDto,
  ListCloudSpacesDto,
  RenewCloudSpaceDto,
  RetryCloudSpaceDto,
} from './cloud-space.dto'
import { CloudSpaceService } from './cloud-space.service'
import {
  CloudSpaceListVo,
  CloudSpaceVo,
} from './cloud-space.vo'

@Controller()
export class CloudSpaceController {
  constructor(private readonly cloudSpaceService: CloudSpaceService) {}

  @NatsMessagePattern('cloud-space.create')
  async createCloudSpace(@Payload() dto: CreateCloudSpaceDto): Promise<CloudSpaceVo> {
    const cloudSpace = await this.cloudSpaceService.createCloudSpace(dto)
    return CloudSpaceVo.create(cloudSpace as any)
  }

  @NatsMessagePattern('cloud-space.list')
  async listCloudSpaces(@Payload() dto: ListCloudSpacesDto): Promise<CloudSpaceListVo> {
    const [cloudSpaces, total] = await this.cloudSpaceService.listCloudSpaces(dto)
    return new CloudSpaceListVo(cloudSpaces as any, total, dto)
  }

  @NatsMessagePattern('cloud-space.listByUserId')
  async listCloudSpacesByUserId(@Payload() dto: ListCloudSpacesByUserIdDto): Promise<CloudSpaceVo[]> {
    const cloudSpaces = await this.cloudSpaceService.listCloudSpacesByUserId(dto)
    return cloudSpaces.map(c => CloudSpaceVo.create(c))
  }

  @NatsMessagePattern('cloud-space.status')
  async getCloudSpaceStatus(@Payload() dto: GetCloudSpaceStatusDto): Promise<CloudSpaceVo> {
    const cloudSpace = await this.cloudSpaceService.getCloudSpaceStatus(dto.cloudSpaceId)
    return CloudSpaceVo.create(cloudSpace)
  }

  @NatsMessagePattern('cloud-space.renew')
  async renewCloudSpace(@Payload() dto: RenewCloudSpaceDto) {
    await this.cloudSpaceService.renewCloudSpace(dto)
  }

  @NatsMessagePattern('cloud-space.retry')
  async retryCloudSpace(@Payload() dto: RetryCloudSpaceDto) {
    await this.cloudSpaceService.retryCloudSpace(dto)
  }

  @NatsMessagePattern('cloud-space.delete')
  async deleteCloudSpace(@Payload() dto: DeleteCloudSpaceDto): Promise<void> {
    await this.cloudSpaceService.deleteCloudSpace(dto.cloudSpaceId)
  }
}
