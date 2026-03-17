// copy from tiktok constants, keep the same thresholds
export class TwitterRedisKeys {
  private static readonly PREFIX = 'twitter:'

  static getAuthTaskKey(state: string): string {
    return `${this.PREFIX}auth_task:${state}`
  }

  static getAccessTokenKey(accountId: string): string {
    return `${this.PREFIX}access_token:${accountId}`
  }
}

// thresholds for twitter oAuth
export const TWITTER_TIME_CONSTANTS = {
  AUTH_TASK_EXPIRE: 5 * 60, // for oauth task
  AUTH_TASK_EXTEND: 3 * 60, // extend oauth task
  TOKEN_REFRESH_MARGIN: 10 * 60, // margin for token refresh
  TOKEN_REFRESH_THRESHOLD: 15 * 60, // threshold for token refresh
} as const
