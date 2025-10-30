import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { SkKey } from '../../../channel/skKey/common'
import { ChannelBaseApi } from '../../channelBase.api'

@Injectable()
export class ChannelSkKeyNatsApi extends ChannelBaseApi {
  async create(userId: string, desc?: string) {
    const res = await this.sendMessage<{
      key: string
    }>(
      `channel/skKey/create`,
      {
        userId,
        desc,
      },
    )
    return res
  }

  async del(key: string) {
    const res = await this.sendMessage<boolean>(
      `channel/skKey/del`,
      {
        key,
      },
    )
    return res
  }

  async upInfo(key: string, desc: string) {
    const res = await this.sendMessage<boolean>(
      `channel/skKey/upInfo`,
      {
        key,
        desc,
      },
    )
    return res
  }

  async getInfo(key: string) {
    const res = await this.sendMessage<{
      key: string
      desc: string
    }>(
      `channel/skKey/getInfo`,
      {
        key,
      },
    )
    return res
  }

  async list(
    page: TableDto,
    query: {
      userId: string
    },
  ) {
    const res = await this.sendMessage<{
      list: SkKey
      total: number
    }>(
      `channel/skKey/list`,
      {
        ...page,
        ...query,
      },
    )
    return res
  }

  async addRefAccount(key: string, accountId: string) {
    const res = await this.sendMessage<{
      key: string
      accountId: string
    }>(
      `channel/skKey/addRefAccount`,
      {
        key,
        accountId,
      },
    )
    return res
  }

  async delRefAccount(key: string, accountId: string) {
    const res = await this.sendMessage<boolean>(
      `channel/skKey/delRefAccount`,
      {
        key,
        accountId,
      },
    )
    return res
  }

  async getRefAccountList(key: string, page: TableDto) {
    const res = await this.sendMessage<boolean>(
      `channel/skKey/getRefAccountList`,
      {
        key,
        ...page,
      },
    )
    return res
  }
}
