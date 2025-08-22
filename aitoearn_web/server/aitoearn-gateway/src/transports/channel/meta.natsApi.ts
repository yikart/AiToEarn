import { Injectable } from '@nestjs/common'
import { NatsApi } from '../api'
import { BaseNatsApi } from '../base.natsApi'

@Injectable()
export class PlatMetaNatsApi extends BaseNatsApi {
  async getAuthUrl(userId: string, platform: string) {
    console.log('getAuthUrl', userId, platform)
    const res = await this.sendMessage<any>(
      NatsApi.plat.meta.authUrl,
      {
        userId,
        platform,
      },
    )
    return res
  }

  async getAuthInfo(taskId: string) {
    const res = await this.sendMessage<any>(
      NatsApi.plat.meta.getAuthInfo,
      {
        taskId,
      },
    )

    return res
  }

  async getFacebookPages(userId: string) {
    const res = await this.sendMessage<any>(
      NatsApi.plat.meta.getFacebookPages,
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
      NatsApi.plat.meta.selectFacebookPages,
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
      NatsApi.plat.meta.createAccountAndSetAccessToken,
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
      NatsApi.plat.meta.getFacebookPagePublishedPosts,
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
      NatsApi.plat.meta.getFacebookPageInsights,
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
      NatsApi.plat.meta.getFacebookPostInsights,
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
      NatsApi.plat.meta.getInstagramAccountInfo,
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
      NatsApi.plat.meta.getInstagramAccountInsights,
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
      NatsApi.plat.meta.getInstagramPostInsights,
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
      NatsApi.plat.meta.getThreadsAccountInsights,
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
      NatsApi.plat.meta.getThreadsPostInsights,
      {
        userId,
        postId,
        query,
      },
    )
    return res
  }
}
