/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:15
 * @LastEditTime: 2024-09-05 15:19:25
 * @LastEditors: nevin
 * @Description:
 */
import { Injectable } from '@nestjs/common'
import { PlatBilibiliNatsApi } from 'src/transports/channel/bilibili.natsApi'

@Injectable()
export class TestService {
  constructor(private readonly platBilibiliNatsApi: PlatBilibiliNatsApi) {}

  async archiveAddByUtoken() {
    const res = await this.platBilibiliNatsApi.archiveAddByUtoken(
      '684f8407498a94748600ea72',
      'c19530b6d74548459a8d42e8e87f2872',
      {
        // accountId: '684f8407498a94748600ea72',
        // uploadToken: 'c19530b6d74548459a8d42e8e87f2872',
        title: '开心快乐每一天',
        cover:
          'https://archive.biliimg.com/bfs/archive/699b6250768ddacf367bd6f65cc498b7f86c5673.png',
        tid: 21,
        no_reprint: 0,
        noReprint: 0,
        desc: '开心快乐每一天',
        tag: '萌娃日记',
        copyright: 1,
      } as any,
    )
    return res
  }
}
