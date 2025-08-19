import { AppException, ResponseCode } from '@aitoearn/common'
import { BrowserProfileRepository } from '@aitoearn/mongodb'
import { Injectable } from '@nestjs/common'
import {
  CreateBrowserProfileDto,
  FingerprintConfigDto,
  ListBrowserProfilesDto,
} from './browser-profile.dto'

@Injectable()
export class BrowserProfileService {
  constructor(private readonly browserProfileRepository: BrowserProfileRepository) {}

  async createProfile(dto: CreateBrowserProfileDto) {
    // 生成指纹配置
    const fingerprintConfig = dto.config || this.generateFingerprintConfig()

    // 生成唯一的profileId
    const profileId = this.generateProfileId()

    // 创建Profile记录
    return await this.browserProfileRepository.create({
      accountId: dto.accountId,
      profileId,
      environmentId: dto.environmentId,
      config: fingerprintConfig as Record<string, unknown>,
    })
  }

  async listProfiles(dto: ListBrowserProfilesDto) {
    return await this.browserProfileRepository.listWithPagination(dto)
  }

  async getProfileById(profileId: string) {
    const profile = await this.browserProfileRepository.getById(profileId)
    if (!profile) {
      throw new AppException(ResponseCode.BrowserProfileNotFound)
    }
    return profile
  }

  async releaseProfile(profileId: string): Promise<void> {
    const profile = await this.browserProfileRepository.deleteById(profileId)
    if (!profile) {
      throw new AppException(ResponseCode.BrowserProfileNotFound)
    }
  }

  async createMultiloginProfile(environmentIp: string, dto: CreateBrowserProfileDto): Promise<string> {
    // TODO: 实现与Multilogin Agent的通信
    // 这里应该调用部署在云主机上的Agent API来创建Multilogin Profile

    // 模拟调用Agent API
    const agentUrl = `http://${environmentIp}:8080`
    const response = await this.callAgentAPI(agentUrl, {
      action: 'createProfile',
      profileName: dto.profileName,
      config: dto.config,
    }) as { success: boolean, profileId?: string, error?: string }

    if (!response.success) {
      throw new AppException(ResponseCode.MultiloginProfileCreationFailed, response.error || 'Failed to create Multilogin profile')
    }

    return response.profileId!
  }

  private generateFingerprintConfig(): FingerprintConfigDto {
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
      'Asia/Singapore',
      'Australia/Sydney',
    ]
    return timezones[Math.floor(Math.random() * timezones.length)]
  }

  private getRandomLanguage(): string {
    const languages = [
      'en-US',
      'en-GB',
      'zh-CN',
      'ja-JP',
      'ko-KR',
      'de-DE',
      'fr-FR',
      'es-ES',
    ]
    return languages[Math.floor(Math.random() * languages.length)]
  }

  private generateWebGLFingerprint(): Record<string, unknown> {
    return {
      vendor: 'Google Inc. (Intel)',
      renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
      shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)',
      extensions: [
        'ANGLE_instanced_arrays',
        'EXT_blend_minmax',
        'EXT_color_buffer_half_float',
        'EXT_disjoint_timer_query',
        'EXT_float_blend',
        'EXT_frag_depth',
        'EXT_shader_texture_lod',
        'EXT_texture_compression_rgtc',
        'EXT_texture_filter_anisotropic',
        'OES_element_index_uint',
        'OES_fbo_render_mipmap',
        'OES_standard_derivatives',
        'OES_texture_float',
        'OES_texture_float_linear',
        'OES_texture_half_float',
        'OES_texture_half_float_linear',
        'OES_vertex_array_object',
        'WEBGL_color_buffer_float',
        'WEBGL_compressed_texture_s3tc',
        'WEBGL_compressed_texture_s3tc_srgb',
        'WEBGL_debug_renderer_info',
        'WEBGL_debug_shaders',
        'WEBGL_depth_texture',
        'WEBGL_draw_buffers',
        'WEBGL_lose_context',
      ],
    }
  }

  private generateCanvasFingerprint(): Record<string, unknown> {
    return {
      hash: Math.random().toString(36).substr(2, 16),
      geometry: {
        width: 300,
        height: 150,
      },
    }
  }

  private getRandomGeolocation(): { latitude: number, longitude: number } {
    const locations = [
      { latitude: 40.7128, longitude: -74.0060 }, // New York
      { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
      { latitude: 51.5074, longitude: -0.1278 }, // London
      { latitude: 48.8566, longitude: 2.3522 }, // Paris
      { latitude: 35.6762, longitude: 139.6503 }, // Tokyo
      { latitude: 31.2304, longitude: 121.4737 }, // Shanghai
      { latitude: 1.3521, longitude: 103.8198 }, // Singapore
    ]
    return locations[Math.floor(Math.random() * locations.length)]
  }

  private async callAgentAPI(_agentUrl: string, _payload: unknown): Promise<unknown> {
    // TODO: 实现真实的Agent API调用
    // 这里模拟返回成功响应
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
