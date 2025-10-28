import { Injectable } from '@nestjs/common'
import { ListBrowserProfilesDto, ListCloudSpacesDto } from '../../core/cloud-spaces/cloud-spaces.dto'
import { CloudSpaceListVo, CloudSpaceVo } from '../../core/cloud-spaces/cloud-spaces.vo'
import { ServerBaseApi } from '../serverBase.api'
import { DeleteCloudSpaceDto, GetCloudSpaceStatusDto, RetryCloudSpaceDto } from './common'

@Injectable()
export class CloudSpacesApi extends ServerBaseApi {
  async listCloudSpaces(
    request: ListCloudSpacesDto,
  ) {
    return await this.sendMessage<CloudSpaceListVo>(
      'internal/cloud-space/list',
      request,
    )
  }

  async getCloudSpaceStatus(
    request: GetCloudSpaceStatusDto,
  ) {
    return await this.sendMessage<CloudSpaceVo>(
      'internal/cloud-space/status',
      request,
    )
  }

  async deleteCloudSpace(
    request: DeleteCloudSpaceDto,
  ) {
    return await this.sendMessage(
      'internal/cloud-space/delete',
      request,
    )
  }

  async retryCloudSpace(
    request: RetryCloudSpaceDto,
  ) {
    return await this.sendMessage(
      'internal/cloud-space/retry',
      request,
    )
  }

  async listProfiles(
    request: ListBrowserProfilesDto,
  ) {
    return await this.sendMessage(
      'internal/cloud-space/profile/list',
      request,
    )
  }
}
