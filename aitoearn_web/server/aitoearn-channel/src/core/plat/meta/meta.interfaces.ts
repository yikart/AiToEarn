export interface MetaOAuth2TaskInfo {
  pkce: boolean
  platform: string
  state: string
  codeVerifier?: string
  userId: string
  status: 0 | 1
  accountId?: string
}

export interface MetaOAuth2TaskStatus extends Partial<MetaOAuth2TaskInfo> {
  state: string
  status: 0 | 1
}

export interface MetaOAuthShortLivedCredential {
  access_token: string
}

export interface MetaOAuthLongLivedCredential
  extends MetaOAuthShortLivedCredential {
  token_type: string
  expires_in: number
}

export interface MetaUserOAuthCredential extends MetaOAuthLongLivedCredential {
  user_id: string
}
export interface FacebookPageInfo {
  id: string
  name: string
  access_token: string
  category: string
  expires_in: number
}

export interface FacebookPage {
  id: string
  name: string
}

export interface FacebookAccountResponse {
  data: FacebookPageInfo[]
}

export interface MetaObjectInfo {
  id: string
  status: string
}
