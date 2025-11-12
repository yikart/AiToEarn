import { Injectable } from '@nestjs/common'
import { ChannelBaseApi } from '../../channelBase.api'

@Injectable()
export class PlatMetaNatsApi extends ChannelBaseApi {
  async getAuthUrl(userId: string, platform: string, spaceId: string) {
    const res = await this.sendMessage<any>(
      `plat/meta/authUrl`,
      {
        userId,
        platform,
        spaceId,
      },
    )
    return res
  }

  async getAuthInfo(taskId: string) {
    const res = await this.sendMessage<any>(
      `plat/meta/getAuthInfo`,
      {
        taskId,
      },
    )
    return res
  }

  async getFacebookPages(userId: string) {
    const res = await this.sendMessage<any>(
      `plat/meta/facebook/pages`,
      {
        userId,
      },
    )
    return res
  }

  async selectFacebookPages(
    userId: string,
    pageIds: string[],
  ) {
    const res = await this.sendMessage<any>(
      `plat/meta/facebook/pages/selection`,
      {
        userId,
        pageIds,
      },
    )
    return res
  }

  async createAccountAndSetAccessToken(
    code: string,
    state: string,
  ) {
    const res = await this.sendMessage<any>(
      `plat/meta/createAccountAndSetAccessToken`,
      {
        code,
        state,
      },
    )
    return res
  }

  async getFacebookPagePublishedPosts(
    userId: string,
    query: any,
  ) {
    const res = await this.sendMessage<any>(
      `plat/meta/getFacebookPagePublishedPosts`,
      {
        userId,
        query,
      },
    )
    return res
  }

  async getFacebookPageInsights(
    userId: string,
    query: any,
  ) {
    const res = await this.sendMessage<any>(
      `plat/meta/getFacebookPageInsights`,
      {
        userId,
        query,
      },
    )
    return res
  }

  async getFacebookPostInsights(
    userId: string,
    postId: string,
    query: any,
  ) {
    const res = await this.sendMessage<any>(
      `plat/meta/getFacebookPostInsights`,
      {
        userId,
        postId,
        query,
      },
    )
    return res
  }

  async getInstagramAccountInfo(
    userId: string,
    query: any,
  ) {
    const res = await this.sendMessage<any>(
      `plat/meta/getInstagramAccountInfo`,
      {
        userId,
        query,
      },
    )
    return res
  }

  async getInstagramAccountInsights(
    userId: string,
    query: any,
  ) {
    const res = await this.sendMessage<any>(
      `plat/meta/getInstagramAccountInsights`,
      {
        userId,
        query,
      },
    )
    return res
  }

  async getInstagramPostInsights(
    userId: string,
    postId: string,
    query: any,
  ) {
    const res = await this.sendMessage<any>(
      `plat/meta/getInstagramPostInsights`,
      {
        userId,
        postId,
        query,
      },
    )
    return res
  }

  async getThreadsAccountInsights(
    userId: string,
    query: any,
  ) {
    const res = await this.sendMessage<any>(
      `plat/meta/getThreadsAccountInsights`,
      {
        userId,
        query,
      },
    )
    return res
  }

  async getThreadsPostInsights(
    userId: string,
    postId: string,
    query: any,
  ) {
    const res = await this.sendMessage<any>(
      `plat/meta/getThreadsPostInsights`,
      {
        userId,
        postId,
        query,
      },
    )
    return res
  }

  async searchFacebookLocations(
    userId: string,
    keyword: string,
  ) {
    const res = await this.sendMessage<any>(
      `plat/meta/facebool/search/locations`,
      {
        userId,
        keyword,
      },
    )
    return res
  }

  async searchThreadsLocations(
    accountId: string,
    keyword: string,
  ) {
    const res = await this.sendMessage<{ id: string, label: string }[]>(
      `plat/meta/threads/search/locations`,
      {
        accountId,
        keyword,
      },
    )
    return res
  }
}
