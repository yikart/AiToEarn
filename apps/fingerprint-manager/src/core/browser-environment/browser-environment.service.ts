import { AppException, BrowserEnvironmentStatus, ResponseCode } from '@aitoearn/common'
import { BrowserEnvironmentRepository, BrowserProfileRepository } from '@aitoearn/mongodb'
import { Injectable } from '@nestjs/common'
import { CloudInstanceService } from '../cloud-instance'
import { MultiloginAccountService } from '../multilogin-account'
import {
  CreateBrowserEnvironmentDto,
  ListBrowserEnvironmentsDto,
} from './browser-environment.dto'

@Injectable()
export class BrowserEnvironmentService {
  constructor(
    private readonly browserEnvironmentRepository: BrowserEnvironmentRepository,
    private readonly browserProfileRepository: BrowserProfileRepository,
    private readonly multiloginAccountService: MultiloginAccountService,
    private readonly cloudInstanceService: CloudInstanceService,
  ) {}

  async createEnvironment(dto: CreateBrowserEnvironmentDto) {
    const account = await this.allocateMultiloginAccount()

    try {
      const environment = await this.browserEnvironmentRepository.create({
        userId: dto.userId,
        instanceId: '',
        region: dto.region,
        status: BrowserEnvironmentStatus.Creating,
        ip: '',
      })

      const profile = await this.browserProfileRepository.create({
        accountId: account.id,
        profileId: this.generateProfileId(),
        environmentId: environment.id,
        config: this.generateFingerprintConfig() as Record<string, unknown>,
      })

      const instance = await this.cloudInstanceService.createInstance({
        region: dto.region,
        imageId: this.getBrowserImageId(),
        bundleId: this.getDefaultBundleId(),
        name: `browser-env-${dto.userId}-${Date.now()}`,
      })

      await this.browserEnvironmentRepository.updateById(environment.id, {
        instanceId: instance.ULHostId,
        ip: instance.publicIp,
      })

      this.configureEnvironmentAsync(environment.id, account.id, profile.profileId)

      const updatedEnvironment = await this.browserEnvironmentRepository.getById(environment.id)
      if (!updatedEnvironment) {
        throw new Error('Failed to retrieve created environment')
      }

      return updatedEnvironment
    }
    catch (error) {
      await this.multiloginAccountService.decrementCurrentProfiles(account.id)
      throw error
    }
  }

  async listEnvironments(dto: ListBrowserEnvironmentsDto) {
    return await this.browserEnvironmentRepository.listWithPagination(dto)
  }

  async getEnvironmentStatus(environmentId: string) {
    const environment = await this.browserEnvironmentRepository.getById(environmentId)
    if (!environment) {
      throw new AppException(ResponseCode.BrowserEnvironmentNotFound)
    }
    return environment
  }

  async deleteEnvironment(environmentId: string): Promise<void> {
    const environment = await this.browserEnvironmentRepository.getById(environmentId)
    if (!environment) {
      throw new AppException(ResponseCode.BrowserEnvironmentNotFound)
    }

    const profiles = await this.browserProfileRepository.findByEnvironmentId(environmentId)
    for (const profile of profiles) {
      await this.multiloginAccountService.decrementCurrentProfiles(profile.accountId)
    }

    await this.browserProfileRepository.deleteByEnvironmentId(environmentId)
    await this.browserEnvironmentRepository.deleteById(environmentId)
  }

  private async configureEnvironmentAsync(environmentId: string, accountId: string, profileId: string): Promise<void> {
    try {
      await this.browserEnvironmentRepository.updateById(environmentId, {
        status: BrowserEnvironmentStatus.Configuring,
      })

      const environment = await this.browserEnvironmentRepository.getById(environmentId)
      if (!environment) {
        throw new Error('Environment not found during configuration')
      }

      await this.cloudInstanceService.waitForInstanceReady(environment.instanceId, environment.region)
      await this.deployBrowserAgent(environment.ip)

      await this.createMultiloginProfile(environment.ip, {
        environmentId,
        accountId,
        profileName: profileId,
      })

      await this.browserEnvironmentRepository.updateById(environmentId, {
        status: BrowserEnvironmentStatus.Ready,
      })
    }
    catch (error) {
      await this.handleEnvironmentCreationFailure(environmentId, accountId, error as Error)
    }
  }

  private async allocateMultiloginAccount() {
    const accounts = await this.multiloginAccountService.findAccountsWithAvailableSlots(1)

    if (accounts.length === 0) {
      throw new AppException(ResponseCode.NoAvailableMultiloginAccount)
    }

    const optimalAccount = accounts[0]
    await this.multiloginAccountService.incrementCurrentProfiles(optimalAccount.id)

    return optimalAccount
  }

  private async deployBrowserAgent(_instanceIp: string): Promise<void> {
    // TODO: 实现真实的Agent部署逻辑
    // 这里应该使用SSH或其他方式在云主机上部署指纹管理Agent
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 5000)
    })
  }

  private async handleEnvironmentCreationFailure(environmentId: string, accountId: string, _error: Error): Promise<void> {
    await this.browserEnvironmentRepository.updateById(environmentId, {
      status: BrowserEnvironmentStatus.Error,
    })
    await this.multiloginAccountService.decrementCurrentProfiles(accountId)
  }

  private getBrowserImageId(): string {
    // TODO: 从配置中获取预装浏览器和Multilogin的镜像ID
    return 'uimage-xxx'
  }

  private getDefaultBundleId(): string {
    // TODO: 从配置中获取默认的实例规格
    return 'uhost-xxx'
  }

  private async createMultiloginProfile(environmentIp: string, dto: { environmentId: string, accountId: string, profileName: string }): Promise<string> {
    // TODO: 实现与Multilogin Agent的通信
    const agentUrl = `http://${environmentIp}:8080`
    const response = await this.callAgentAPI(agentUrl, {
      action: 'createProfile',
      profileName: dto.profileName,
      config: {},
    }) as { success: boolean, profileId?: string, error?: string }

    if (!response.success) {
      throw new AppException(ResponseCode.MultiloginProfileCreationFailed, response.error || 'Failed to create Multilogin profile')
    }

    return response.profileId!
  }

  private generateFingerprintConfig() {
    return {
      userAgent: this.getRandomUserAgent(),
      viewport: this.getRandomViewport(),
      timezone: this.getRandomTimezone(),
      language: this.getRandomLanguage(),
      webgl: this.generateWebGLFingerprint(),
      canvas: this.generateCanvasFingerprint(),
      geolocation: this.getRandomGeolocation(),
    }
  }

  private generateProfileId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/119.0',
    ]
    return userAgents[Math.floor(Math.random() * userAgents.length)]
  }

  private getRandomViewport(): { width: number, height: number } {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
      { width: 1280, height: 720 },
    ]
    return viewports[Math.floor(Math.random() * viewports.length)]
  }

  private getRandomTimezone(): string {
    const timezones = [
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
      'Asia/Shanghai',
    ]
    return timezones[Math.floor(Math.random() * timezones.length)]
  }

  private getRandomLanguage(): string {
    const languages = [
      'en-US',
      'en-GB',
      'zh-CN',
      'ja-JP',
      'fr-FR',
      'de-DE',
    ]
    return languages[Math.floor(Math.random() * languages.length)]
  }

  private generateWebGLFingerprint(): Record<string, unknown> {
    return {
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 6GB Direct3D11 vs_5_0 ps_5_0, D3D11-27.21.14.5671)',
      version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
      shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)',
      extensions: ['WEBGL_compressed_texture_s3tc', 'WEBGL_debug_renderer_info', 'WEBGL_debug_shaders'],
    }
  }

  private generateCanvasFingerprint(): Record<string, unknown> {
    return {
      textMetrics: { width: 104.5, actualBoundingBoxLeft: 0, actualBoundingBoxRight: 104.5 },
      imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      supportedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    }
  }

  private getRandomGeolocation() {
    const locations = [
      { latitude: 40.7128, longitude: -74.0060 },
      { latitude: 34.0522, longitude: -118.2437 },
      { latitude: 51.5074, longitude: -0.1278 },
      { latitude: 48.8566, longitude: 2.3522 },
      { latitude: 35.6762, longitude: 139.6503 },
    ]
    return locations[Math.floor(Math.random() * locations.length)]
  }

  private async callAgentAPI(_agentUrl: string, _payload: unknown): Promise<unknown> {
    // TODO: 实现真实的Agent API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          profileId: this.generateProfileId(),
        })
      }, 1000)
    })
  }
}
