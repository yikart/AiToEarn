import { AppException, BrowserEnvironmentRegion, CloudInstanceStatus, generateSecurePassword, ResponseCode } from '@aitoearn/common'
import { CreateULHostInstanceRequest, UCloudService, UHostIPSet, ULHostState } from '@aitoearn/ucloud'
import { Injectable } from '@nestjs/common'
import { config } from '../../config'

@Injectable()
export class CloudInstanceService {
  constructor(private readonly ucloudService: UCloudService) {}

  async createInstance(region: BrowserEnvironmentRegion, name?: string) {
    const password = generateSecurePassword()
    const request: CreateULHostInstanceRequest = {
      Region: region,
      ImageId: config.ucloud.imageId,
      BundleId: config.ucloud.bundleId,
      Password: password,
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

  async getInstanceStatus(instanceId: string, region: BrowserEnvironmentRegion) {
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
      ip,
    }
  }

  async waitForInstanceReady(instanceId: string, region: BrowserEnvironmentRegion, timeoutMinutes = 10): Promise<void> {
    const timeoutMs = timeoutMinutes * 60 * 1000
    const startTime = Date.now()
    const pollInterval = 5000

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getInstanceStatus(instanceId, region)

      if (status.status === CloudInstanceStatus.Running) {
        return
      }

      if (status.status === CloudInstanceStatus.Error) {
        throw new AppException(ResponseCode.UCloudInstanceError)
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new AppException(ResponseCode.UCloudInstanceTimeout)
  }

  async deleteInstance(instanceId: string, region: BrowserEnvironmentRegion): Promise<void> {
    const response = await this.ucloudService.ulHost.terminateULHostInstance({
      Region: region,
      ULHostId: instanceId,
    })

    if (response.RetCode !== 0) {
      throw new AppException(ResponseCode.UCloudInstanceDeletionFailed, response.Message)
    }
  }

  private async getInstanceWithIp(id: string, region: BrowserEnvironmentRegion) {
    const status = await this.getInstanceStatus(id, region)

    return {
      id,
      ip: status.ip,
      status: status.status,
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
