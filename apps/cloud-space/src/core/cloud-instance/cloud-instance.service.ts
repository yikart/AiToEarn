import { Injectable } from '@nestjs/common'
import { AppException, CloudInstanceStatus, CloudSpaceRegion, generateSecurePassword, ResponseCode } from '@yikart/common'
import { CreateULHostInstanceRequest, UCloudService, UHostIPSet, ULHostState } from '@yikart/ucloud'
import { delay, EMPTY, expand, from, lastValueFrom, of, switchMap, timeout } from 'rxjs'
import { config } from '../../config'

@Injectable()
export class CloudInstanceService {
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

  async waitForInstanceReady(instanceId: string, region: CloudSpaceRegion, timeoutMinutes = 10): Promise<void> {
    const timeoutMs = timeoutMinutes * 60 * 1000
    const pollInterval = 5000

    const checkInstanceStatus = () => this.getInstanceStatus(instanceId, region)

    await lastValueFrom(
      of(null).pipe(
        delay(0),
        switchMap(() => from(checkInstanceStatus())),
        expand((status) => {
          if (status.status === CloudInstanceStatus.Running) {
            return EMPTY
          }

          if (status.status === CloudInstanceStatus.Error) {
            throw new AppException(ResponseCode.UCloudInstanceError)
          }

          return from(checkInstanceStatus()).pipe(delay(pollInterval))
        }),
        timeout(timeoutMs),
      ),
    ).catch((error) => {
      if (error.name === 'TimeoutError') {
        throw new AppException(ResponseCode.UCloudInstanceTimeout)
      }
      throw error
    })
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
