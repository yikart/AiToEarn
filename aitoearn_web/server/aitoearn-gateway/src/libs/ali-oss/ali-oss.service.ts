import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import * as OSS from 'ali-oss'
import { ALI_OSS_CLIENT } from './ali-oss.constants'

@Injectable()
export class AliOSSService implements OnModuleInit {
  constructor(@Inject(ALI_OSS_CLIENT) private readonly ossClient: OSS) {}

  onModuleInit() {}

  get client(): OSS {
    return this.ossClient
  }

  // 这里可以添加常用的OSS方法封装，例如：
  putObject(
    key: string,
    file: Buffer | string,
    options?: OSS.PutObjectOptions,
  ) {
    return this.ossClient.put(key, file, options)
  }

  getObject(key: string, options?: OSS.GetObjectOptions) {
    return this.ossClient.get(key, options)
  }

  deleteObject(key: string) {
    return this.ossClient.delete(key)
  }

  listObjects(query: OSS.ListObjectsQuery) {
    return this.ossClient.list(query)
  }
}
