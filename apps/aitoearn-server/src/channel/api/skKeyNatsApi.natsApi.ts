import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { config } from '../../config'
import { SkKey } from '../skKey/common'

@Injectable()
export class ChannelSkKeyNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  async create(userId: string, desc?: string) {
    const res = await this.httpService.axiosRef.post<{
      key: string
    }>(
      `${config.channel.baseUrl}/channel/skKey/create`,
      {
        userId,
        desc,
      },
    )
    return res.data
  }

  async del(key: string) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/channel/skKey/del`,
      {
        key,
      },
    )
    return res.data
  }

  async upInfo(key: string, desc: string) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/channel/skKey/upInfo`,
      {
        key,
        desc,
      },
    )
    return res.data
  }

  async getInfo(key: string) {
    const res = await this.httpService.axiosRef.post<{
      key: string
      desc: string
    }>(
      `${config.channel.baseUrl}/channel/skKey/getInfo`,
      {
        key,
      },
    )
    return res.data
  }

  async list(
    page: TableDto,
    query: {
      userId: string
    },
  ) {
    const res = await this.httpService.axiosRef.post<{
      list: SkKey
      total: number
    }>(
      `${config.channel.baseUrl}/channel/skKey/list`,
      {
        ...page,
        ...query,
      },
    )
    return res.data
  }

  async addRefAccount(key: string, accountId: string) {
    const res = await this.httpService.axiosRef.post<{
      key: string
      accountId: string
    }>(
      `${config.channel.baseUrl}/channel/skKey/addRefAccount`,
      {
        key,
        accountId,
      },
    )
    return res.data
  }

  async delRefAccount(key: string, accountId: string) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/channel/skKey/delRefAccount`,
      {
        key,
        accountId,
      },
    )
    return res.data
  }

  async getRefAccountList(key: string, page: TableDto) {
    const res = await this.httpService.axiosRef.post<boolean>(
      `${config.channel.baseUrl}/channel/skKey/getRefAccountList`,
      {
        key,
        ...page,
      },
    )
    return res.data
  }
}
