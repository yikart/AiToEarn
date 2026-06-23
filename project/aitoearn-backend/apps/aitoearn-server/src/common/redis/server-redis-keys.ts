export class ServerRedisKeys {
  static rateLimit(key: string): string {
    return `rate_limit:${key}`
  }

  static shortLink(code: string): string {
    return `server:shortLink:${code}`
  }

  static channelCredential(accountId: string): string {
    return `channels:credential:${accountId}`
  }

  static channelCredentialLock(accountId: string): string {
    return `channels:credential:lock:${accountId}`
  }

  static channelAuthSession(sessionId: string): string {
    return `channels:auth:session:${sessionId}`
  }

  static legacyChannelAuthTask(platform: string, id: string): string {
    return `${platform}:auth_task:${id}`
  }

  static legacyChannelAccessToken(platform: string, id: string): string {
    return `${platform}:access_token:${id}`
  }

  static legacyChannelCamelAccessToken(platform: string, id: string): string {
    return `${platform}:accessToken:${id}`
  }

  static legacyChannelPageAccessToken(platform: string, pageId: string): string {
    return `${platform}:page:access_token:${pageId}`
  }

  static legacyChannelUserPageList(platform: string, accountId: string): string {
    return `${platform}:user_page_list:${accountId}`
  }

  static douyinClientToken(): string {
    return 'douyin:client_token'
  }

  static douyinOpenTicket(): string {
    return 'douyin:open_ticket'
  }
}
