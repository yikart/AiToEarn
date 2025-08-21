export type BrowserType = 'mimic' | 'stealthfox'
export type OsType = 'windows' | 'macos' | 'linux'
export type AutomationType = 'selenium' | 'puppeteer' | 'playwright'
export type ProxyType = 'http' | 'https' | 'socks4' | 'socks5'

export interface ProxyConfig {
  host: string
  type: ProxyType
  port: number
  username?: string
  password?: string
  save_traffic?: boolean
}

export interface NavigatorFingerprint {
  hardware_concurrency: number
  platform: string
  user_agent: string
  os_cpu: string
}

export interface LocalizationFingerprint {
  languages: string
  locale: string
  accept_languages: string
}

export interface TimezoneFingerprint {
  zone: string
}

export interface GraphicFingerprint {
  renderer: string
  vendor: string
}

export interface WebRTCFingerprint {
  public_ip: string
}

export interface MediaDevicesFingerprint {
  audio_inputs: number
  audio_outputs: number
  video_inputs: number
}

export interface ScreenFingerprint {
  height: number
  pixel_ratio: number
  width: number
}

export interface GeolocationFingerprint {
  accuracy: number
  altitude: number
  latitude: number
  longitude: number
}

export interface CmdParam {
  flag: string
  value: boolean | string
}

export interface CmdParams {
  params: CmdParam[]
}

export interface BrowserFingerprint {
  navigator: NavigatorFingerprint
  localization: LocalizationFingerprint
  timezone: TimezoneFingerprint
  graphic: GraphicFingerprint
  webrtc: WebRTCFingerprint
  media_devices: MediaDevicesFingerprint
  screen: ScreenFingerprint
  geolocation: GeolocationFingerprint
  ports: number[]
  fonts: string[]
  cmd_params: CmdParams
}

export interface MaskingFlags {
  audio_masking?: boolean
  fonts_masking?: boolean
  geolocation_masking?: boolean
  geolocation_popup?: boolean
  graphics_masking?: boolean
  graphics_noise?: boolean
  localization_masking?: boolean
  media_devices_masking?: boolean
  navigator_masking?: boolean
  ports_masking?: boolean
  proxy_masking?: boolean
  screen_masking?: boolean
  timezone_masking?: boolean
  webrtc_masking?: boolean
  canvas_noise?: boolean
  startup_behavior?: string
  quic_mode?: string
}

export interface StartProfileOptions {
  automation_type?: AutomationType
  headless_mode?: boolean
  custom_start_urls?: string[]
}

export interface QuickProfileParameters {
  flags?: MaskingFlags
  fingerprint?: BrowserFingerprint
  custom_start_urls?: string[]
  proxy?: ProxyConfig
}

export interface StorageParameters {
  is_local?: boolean
  save_service_worker?: boolean
}

export interface ProfileParameters {
  flags?: MaskingFlags
  storage?: StorageParameters
  fingerprint?: BrowserFingerprint
  proxy?: ProxyConfig
  custom_start_urls?: string[]
}

export interface StartProfileRequest {
  browser_type: BrowserType
  os_type: OsType
  script_file?: string
  automation: AutomationType
  core_version?: number
  core_minor_version?: number
  is_headless: boolean
  parameters?: ProfileParameters
}

export interface QuickProfileRequest {
  browser_type: BrowserType
  os_type: OsType
  automation: AutomationType
  core_version: number
  is_headless: boolean
  parameters: QuickProfileParameters
}

export interface ProfileStatus {
  status: 'ACTIVE' | 'INACTIVE' | 'STARTING' | 'STOPPING'
  pid?: number
  selenium_port?: number
  profile_id?: string
}

export interface ProfileResponse {
  status: {
    error_code: string
    http_code: number
    message: string
  }
  data: {
    ids: string[]
  }
}

export interface VersionResponse {
  status: {
    error_code: string
    http_code: number
    message: string
  }
  data: {
    env: string
    version: string
  }
}

export interface BrowserCore {
  name: string
  version: string
  type: BrowserType
  status: 'downloaded' | 'available' | 'loading'
}

export interface ValidateProxyRequest {
  proxy: ProxyConfig
}

export interface ValidateProxyResponse {
  status: {
    error_code: string
    http_code: number
    message: string
  }
  data: {
    accuracy: number
    altitude: number
    country_code: string
    ip: string
    latitude: number
    longitude: number
    timezone: string
  }
}

export interface CookieData {
  name: string
  value: string
  domain: string
  path?: string
  expires?: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

export interface CookieImportRequest {
  profile_id: string
  cookies: CookieData[]
}

export interface CookieExportResponse {
  status: {
    error_code: string
    http_code: number
    message: string
  }
  data: {
    cookies: string
    profile_id: string
    timestamp: number
  }
}

export interface ConvertQBPRequest {
  quick_profile_id: string
  folder_id: string
  name: string
}

export interface AuthSignInRequest {
  email: string
  password: string
}

export interface AuthResponse {
  status: {
    error_code: string
    http_code: number
    message: string
  }
  data: {
    refresh_token: string
    token: string
  }
}

export interface AuthRefreshTokenRequest {
  email: string
  refresh_token: string
  workspace_id: string
}

export interface AuthRevokeTokenRequest {
  token?: string
  is_automation?: boolean
}

export interface Workspace {
  workspace_id: string
  name: string
  role: string
}

export interface WorkspacesResponse {
  status: {
    error_code: string
    http_code: number
    message: string
  }
  data: {
    total_count: number
    workspaces: Workspace[]
  }
}

export interface UserProfile {
  id: string
  email: string
  name: string
  workspaces: Workspace[]
}

export interface ProfileListItem {
  id: string
  name: string
  folder_id: string
  browser_type: BrowserType
  os_type: OsType
  core_version: number
  notes?: string
  parameters?: ProfileParameters
  created_at: string
  updated_at: string
  is_removed?: boolean
  storage_type?: string
  abp_status?: boolean
  created_by?: string
  in_use_by?: string
  is_local?: boolean
  last_launched_by?: string
  last_launched_on?: string
  last_launched_at?: string
  locked_by?: string
  password_protected?: boolean
  password_restricted?: boolean
}

export interface FolderListItem {
  id: string
  name: string
  parent_id?: string
  created_at: string
  updated_at: string
}

export interface TokenInfo {
  id: string
  name: string
  permissions: string[]
  created_at: string
}

export interface TokenListResponse {
  status: {
    error_code: string
    http_code: number
    message: string
  }
  data: {
    tokens: Array<{
      token: string
    }>
  }
}

export interface AutomationTokenResponse {
  status: {
    error_code: string
    http_code: number
    message: string
  }
  data: {
    token: string
  }
}

export interface CreateProfileRequest {
  name: string
  browser_type: BrowserType
  folder_id: string
  os_type: OsType
  core_version?: number
  core_minor_version?: number
  times?: number
  auto_update_core?: boolean
  tags?: string[]
  notes?: string
  parameters?: ProfileParameters
}

export interface CreateProfileResponse {
  status: {
    error_code: string
    http_code: number
    message: string
  }
  data: {
    ids: string[]
  }
}

export interface UpdateProfileRequest {
  name?: string
  auto_update_core?: boolean
  core_version?: number
  core_minor_version?: number
  tags?: string[]
  notes?: string
  parameters?: ProfileParameters
}

export interface ProfileSearchRequest {
  is_removed?: boolean
  core_version?: number
  limit?: number
  offset?: number
  search_text?: string
  folder_id?: string
  storage_type?: string
  order_by?: string
  sort?: 'asc' | 'desc'
  date_from?: string
  date_to?: string
  created_date_from?: string
  created_date_to?: string
  updated_date_from?: string
  updated_date_to?: string
  browser_type?: BrowserType
  tags?: string[]
  password_protected?: boolean
  os_type?: OsType
}

export interface ProfileSearchResponse {
  status: {
    error_code: string
    http_code: number
    message: string
  }
  data: {
    profiles: ProfileListItem[]
    total_count: number
  }
}

export interface ProfileRemoveRequest {
  ids: string[]
  permanently: boolean
}

export interface CreateFolderRequest {
  name: string
  comment?: string
}

export interface CreateFolderResponse {
  status: {
    error_code: string
    http_code: number
    message: string
  }
  data: {
    id: string
  }
}

export interface UpdateFolderRequest {
  folder_id: string
  name: string
  comment?: string
}

export interface RemoveFoldersRequest {
  ids: string[]
}

export interface FoldersResponse {
  status: {
    error_code: string
    http_code: number
    message: string
  }
  data: {
    folders: FolderListItem[]
  }
}

// Multi-account support interfaces
export interface AccountCredentials {
  email: string
  password: string
  workspaceId: string
}

export interface AccountInfo {
  accountId: string
  email: string
  workspaceId: string
  accessToken: string
  refreshToken: string
  isActive: boolean
}
