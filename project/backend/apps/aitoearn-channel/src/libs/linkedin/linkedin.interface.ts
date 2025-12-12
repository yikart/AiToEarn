export const LifecycleState = 'PUBLISHED'

export enum LinkedinShareCategory {
  TEXT = 'TEXT',
  ARTICLE = 'ARTICLE',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum ShareMediaCategory {
  NONE = 'NONE',
  IMAGE = 'IMAGE',
  ARTICLE = 'ARTICLE',
  VIDEO = 'VIDEO',
}

export enum MemberNetworkVisibility {
  PUBLIC = 'PUBLIC',
  CONNECTIONS = 'CONNECTIONS',
}

export enum UploadRecipe {
  IMAGE = 'urn:li:digitalmediaRecipe:feedshare-image',
  VIDEO = 'urn:li:digitalmediaRecipe:feedshare-video',
}

export interface ShareCommentary {
  text: string
}

export interface mediaDescription {
  text: string
}

export interface mediaTitle {
  text: string
}

export interface ShareMedia {
  status: string
  description: mediaDescription
  originalUrl?: string
  title: mediaTitle
  media: string
}

export interface ShareContent {
  shareCommentary: ShareCommentary
  shareMediaCategory: ShareMediaCategory
  media?: ShareMedia[]
}

export interface ShareVisibility {
  'com.linkedin.ugc.MemberNetworkVisibility': MemberNetworkVisibility
}

export interface LinkedInShareRequest {
  author: string
  lifecycleState: string
  specificContent: {
    'com.linkedin.ugc.ShareContent': ShareContent
  }
  visibility: ShareVisibility
}

export interface ServiceRelationship {
  relationshipType: string
  identifier: string
}

export interface LinkedInUploadRequestData {
  recipes: UploadRecipe[]
  owner: string
  serviceRelationships: ServiceRelationship[]
}

export interface LinkedInUploadRequest {
  registerUploadRequest: LinkedInUploadRequestData
}

export interface LinkedInUploadResponseData {
  uploadMechanism: {
    'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
      headers: { [key: string]: string }
      uploadUrl: string
    }
  }
  mediaArtifact: string
  asset: string
}

export interface LinkedInUploadResponse {
  value: LinkedInUploadResponseData
}
