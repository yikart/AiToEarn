import { Body, Controller, Post } from '@nestjs/common'
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

  // @NatsMessagePattern('cloud-space.create')
  @Post('cloud-space/create')
  async createCloudSpace(@Body() dto: CreateCloudSpaceDto): Promise<CloudSpaceVo> {
    const cloudSpace = await this.cloudSpaceService.createCloudSpace(dto)
    return CloudSpaceVo.create(cloudSpace as any)
  }

  // @NatsMessagePattern('cloud-space.list')
  @Post('cloud-space/list')
  async listCloudSpaces(@Body() dto: ListCloudSpacesDto): Promise<CloudSpaceListVo> {
    const [cloudSpaces, total] = await this.cloudSpaceService.listCloudSpaces(dto)
    return new CloudSpaceListVo(cloudSpaces as any, total, dto)
  }

  // @NatsMessagePattern('cloud-space.listByUserId')
  @Post('cloud-space/listByUserId')
  async listCloudSpacesByUserId(@Body() dto: ListCloudSpacesByUserIdDto): Promise<CloudSpaceVo[]> {
    const cloudSpaces = await this.cloudSpaceService.listCloudSpacesByUserId(dto)
    return cloudSpaces.map(c => CloudSpaceVo.create(c))
  }

  // @NatsMessagePattern('cloud-space.status')
  @Post('cloud-space/status')
  async getCloudSpaceStatus(@Body() dto: GetCloudSpaceStatusDto): Promise<CloudSpaceVo> {
    const cloudSpace = await this.cloudSpaceService.getCloudSpaceStatus(dto.cloudSpaceId)
    return CloudSpaceVo.create(cloudSpace)
  }

  // @NatsMessagePattern('cloud-space.renew')
  @Post('cloud-space/renew')
  async renewCloudSpace(@Body() dto: RenewCloudSpaceDto) {
    await this.cloudSpaceService.renewCloudSpace(dto)
  }

  // @NatsMessagePattern('cloud-space.retry')
  @Post('cloud-space/retry')
  async retryCloudSpace(@Body() dto: RetryCloudSpaceDto) {
    await this.cloudSpaceService.retryCloudSpace(dto)
  }

  // @NatsMessagePattern('cloud-space.delete')
  @Post('cloud-space/delete')
  async deleteCloudSpace(@Body() dto: DeleteCloudSpaceDto) {
    await this.cloudSpaceService.deleteCloudSpace(dto.cloudSpaceId)
  }
}
