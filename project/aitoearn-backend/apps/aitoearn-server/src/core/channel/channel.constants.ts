export class ChannelRedisKeys {
  static authTask(platform: string, id: string) {
    return `${platform}:auth_task:${id}`
  }

  static accessToken(platform: string, id: string) {
    return `${platform}:access_token:${id}`
  }

  static pageAccessToken(platform: string, pageId: string) {
    return `${platform}:page:access_token:${pageId}`
  }

  static userPageList(platform: string, accountId: string) {
    return `${platform}:user_page_list:${accountId}`
  }
}
