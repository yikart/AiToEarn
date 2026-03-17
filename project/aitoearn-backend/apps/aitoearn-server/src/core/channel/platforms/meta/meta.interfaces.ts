export interface MetaOAuth2TaskInfo {
  pkce: boolean
  platform: string
  state: string
  codeVerifier?: string
  userId: string
  status: 0 | 1
  accountId?: string
  spaceId?: string
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

export interface OAuth2Credential {
  access_token: string
  expires_in: number
  refresh_token: string
  token_type: string
  refresh_token_expires_in: string
}

export interface MetaUserOAuthCredential extends OAuth2Credential {
  user_id: string
}
export interface FacebookPageInfo {
  id: string
  name: string
  access_token: string
  category: string
  expires_in: number
}

export interface FacebookPageCredentials extends FacebookPageInfo {
  facebook_user_id: string
  spaceId?: string
}

export interface FacebookPage {
  id: string
  name: string
  profile_picture_url?: string
}

export interface FacebookAccountResponse {
  data: FacebookPageInfo[]
}

export interface MetaObjectInfo {
  id: string
  status: string
}

export interface SelectFacebookPagesResponse {
  success: boolean
  message?: string
  selectedPageIds: string[]
}

export interface MetaPostComment {
  id: string
  text: string
  createdTime: string
  commenterUsername: string
  commenterAvatarUrl?: string
  hasSubComments: boolean
}

export interface MetaPostCommentsResponse {
  comments: MetaPostComment[]
  cursor: {
    before: string
    after: string
  }
}

export interface MetaPublishPlaintextCommentResponse {
  id: string
  success: boolean
  message: string
}

export interface MetaLocation {
  id: string
  label: string
}

export interface MetaLocationSearchResponse {
  locations: MetaLocation[]
}

export interface MetaFacebookPage {
  id: string
  name: string
  location?: string
}

export interface MetaFacebookPageResponse {
  pages: MetaFacebookPage[]
}
