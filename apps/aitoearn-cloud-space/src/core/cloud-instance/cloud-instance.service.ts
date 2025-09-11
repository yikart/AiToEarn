import { Injectable, Logger } from '@nestjs/common'
import { AppException, generateSecurePassword, ResponseCode } from '@yikart/common'
import { CloudSpaceRegion } from '@yikart/mongodb'
import { CreateULHostInstanceRequest, UCloudService, UHostIPSet, ULHostState } from '@yikart/ucloud'
import { bufferCount, concatMap, from, lastValueFrom, mergeMap, toArray } from 'rxjs'
import { CloudInstanceStatus } from '../../common/enums'
import { config } from '../../config'

export interface InstanceRuntime {
  instanceId: string
  providerStatus: ULHostState
  status: CloudInstanceStatus
  ip?: string
}

@Injectable()
export class CloudInstanceService {
  private readonly logger = new Logger(CloudInstanceService.name)

  constructor(private readonly ucloudService: UCloudService) {}

  async createInstance(region: CloudSpaceRegion, month: number, name?: string) {
    const password = generateSecurePassword()
    const request: CreateULHostInstanceRequest = {
      ProjectId: config.ucloud.projectId,
      Region: region,
      ImageId: config.ucloud.imageId,
      BundleId: config.ucloud.bundleId,
      // ChargeType: 'Month',
      Quantity: month,
      Password: btoa(password),
      Name: name,
    }

    const response = await this.ucloudService.ulHost.createULHostInstance(request)

    if (response.RetCode !== 0) {
      throw new AppException(ResponseCode.UCloudInstanceCreationFailed, response.Message)
    }

    const instanceInfo = await this.getInstanceWithIp(response.ULHostId, region)
    return {
      password,
      ...instanceInfo,
    }
  }

  async getInstanceStatus(instanceId: string, region: CloudSpaceRegion) {
    const response = await this.ucloudService.ulHost.describeULHostInstance({
      Region: region,
      ULHostIds: [instanceId],
    })

    if (response.RetCode !== 0 || !response.ULHostInstanceSets.length) {
      throw new AppException(ResponseCode.UCloudInstanceNotFound)
    }

    const instance = response.ULHostInstanceSets[0]
    const ip = this.extractIp(instance.IPSet)

    return {
      id: instance.ULHostId,
      status: this.mapUCloudStatus(instance.State),
      expiredAt: instance.ExpireTime ? new Date(instance.ExpireTime * 1000) : undefined,
      ip,
    }
  }

  async listInstanceStatus(instanceIds: string[], region: CloudSpaceRegion): Promise<InstanceRuntime[]> {
    if (instanceIds.length === 0) {
      return []
    }

    return lastValueFrom(
      from(instanceIds).pipe(
        bufferCount(100),
        concatMap(chunk =>
          this.ucloudService.ulHost.describeULHostInstance({
            Region: region,
            ULHostIds: chunk,
          }),
        ),
        mergeMap((response) => {
          if (response.RetCode !== 0) {
            this.logger.warn(`Failed to query instances in region ${region}: ${response.Message}`)
            return []
          }

          return response.ULHostInstanceSets.map((instance) => {
            const ip = this.extractIp(instance.IPSet)
            return {
              instanceId: instance.ULHostId,
              providerStatus: instance.State,
              status: this.mapUCloudStatus(instance.State),
              ip,
            }
          })
        }),
        toArray(),
      ),
    )
  }

  async deleteInstance(instanceId: string, region: CloudSpaceRegion): Promise<void> {
    const response = await this.ucloudService.ulHost.terminateULHostInstance({
      Region: region,
      ULHostId: instanceId,
    })

    if (response.RetCode !== 0) {
      throw new AppException(ResponseCode.UCloudInstanceDeletionFailed, response.Message)
    }
  }

  private async getInstanceWithIp(id: string, region: CloudSpaceRegion) {
    const status = await this.getInstanceStatus(id, region)

    return {
      ...status,
      region,
    }
  }

  private mapUCloudStatus(ucloudStatus: ULHostState): CloudInstanceStatus {
    const statusMapping: Record<ULHostState, CloudInstanceStatus> = {
      [ULHostState.Initializing]: CloudInstanceStatus.Creating,
      [ULHostState.Starting]: CloudInstanceStatus.Creating,
      [ULHostState.Running]: CloudInstanceStatus.Running,
      [ULHostState.Stopping]: CloudInstanceStatus.Stopped,
      [ULHostState.Stopped]: CloudInstanceStatus.Stopped,
      [ULHostState.InstallFail]: CloudInstanceStatus.Error,
      [ULHostState.Rebooting]: CloudInstanceStatus.Error,
      [ULHostState.Unknown]: CloudInstanceStatus.Error,
    }
    return statusMapping[ucloudStatus]
  }

  private extractIp(ipSet: UHostIPSet[]): string | undefined {
    for (const ip of ipSet) {
      if (ip.Type !== 'Private') {
        return ip.IP
      }
    }
    return undefined
  }
}
