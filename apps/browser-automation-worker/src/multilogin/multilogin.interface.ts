export type BrowserType = 'mimic' | 'stealthfox'
export type OsType = 'windows' | 'macos' | 'linux' | 'android'
export type AutomationType = 'selenium' | 'puppeteer' | 'playwright'
export type ProxyType = 'http' | 'https' | 'socks4' | 'socks5'

// ==================== 通用响应接口 ====================

/**
 * Multilogin API 通用状态结构
 */
export interface MultiloginStatus {
  error_code: string | number
  http_code: number
  message: string
}

/**
 * Multilogin API 通用响应基础接口
 */
export interface MultiloginBaseResponse {
  status: MultiloginStatus
}

/**
 * 带数据的 Multilogin API 响应接口
 */
export interface MultiloginDataResponse<T = unknown> extends MultiloginBaseResponse {
  data: T
}

/**
 * 仅包含状态的 Multilogin API 响应接口（用于无返回数据的操作）
 */
export interface MultiloginStatusResponse extends MultiloginBaseResponse {}

// ==================== 业务类型定义 ====================

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
  max_touch_points?: number
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
  audio_masking?: 'mask' | 'natural'
  fonts_masking?: 'natural' | 'custom' | 'mask'
  geolocation_masking?: 'mask' | 'custom'
  geolocation_popup?: 'prompt' | 'allow' | 'block'
  graphics_masking?: 'natural' | 'custom' | 'mask'
  graphics_noise?: 'mask' | 'natural'
  localization_masking?: 'natural' | 'custom' | 'mask'
  media_devices_masking?: 'natural' | 'custom' | 'mask'
  navigator_masking?: 'natural' | 'custom' | 'mask'
  ports_masking?: 'mask' | 'natural'
  proxy_masking?: 'custom' | 'disabled'
  screen_masking?: 'natural' | 'custom' | 'mask'
  timezone_masking?: 'natural' | 'custom' | 'mask'
  webrtc_masking?: 'natural' | 'custom' | 'mask' | 'disabled'
  canvas_noise?: 'mask' | 'natural' | 'disabled'
  startup_behavior?: 'recover' | 'custom'
  quic_mode?: 'natural' | 'disabled'
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

export interface ProfileStatus extends MultiloginDataResponse<{
  browser_type: string
  core_version: number
  folder_id: string
  in_use_by: string
  is_quick: boolean
  last_launched_at: string
  last_launched_by: string
  last_launched_on: string
  message: string
  name: string
  profile_id: string
  status: string
  timestamp: number
  workspace_id: string
}> {}

export interface ProfileStatusItem {
  browser_type: string
  core_version: number
  folder_id: string
  in_use_by: string
  is_quick: boolean
  last_launched_at: string
  last_launched_by: string
  last_launched_on: string
  message: string
  name: string
  profile_id: string
  status: string
  timestamp: number
  workspace_id: string
}

export interface AllProfilesStatusResponse extends MultiloginDataResponse<{
  active_counter: {
    cloud: number
    local: number
    quick: number
  }
  states: Record<string, ProfileStatusItem>
}> {}

export interface QuickProfileStatusItem {
  browser_type: string
  is_quick: boolean
  message: string
  name: string
  status: string
  timestamp: number
}

export interface AllQuickProfilesStatusResponse extends MultiloginDataResponse<{
  active_counter: number
  states: Record<string, QuickProfileStatusItem>
}> {}

export interface ProfileResponse extends MultiloginDataResponse<{
  browser_type: string
  core_version: number
  id: string
  is_quick: boolean
  port: string
}> {}

export interface VersionResponse extends MultiloginDataResponse<{
  env: string
  version: string
}> {}

export interface BrowserCore {
  name: string
  version: string
  type: BrowserType
  status: 'downloaded' | 'available' | 'loading'
}

export interface BrowserCoreVersion {
  full_versions: string[]
  major_version: number
}

export interface BrowserCoreInfo {
  browser_type: string
  versions: BrowserCoreVersion[]
}

export interface BrowserCoreListResponse extends MultiloginDataResponse<{
  core_versions: BrowserCoreInfo[]
}> {}

export interface LoadedBrowserCore {
  is_latest: boolean
  latest_version: string
  type: string
  versions: string[]
}

export interface LoadedBrowserCoresResponse extends MultiloginDataResponse<LoadedBrowserCore[]> {}

export interface LoadBrowserCoreResponse extends MultiloginStatusResponse {}

export interface CookieImportResponse extends MultiloginStatusResponse {}

export interface ConvertQBPResponse extends MultiloginStatusResponse {}

export interface ValidateProxyRequest {
  proxy: ProxyConfig
}

export interface ValidateProxyResponse extends MultiloginDataResponse<{
  accuracy: number
  altitude: number
  country_code: string
  ip: string
  latitude: number
  longitude: number
  timezone: string
}> {}

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

export interface CookieExportResponse extends MultiloginDataResponse<{
  cookies: string
  profile_id: string
  timestamp: number
}> {}

export interface ConvertQBPRequest {
  quick_profile_id: string
  folder_id: string
  name: string
}

export interface AuthSignInRequest {
  email: string
  password: string
}

export interface AuthResponse extends MultiloginDataResponse<{
  refresh_token: string
  token: string
}> {}

export interface SignInResponse extends MultiloginDataResponse<{
  token: string
  refresh_token: string
  expires_in: number
}> {}

export interface RefreshTokenResponse extends MultiloginDataResponse<{
  token: string
  refresh_token: string
  expires_in: number
}> {}

export interface RevokeTokenResponse extends MultiloginStatusResponse {}

export interface ChangePasswordResponse extends MultiloginStatusResponse {}

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

export interface WorkspacesResponse extends MultiloginDataResponse<{
  total_count: number
  workspaces: Workspace[]
}> {}

export interface UserWorkspacesResponse extends MultiloginDataResponse<{
  workspaces: Workspace[]
}> {}

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

export interface TokenListResponse extends MultiloginDataResponse<{
  tokens: Array<{
    token: string
  }>
}> {}

export interface AutomationTokenResponse extends MultiloginDataResponse<{
  token: string
}> {}

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

export interface CreateProfileResponse extends MultiloginDataResponse<{
  ids: string[]
}> {}

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

export interface ProfileSearchResponse extends MultiloginDataResponse<{
  profiles: ProfileListItem[]
  total_count: number
}> {}

export interface ProfileRemoveRequest {
  ids: string[]
  permanently: boolean
}

export interface CreateFolderRequest {
  name: string
  comment?: string
}

export interface CreateFolderResponse extends MultiloginDataResponse<{
  id: string
}> {}

export interface UpdateFolderRequest {
  folder_id: string
  name: string
  comment?: string
}

export interface RemoveFoldersRequest {
  ids: string[]
}

export interface FoldersResponse extends MultiloginDataResponse<{
  folders: FolderListItem[]
}> {}

export interface UnlockProfilesRequest {
  ids?: string[]
}

export interface UnlockProfilesResponse extends MultiloginStatusResponse {}

export interface ProfileMetasRequest {
  ids: string[]
}

export interface ProfileMetaItem {
  id: string
  is_auto_update: boolean
  name: string
  notes: string
  parameters: {
    fingerprint: Record<string, unknown>
    flags: MaskingFlags
    storage: StorageParameters
  }
  browser_type: BrowserType
  core_version: number
  os_type: OsType
  created_at: string
  created_by: string
  in_use_by: string
  last_launched_at: string
  last_launched_by: string
  last_launched_on: string
  last_update_at: string
  last_updated_by: string
  removed_at: string
  removed_by: string
  status: string
  folder_id: string
  workspace_id: string
}

export interface ProfileMetasResponse extends MultiloginDataResponse<{
  profiles: ProfileMetaItem[]
}> {}

export interface ProfileSummaryRequest {
  meta_id: string
}

export interface ProfileSummaryData {
  fonts: string[]
  geolocation: GeolocationFingerprint
  graphic: {
    device_id: string
    renderer: string
    vendor: string
    vendor_id: string
  }
  localization: LocalizationFingerprint
  masking_options: Record<string, unknown>
  media_devices: MediaDevicesFingerprint
  navigator: NavigatorFingerprint
  ports: number[]
  screen: ScreenFingerprint
  timezone: TimezoneFingerprint
  webrtc: WebRTCFingerprint
}

export interface ProfileSummaryResponse extends MultiloginDataResponse<ProfileSummaryData> {}

export interface MultiloginClientConfig {
  profileBaseUrl?: string
  launcherBaseUrl?: string
  timeout?: number
  email: string
  password: string
  token?: string
  onTokenRefresh?: (token: string) => void | Promise<void>
}
