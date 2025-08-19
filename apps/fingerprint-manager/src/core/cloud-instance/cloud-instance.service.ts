import { AppException, BrowserEnvironmentRegion, CloudInstanceStatus, ResponseCode } from '@aitoearn/common'
import { CreateULHostInstanceRequest, UCloudService } from '@aitoearn/ucloud'
import { Injectable } from '@nestjs/common'
import { CreateCloudInstanceDto, InstanceStatusDto, ULHostInstanceInfoDto } from './cloud-instance.dto'

@Injectable()
export class CloudInstanceService {
  constructor(private readonly ucloudService: UCloudService) {}

  async createInstance(dto: CreateCloudInstanceDto): Promise<ULHostInstanceInfoDto> {
    const request: CreateULHostInstanceRequest = {
      Region: dto.region,
      ImageId: dto.imageId,
      BundleId: dto.bundleId,
      Password: btoa(this.generateSecurePassword()),
      Name: dto.name || `browser-env-${Date.now()}`,
    }

    const response = await this.ucloudService.ulHost.createULHostInstance(request)

    if (response.RetCode !== 0) {
      throw new AppException(ResponseCode.UCloudInstanceCreationFailed, response.Message)
    }

    return await this.getInstanceWithIp(response.ULHostId, dto.region)
  }

  async getInstanceStatus(instanceId: string, region: BrowserEnvironmentRegion): Promise<InstanceStatusDto> {
    const response = await this.ucloudService.ulHost.describeULHostInstance({
      Region: region,
      ULHostIds: [instanceId],
    })

    if (response.RetCode !== 0 || !response.ULHostInstanceSets.length) {
      throw new AppException(ResponseCode.UCloudInstanceNotFound, 'Instance not found')
    }

    const instance = response.ULHostInstanceSets[0]
    const publicIp = this.extractPublicIp(instance.IPSet)
    const privateIp = this.extractPrivateIp(instance.IPSet)

    return {
      instanceId: instance.ULHostId,
      status: this.mapUCloudStatus(instance.State),
      publicIp,
      privateIp,
    }
  }

  async waitForInstanceReady(instanceId: string, region: BrowserEnvironmentRegion, timeoutMinutes = 10): Promise<void> {
    const timeoutMs = timeoutMinutes * 60 * 1000
    const startTime = Date.now()
    const pollInterval = 10000

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getInstanceStatus(instanceId, region)

      if (status.status === CloudInstanceStatus.Running) {
        return
      }

      if (status.status === CloudInstanceStatus.Error) {
        throw new AppException(ResponseCode.UCloudInstanceError, 'Instance failed to start')
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new AppException(ResponseCode.UCloudInstanceTimeout, `Instance ${instanceId} failed to become ready within ${timeoutMinutes} minutes`)
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

  private async getInstanceWithIp(instanceId: string, region: BrowserEnvironmentRegion): Promise<ULHostInstanceInfoDto> {
    await new Promise(resolve => setTimeout(resolve, 2000))

    const status = await this.getInstanceStatus(instanceId, region)

    return {
      ULHostId: instanceId,
      publicIp: status.publicIp || '',
      privateIp: status.privateIp,
      status: status.status,
      region,
    }
  }

  private mapUCloudStatus(ucloudStatus: string): CloudInstanceStatus {
    const statusMapping: Record<string, CloudInstanceStatus> = {
      'Initializing': CloudInstanceStatus.Creating,
      'Starting': CloudInstanceStatus.Creating,
      'Running': CloudInstanceStatus.Running,
      'Stopping': CloudInstanceStatus.Stopped,
      'Stopped': CloudInstanceStatus.Stopped,
      'Rebooting': CloudInstanceStatus.Creating,
      'Install Fail': CloudInstanceStatus.Error,
      'ResizeFail': CloudInstanceStatus.Error,
    }
    return statusMapping[ucloudStatus] || CloudInstanceStatus.Error
  }

  private extractPublicIp(ipSet: unknown[]): string {
    if (!Array.isArray(ipSet))
      return ''

    for (const ip of ipSet) {
      if (typeof ip === 'object' && ip !== null) {
        const ipObj = ip as { Type?: string, IP?: string }
        if (ipObj.Type === 'Public' || ipObj.Type === 'International') {
          return ipObj.IP || ''
        }
      }
    }
    return ''
  }

  private extractPrivateIp(ipSet: unknown[]): string | undefined {
    if (!Array.isArray(ipSet))
      return undefined

    for (const ip of ipSet) {
      if (typeof ip === 'object' && ip !== null) {
        const ipObj = ip as { Type?: string, IP?: string }
        if (ipObj.Type === 'Private') {
          return ipObj.IP
        }
      }
    }
    return undefined
  }

  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }
}
