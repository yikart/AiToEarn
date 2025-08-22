import { Injectable } from '@nestjs/common'
import { MaterialNatsApi } from '@/transports/content/material.natsApi'

@Injectable()
export class TestService {
  constructor(private readonly materialNatsApi: MaterialNatsApi) { }

  async addDefaultContent() {
    const res = await this.materialNatsApi.test()
    return res
  }
}
