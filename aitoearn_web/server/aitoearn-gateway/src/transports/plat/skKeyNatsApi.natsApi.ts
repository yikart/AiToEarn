import { Injectable } from '@nestjs/common'
import { TableDto } from '@/common/dto/table.dto'
import { SkKey } from '@/core/plat/skKey/common'
import { NatsApi } from '../api'
import { BaseNatsApi } from '../base.natsApi'

@Injectable()
export class ChannelSkKeyNatsApi extends BaseNatsApi {
  async create(userId: string, desc?: string) {
    const res = await this.sendMessage<{
      key: string
    }>(NatsApi.channel.skKey.create, {
      userId,
      desc,
    })

    return res
  }

  async del(key: string) {
    const res = await this.sendMessage<boolean>(
      NatsApi.channel.skKey.del,
      {
        key,
      },
    )

    return res
  }

  async upInfo(key: string, desc: string) {
    const res = await this.sendMessage<boolean>(
      NatsApi.channel.skKey.upInfo,
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
    }>(NatsApi.channel.skKey.getInfo, {
      key,
    })

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
    }>(NatsApi.channel.skKey.list, {
      ...page,
      ...query,
    })

    return res
  }

  async addRefAccount(key: string, accountId: string) {
    const res = await this.sendMessage<{
      key: string
      accountId: string
    }>(NatsApi.channel.skKey.addRefAccount, {
      key,
      accountId,
    })

    return res
  }

  async delRefAccount(key: string, accountId: string) {
    const res = await this.sendMessage<boolean>(
      NatsApi.channel.skKey.delRefAccount,
      {
        key,
        accountId,
      },
    )

    return res
  }

  async getRefAccountList(key: string, page: TableDto) {
    const res = await this.sendMessage<boolean>(
      NatsApi.channel.skKey.getRefAccountList,
      {
        key,
        ...page,
      },
    )

    return res
  }
}
