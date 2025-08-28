import { createHash } from 'node:crypto'
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import {
  MultiloginError,
  MultiloginRateLimitError,
} from './multilogin.exception'
import {
  AllProfilesStatusResponse,
  AllQuickProfilesStatusResponse,
  AuthRefreshTokenRequest,
  AuthResponse,
  AuthRevokeTokenRequest,
  AuthSignInRequest,
  AutomationTokenResponse,
  BrowserCoreListResponse,
  ConvertQBPRequest,
  ConvertQBPResponse,
  CookieExportResponse,
  CookieImportRequest,
  CookieImportResponse,
  CreateFolderRequest,
  CreateFolderResponse,
  CreateProfileRequest,
  CreateProfileResponse,
  FolderListItem,
  FoldersResponse,
  LoadBrowserCoreResponse,
  LoadedBrowserCoresResponse,
  MultiloginClientConfig,
  ProfileMetasRequest,
  ProfileMetasResponse,
  ProfileRemoveRequest,
  ProfileResponse,
  ProfileSearchRequest,
  ProfileSearchResponse,
  ProfileStatus,
  ProfileSummaryResponse,
  QuickProfileRequest,
  RemoveFoldersRequest,
  TokenListResponse,
  UnlockProfilesRequest,
  UnlockProfilesResponse,
  UpdateFolderRequest,
  UpdateProfileRequest,
  ValidateProxyRequest,
  ValidateProxyResponse,
  VersionResponse,
  WorkspacesResponse,
} from './multilogin.interface'

export class MultiloginClient {
  private httpClient: AxiosInstance
  private launcherClient: AxiosInstance
  private token?: string
  private email: string
  private password: string
  private isRefreshing = false
  private refreshPromise?: Promise<void>
  private onTokenRefresh?: (token: string) => void | Promise<void>

  constructor(config: MultiloginClientConfig) {
    this.email = config.email
    this.password = config.password
    this.token = config.token
    this.onTokenRefresh = config.onTokenRefresh

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

  private createHttpClient(baseUrl: string, timeout = 60000): AxiosInstance {
    const client = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 添加请求拦截器，自动添加认证头
    client.interceptors.request.use(async (config) => {
      if (!this.token) {
        await this.refreshTokenIfNeeded()
      }

      if (this.token && config.headers) {
        config.headers.Authorization = `Bearer ${this.token}`
      }
      return config
    })

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
    await this.signIn({
      email: this.email,
      password: this.password,
    })

    // 获取 automation token
    const automationTokenResponse: AxiosResponse<AutomationTokenResponse> = await this.httpClient.get(
      '/workspace/automation_token',
    )
    await this.setToken(automationTokenResponse.data.data.token)
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

  /**
   * 设置token并触发hook
   */
  private async setToken(newToken: string): Promise<void> {
    this.token = newToken
    if (this.onTokenRefresh) {
      await this.onTokenRefresh(newToken)
    }
  }

  /**
   * 获取当前token
   */
  public getToken(): string | undefined {
    return this.token
  }

  // ==================== Profile API Methods ====================

  async signIn(request: AuthSignInRequest): Promise<AuthResponse> {
    const hashedPassword = createHash('md5').update(request.password).digest('hex')
    const requestWithHashedPassword = {
      ...request,
      password: hashedPassword,
    }

    const response: AxiosResponse<AuthResponse> = await axios.post(
      `${this.httpClient.defaults.baseURL}/user/signin`,
      requestWithHashedPassword,
      {
        timeout: this.httpClient.defaults.timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    this.token = response.data.data.token
    return response.data
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
    const hashedCurrentPassword = createHash('md5').update(currentPassword).digest('hex')
    const hashedNewPassword = createHash('md5').update(newPassword).digest('hex')

    await this.httpClient.post('/user/change_password', {
      password: hashedCurrentPassword,
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

  async getAutomationToken(expirationPeriod?: string): Promise<AutomationTokenResponse> {
    const params = expirationPeriod ? { expiration_period: expirationPeriod } : {}
    const response: AxiosResponse<AutomationTokenResponse> = await this.httpClient.get(
      '/workspace/automation_token',
      { params },
    )
    return response.data
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
    await this.httpClient.post('/profile/update', request)
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

  async startQuickProfile(request: QuickProfileRequest): Promise<ProfileResponse> {
    const response: AxiosResponse<ProfileResponse> = await this.launcherClient.post(
      '/api/v3/profile/quick',
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

  async getAllProfilesStatus(): Promise<AllProfilesStatusResponse> {
    const response: AxiosResponse<AllProfilesStatusResponse> = await this.launcherClient.get(
      '/api/v1/profile/statuses',
    )
    return response.data
  }

  async getAllQuickProfilesStatus(): Promise<AllQuickProfilesStatusResponse> {
    const response: AxiosResponse<AllQuickProfilesStatusResponse> = await this.launcherClient.get(
      '/api/v1/profile/quick/statuses',
    )
    return response.data
  }

  async getLoadedBrowserCores(): Promise<LoadedBrowserCoresResponse> {
    const response: AxiosResponse<LoadedBrowserCoresResponse> = await this.launcherClient.get(
      '/api/v1/loaded_browser_cores',
    )
    return response.data
  }

  async getBrowserCoreList(): Promise<BrowserCoreListResponse> {
    const response: AxiosResponse<BrowserCoreListResponse> = await this.launcherClient.get('/bcs/core/list')
    return response.data
  }

  async loadBrowserCore(coreType: string, version: string): Promise<LoadBrowserCoreResponse> {
    const response: AxiosResponse<LoadBrowserCoreResponse> = await this.launcherClient.get(
      '/api/v1/load_browser_core',
      {
        params: {
          browser_type: coreType,
          version,
        },
      },
    )
    return response.data
  }

  async deleteBrowserCore(coreType: string, version: string): Promise<LoadBrowserCoreResponse> {
    const response: AxiosResponse<LoadBrowserCoreResponse> = await this.launcherClient.delete(
      '/api/v1/delete_browser_core',
      {
        params: {
          browser_type: coreType,
          version,
        },
      },
    )
    return response.data
  }

  async validateProxy(request: ValidateProxyRequest): Promise<ValidateProxyResponse> {
    const response: AxiosResponse<ValidateProxyResponse> = await this.launcherClient.post(
      '/api/v1/proxy/validate',
      request,
    )
    return response.data
  }

  async importCookies(request: CookieImportRequest): Promise<CookieImportResponse> {
    const response: AxiosResponse<CookieImportResponse> = await this.launcherClient.post(
      '/api/v1/cookie_import',
      request,
    )
    return response.data
  }

  async exportCookies(profileId: string): Promise<CookieExportResponse> {
    const response: AxiosResponse<CookieExportResponse> = await this.launcherClient.post(
      '/api/v1/cookie_export',
      { profile_id: profileId },
    )
    return response.data
  }

  async convertQBPToProfile(request: ConvertQBPRequest): Promise<ConvertQBPResponse> {
    const response: AxiosResponse<ConvertQBPResponse> = await this.launcherClient.post(
      '/api/v1/profile/quick/save',
      request,
    )
    return response.data
  }

  async unlockProfiles(request?: UnlockProfilesRequest): Promise<UnlockProfilesResponse> {
    const response: AxiosResponse<UnlockProfilesResponse> = await this.httpClient.request({
      method: 'GET',
      url: '/bpds/profile/unlock_profiles',
      data: request,
    })
    return response.data
  }

  async getProfileMetas(request: ProfileMetasRequest): Promise<ProfileMetasResponse> {
    const response: AxiosResponse<ProfileMetasResponse> = await this.httpClient.post(
      '/profile/metas',
      request,
    )
    return response.data
  }

  async getProfileSummary(metaId: string): Promise<ProfileSummaryResponse> {
    const response: AxiosResponse<ProfileSummaryResponse> = await this.httpClient.get(
      `/profile/summary?meta_id=${metaId}`,
    )
    return response.data
  }
}
