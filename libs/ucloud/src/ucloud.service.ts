import { Injectable } from '@nestjs/common'
import { Client } from '@ucloud-sdks/ucloud-sdk-js'
import UAccountClient from '@ucloud-sdks/ucloud-sdk-js/lib/services/uaccount'
import { CompShareClient, ULHostClient } from './clients'

@Injectable()
export class UCloudService {
  private readonly uAccountClient: UAccountClient
  private readonly compShareClient: CompShareClient
  private readonly ulHostClient: ULHostClient

  constructor(readonly client: Client) {
    this.uAccountClient = client.uaccount()
    this.compShareClient = new CompShareClient(client.config)
    this.ulHostClient = new ULHostClient(client.config)
  }

  /**
   * 获取UAccount客户端
   */
  get uAccount(): UAccountClient {
    return this.uAccountClient
  }

  /**
   * 获取算力共享平台客户端，用于管理轻量级算力平台
   */
  get compShare(): CompShareClient {
    return this.compShareClient
  }

  /**
   * 获取轻量应用云主机客户端，用于管理轻量应用云主机
   */
  get ulHost(): ULHostClient {
    return this.ulHostClient
  }
}
