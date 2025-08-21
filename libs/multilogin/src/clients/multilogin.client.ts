import { createHash } from 'node:crypto'
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import {
  MultiloginError,
  MultiloginRateLimitError,
} from '../multilogin.exception'
import {
  AuthRefreshTokenRequest,
  AuthResponse,
  AuthRevokeTokenRequest,
  AuthSignInRequest,
  AutomationTokenResponse,
  BrowserCore,
  ConvertQBPRequest,
  CookieExportResponse,
  CookieImportRequest,
  CreateFolderRequest,
  CreateFolderResponse,
  CreateProfileRequest,
  CreateProfileResponse,
  FolderListItem,
  FoldersResponse,
  ProfileRemoveRequest,
  ProfileResponse,
  ProfileSearchRequest,
  ProfileSearchResponse,
  ProfileStatus,
  QuickProfileRequest,
  RemoveFoldersRequest,
  StartProfileRequest,
  TokenListResponse,
  UpdateFolderRequest,
  UpdateProfileRequest,
  ValidateProxyRequest,
  ValidateProxyResponse,
  VersionResponse,
  WorkspacesResponse,
} from '../multilogin.interface'

export interface MultiloginClientConfig {
  profileBaseUrl?: string
  launcherBaseUrl?: string
  timeout?: number
  email: string
  password: string
  token?: string
}

/**
 * 统一的 Multilogin 客户端，集成了 Profile API 和 Launcher API
 * 支持自动 token 管理和 401 错误重试机制
 */
export class MultiloginClient {
  private httpClient: AxiosInstance
  private launcherClient: AxiosInstance
  private token?: string
  private email: string
  private password: string
  private isRefreshing = false
  private refreshPromise?: Promise<void>

  constructor(config: MultiloginClientConfig) {
    this.email = config.email
    this.password = config.password
    this.token = config.token

    // 创建 Profile API 的 HTTP 客户端
    this.httpClient = this.createHttpClient(
      config.profileBaseUrl || 'https://api.multilogin.com',
      config.timeout,
    )

    // 创建 Launcher API 的 HTTP 客户端
    this.launcherClient = this.createHttpClient(
      config.launcherBaseUrl || 'https://launcher.mlx.yt:45001',
      config.timeout,
    )
  }

  private createHttpClient(baseUrl: string, timeout = 30000): AxiosInstance {
    const client = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 添加请求拦截器，自动添加认证头
    client.interceptors.request.use(async (config) => {
      // 如果没有 token 但有用户名密码，先获取 token
      if (!this.token) {
        await this.refreshTokenIfNeeded()
      }

      if (this.token && config.headers) {
        config.headers.Authorization = `Bearer ${this.token}`
      }
      return config
    })

    // 添加响应拦截器，处理 401 错误
    client.interceptors.response.use(
      response => response,
      async (error) => {
        if (error.response?.status === 401 && error.config) {
          await this.refreshTokenIfNeeded()
          // 重试原始请求
          const originalRequest = error.config
          if (this.token && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${this.token}`
          }
          return client.request(originalRequest)
        }
        throw this.handleError(error)
      },
    )

    return client
  }

  private handleError(error: AxiosError): MultiloginError {
    if (!error.response) {
      return error
    }

    const { status, data } = error.response
    const message = (data as Record<string, unknown>)?.['msg'] as string || error.message

    switch (status) {
      case 429:
        return new MultiloginRateLimitError(message)
      default:
        return new MultiloginError(message, status, data)
    }
  }

  /**
   * 刷新 automation token
   */
  private async refreshAutomationToken(): Promise<void> {
    // 首先使用用户凭据登录获取临时 token
    const authResponse = await this.signInInternal({
      email: this.email,
      password: this.password,
    })

    // 设置临时 token
    this.token = authResponse.data.token

    // 获取长效 automation token
    const automationTokenResponse = await this.getAutomationTokenInternal()
    // 使用长效 automation token 替换临时 token
    this.token = automationTokenResponse.data.token
  }

  /**
   * 如果需要则刷新 token（防止并发刷新）
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    if (this.isRefreshing) {
      // 如果正在刷新，等待刷新完成
      if (this.refreshPromise) {
        await this.refreshPromise
      }
      return
    }

    this.isRefreshing = true
    this.refreshPromise = this.refreshAutomationToken().finally(() => {
      this.isRefreshing = false
      this.refreshPromise = undefined
    })

    await this.refreshPromise
  }

  // ==================== Profile API Methods ====================

  private async signInInternal(request: AuthSignInRequest): Promise<AuthResponse> {
    // 对密码进行 MD5 哈希处理
    const hashedPassword = createHash('md5').update(request.password).digest('hex')
    const requestWithHashedPassword = {
      ...request,
      password: hashedPassword,
    }

    const response: AxiosResponse<AuthResponse> = await this.httpClient.post(
      '/user/signin',
      requestWithHashedPassword,
    )
    return response.data
  }

  async signIn(request: AuthSignInRequest): Promise<AuthResponse> {
    const response = await this.signInInternal(request)
    this.token = response.data.token
    return response
  }

  async refreshToken(request: AuthRefreshTokenRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.httpClient.post(
      '/user/refresh_token',
      request,
    )
    this.token = response.data.data.token
    return response.data
  }

  async revokeToken(request: AuthRevokeTokenRequest): Promise<void> {
    await this.httpClient.post('/user/revoke_tokens', request)
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // 对密码进行 MD5 哈希处理
    const hashedNewPassword = createHash('md5').update(newPassword).digest('hex')

    await this.httpClient.post('/user/change_password', {
      password: currentPassword,
      new_password: hashedNewPassword,
    })
  }

  async getUserWorkspaces(): Promise<WorkspacesResponse> {
    const response: AxiosResponse<WorkspacesResponse> = await this.httpClient.get('/user/workspaces')
    return response.data
  }

  async getTokenList(): Promise<TokenListResponse> {
    const response: AxiosResponse<TokenListResponse> = await this.httpClient.get('/user/tokens_list')
    return response.data
  }

  private async getAutomationTokenInternal(expirationPeriod?: number): Promise<AutomationTokenResponse> {
    const params = expirationPeriod ? { expiration_period: expirationPeriod } : {}
    const response: AxiosResponse<AutomationTokenResponse> = await this.httpClient.get(
      '/workspace/automation_token',
      { params },
    )
    return response.data
  }

  async getAutomationToken(expirationPeriod?: number): Promise<AutomationTokenResponse> {
    return await this.getAutomationTokenInternal(expirationPeriod)
  }

  async searchProfiles(request: ProfileSearchRequest): Promise<ProfileSearchResponse> {
    const response: AxiosResponse<ProfileSearchResponse> = await this.httpClient.post(
      '/profile/search',
      request,
    )
    return response.data
  }

  async createProfile(profile: CreateProfileRequest): Promise<CreateProfileResponse> {
    const response: AxiosResponse<CreateProfileResponse> = await this.httpClient.post(
      '/profile/create',
      profile,
    )
    return response.data
  }

  async updateProfile(profileId: string, profile: UpdateProfileRequest): Promise<void> {
    const request = {
      profile_id: profileId,
      ...profile,
    }
    await this.httpClient.put('/profile/update', request)
  }

  async deleteProfile(profileId: string, permanently = false): Promise<void> {
    const request: ProfileRemoveRequest = {
      ids: [profileId],
      permanently,
    }
    await this.httpClient.post('/profile/remove', request)
  }

  async getFolders(): Promise<FolderListItem[]> {
    const response: AxiosResponse<FoldersResponse> = await this.httpClient.get(
      '/workspace/folders',
    )
    return response.data.data.folders
  }

  async createFolder(name: string, comment?: string): Promise<CreateFolderResponse> {
    const request: CreateFolderRequest = { name, comment }
    const response: AxiosResponse<CreateFolderResponse> = await this.httpClient.post(
      '/workspace/folder_create',
      request,
    )
    return response.data
  }

  async updateFolder(folderId: string, name: string, comment?: string): Promise<void> {
    const request: UpdateFolderRequest = {
      folder_id: folderId,
      name,
      comment,
    }
    await this.httpClient.post('/workspace/folder_update', request)
  }

  async deleteFolders(folderIds: string[]): Promise<void> {
    const request: RemoveFoldersRequest = { ids: folderIds }
    await this.httpClient.post('/workspace/folders_remove', request)
  }

  async deleteFolder(folderId: string): Promise<void> {
    await this.deleteFolders([folderId])
  }

  // ==================== Launcher API Methods ====================

  async startBrowserProfile(
    folderId: string,
    profileId: string,
    options?: { automation_type?: string, headless_mode?: boolean },
  ): Promise<ProfileResponse> {
    const params = new URLSearchParams()
    if (options?.automation_type) {
      params.append('automation_type', options.automation_type)
    }
    if (options?.headless_mode !== undefined) {
      params.append('headless_mode', options.headless_mode.toString())
    }

    const response: AxiosResponse<ProfileResponse> = await this.launcherClient.get(
      `/api/v2/profile/f/${folderId}/p/${profileId}/start${params.toString() ? `?${params.toString()}` : ''}`,
    )
    return response.data
  }

  async startQuickProfileV3(request: QuickProfileRequest): Promise<ProfileResponse> {
    const response: AxiosResponse<ProfileResponse> = await this.launcherClient.post(
      '/api/v3/profile/quick',
      request,
    )
    return response.data
  }

  async startQuickProfile(request: StartProfileRequest): Promise<ProfileResponse> {
    const response: AxiosResponse<ProfileResponse> = await this.launcherClient.post(
      '/api/v2/profile/quick',
      request,
    )
    return response.data
  }

  async stopBrowserProfile(profileId: string): Promise<void> {
    await this.launcherClient.get(`/api/v1/profile/stop/p/${profileId}`)
  }

  async stopAllProfiles(type: 'all' | 'regular' | 'quick' = 'all'): Promise<void> {
    await this.launcherClient.get(`/api/v1/profile/stop_all?type=${type}`)
  }

  async getVersion(): Promise<VersionResponse> {
    const response: AxiosResponse<VersionResponse> = await this.launcherClient.get('/api/v1/version')
    return response.data
  }

  async getProfileStatus(profileId: string): Promise<ProfileStatus> {
    const response: AxiosResponse<ProfileStatus> = await this.launcherClient.get(
      `/api/v1/profile/status/p/${profileId}`,
    )
    return response.data
  }

  async getAllProfilesStatus(): Promise<ProfileStatus[]> {
    const response: AxiosResponse<ProfileStatus[]> = await this.launcherClient.get(
      '/api/v1/profile/statuses',
    )
    return response.data
  }

  async getAllQuickProfilesStatus(): Promise<ProfileStatus[]> {
    const response: AxiosResponse<ProfileStatus[]> = await this.launcherClient.get(
      '/api/v1/profile/quick/statuses',
    )
    return response.data
  }

  async getLoadedBrowserCores(): Promise<BrowserCore[]> {
    const response: AxiosResponse<BrowserCore[]> = await this.launcherClient.get(
      '/api/v1/core/loaded',
    )
    return response.data
  }

  async getBrowserCoreList(): Promise<BrowserCore[]> {
    const response: AxiosResponse<BrowserCore[]> = await this.launcherClient.get('/api/v1/core/list')
    return response.data
  }

  async loadBrowserCore(coreType: string, version: string): Promise<void> {
    await this.launcherClient.get(`/api/v1/core/load/${coreType}/${version}`)
  }

  async deleteBrowserCore(coreType: string, version: string): Promise<void> {
    await this.launcherClient.delete(`/api/v1/core/delete/${coreType}/${version}`)
  }

  async validateProxy(request: ValidateProxyRequest): Promise<ValidateProxyResponse> {
    const response: AxiosResponse<ValidateProxyResponse> = await this.launcherClient.post(
      '/api/v1/proxy/validate',
      request,
    )
    return response.data
  }

  async importCookies(request: CookieImportRequest): Promise<void> {
    await this.launcherClient.post('/api/v1/cookies/import', request)
  }

  async exportCookies(profileId: string): Promise<CookieExportResponse> {
    const response: AxiosResponse<CookieExportResponse> = await this.launcherClient.get(
      `/api/v1/cookies/export/${profileId}`,
    )
    return response.data
  }

  async convertQBPToProfile(request: ConvertQBPRequest): Promise<void> {
    await this.launcherClient.post('/api/v1/profile/quick/save', request)
  }
}
