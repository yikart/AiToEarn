import { FacebookOAuth2Config } from '@/libs/facebook/constants'
import { InstagramOAuth2Config } from '@/libs/instagram/constants'
import { ThreadsOAuth2Config } from '@/libs/threads/constants'

export class MetaRedisKeys {
  private static readonly PREFIX = 'meta:'

  static getAuthTaskKey(state: string): string {
    return `${this.PREFIX}auth_task:${state}`
  }

  static getAccessTokenKey(platform: string, accountId: string): string {
    return `${platform}:access_token:${accountId}`
  }

  static getUserPageAccessTokenKey(platform: string, pageId: string): string {
    return `${platform}:page:access_token:${pageId}`
  }

  static getUserPageListKey(platform: string, accountId: string): string {
    return `${platform}:user_page_list:${accountId}`
  }
}

// thresholds for twitter oAuth
export const META_TIME_CONSTANTS = {
  AUTH_TASK_EXPIRE: 5 * 60, // for oauth task
  AUTH_TASK_EXTEND: 3 * 60, // extend oauth task
  TOKEN_REFRESH_MARGIN: 60 * 60, // margin for token refresh
  TOKEN_REFRESH_THRESHOLD: 15 * 60, // threshold for token refresh
} as const

interface MetaOAuth2Config {
  pkce: boolean
  shortLived: boolean
  apiBaseUrl: string
  authURL: string
  accessTokenURL: string
  pageAccountURL: string
  longLivedAccessTokenURL?: string
  refreshTokenURL?: string
  userProfileURL: string
  requestAccessTokenMethod: 'POST' | 'GET'
  defaultScopes: string[]
  longLivedGrantType?: string
  longLivedParamsMap?: Record<string, string>
  scopesSeparator: string
}
export interface MetaOAuth2ConfigMap {
  [platform: string]: MetaOAuth2Config
}

export const metaOAuth2ConfigMap: MetaOAuth2ConfigMap = {
  facebook: FacebookOAuth2Config as MetaOAuth2Config,
  threads: ThreadsOAuth2Config as MetaOAuth2Config,
  instagram: InstagramOAuth2Config as MetaOAuth2Config,
}
