export interface MultiloginConfig {
  email: string
  password: string
  token?: string
}

export interface Cookie {
  name: string
  value: string
  domain?: string
  path?: string
  expires?: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

export interface LocalStorageItem {
  name: string
  value: string
}

export interface BrowserTaskConfig {
  multilogin: MultiloginConfig
  folderId: string
  profileId: string
  url: string
  cookies?: Cookie[]
  localStorage?: LocalStorageItem[]
}
