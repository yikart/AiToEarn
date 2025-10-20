import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { config } from '../../config'

@Injectable()
export class PlatMetaNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  async getAuthUrl(userId: string, platform: string, spaceId: string) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/meta/authUrl`,
      {
        userId,
        platform,
        spaceId,
      },
    )
    return res.data
  }

  async getAuthInfo(taskId: string) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/meta/getAuthInfo`,
      {
        taskId,
      },
    )
    return res.data
  }

  async getFacebookPages(userId: string) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/meta/getFacebookPages`,
      {
        userId,
      },
    )
    return res.data
  }

  async selectFacebookPages(
    userId: string,
    pageIds: string[],
  ) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/meta/selectFacebookPages`,
      {
        userId,
        pageIds,
      },
    )
    return res.data
  }

  async createAccountAndSetAccessToken(
    code: string,
    state: string,
  ) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/meta/createAccountAndSetAccessToken`,
      {
        code,
        state,
      },
    )
    return res.data
  }

  async getFacebookPagePublishedPosts(
    userId: string,
    query: any,
  ) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/meta/getFacebookPagePublishedPosts`,
      {
        userId,
        query,
      },
    )
    return res.data
  }

  async getFacebookPageInsights(
    userId: string,
    query: any,
  ) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/meta/getFacebookPageInsights`,
      {
        userId,
        query,
      },
    )
    return res.data
  }

  async getFacebookPostInsights(
    userId: string,
    postId: string,
    query: any,
  ) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/meta/getFacebookPostInsights`,
      {
        userId,
        postId,
        query,
      },
    )
    return res.data
  }

  async getInstagramAccountInfo(
    userId: string,
    query: any,
  ) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/meta/getInstagramAccountInfo`,
      {
        userId,
        query,
      },
    )
    return res.data
  }

  async getInstagramAccountInsights(
    userId: string,
    query: any,
  ) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/meta/getInstagramAccountInsights`,
      {
        userId,
        query,
      },
    )
    return res.data
  }

  async getInstagramPostInsights(
    userId: string,
    postId: string,
    query: any,
  ) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/meta/getInstagramPostInsights`,
      {
        userId,
        postId,
        query,
      },
    )
    return res.data
  }

  async getThreadsAccountInsights(
    userId: string,
    query: any,
  ) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/meta/getThreadsAccountInsights`,
      {
        userId,
        query,
      },
    )
    return res.data
  }

  async getThreadsPostInsights(
    userId: string,
    postId: string,
    query: any,
  ) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/meta/getThreadsPostInsights`,
      {
        userId,
        postId,
        query,
      },
    )
    return res.data
  }

  async searchFacebookLocations(
    userId: string,
    keyword: string,
  ) {
    const res = await this.httpService.axiosRef.post<any>(
      `${config.channel.baseUrl}/plat/meta/searchFacebookLocations`,
      {
        userId,
        keyword,
      },
    )
    return res.data
  }

  async searchThreadsLocations(
    accountId: string,
    keyword: string,
  ) {
    const res = await this.httpService.axiosRef.post<{ id: string, label: string }[]>(
      `${config.channel.baseUrl}/plat/meta/searchThreadsLocations`,
      {
        accountId,
        keyword,
      },
    )
    return res.data
  }
}
