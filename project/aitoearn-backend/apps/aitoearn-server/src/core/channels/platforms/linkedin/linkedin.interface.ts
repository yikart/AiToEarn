export enum LinkedInOAuthGrantType {
  AuthorizationCode = 'authorization_code',
  RefreshToken = 'refresh_token',
}

export interface LinkedInTokenResponse {
  access_token: string
  expires_in?: number
  refresh_token?: string
  scope?: string
}

export interface LinkedInPersonProfile {
  sub: string
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
  email?: string
}

export interface LinkedInUploadInitResponse {
  value: {
    uploadUrl?: string
    uploadUrlExpiresAt?: number
    image?: string
    mediaArtifact?: string
    video?: string
    uploadToken?: string
    uploadInstructions?: Array<{ uploadUrl: string, firstByte: number, lastByte: number }>
  }
}

export interface LinkedInShareResponse {
  activity?: string
  id?: string
}

export interface LinkedInCreatedPostResponse extends LinkedInShareResponse {
  id: string
}

export enum LinkedInPostLifecycleState {
  Published = 'PUBLISHED',
}

export interface LinkedInComment {
  id?: string
  entity?: string
  actor?: string
  message?: { text?: string }
  created?: { actor?: string, time?: number }
  lastModified?: { actor?: string, time?: number }
}

export interface LinkedInCommentListResponse {
  elements?: LinkedInComment[]
  paging?: {
    start?: number
    count?: number
    total?: number
  }
}

export interface LinkedInCommentCreateResponse {
  id?: string
  entity?: string
}

export interface LinkedInWebhookPayload {
  webhookId?: string
  owner?: string
  events?: LinkedInWebhookNotification[]
}

export interface LinkedInWebhookNotification {
  eventType?: string
  entity?: string
  entityUrn?: string
  lastModifiedAt?: number
}
