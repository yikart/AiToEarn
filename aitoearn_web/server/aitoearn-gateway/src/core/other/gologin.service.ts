import { Injectable } from '@nestjs/common'
import { GologinNatsApi } from '@/transports/other/gologin.natsApi'

@Injectable()
export class GologinService {
  constructor(private readonly gologinNatsApi: GologinNatsApi) {}

  async doTest() {
    const res = await this.gologinNatsApi.doTest()
    return res
  }
}
