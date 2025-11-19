import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export abstract class PlatformBaseService {
  protected readonly platform: string = 'platform'
  protected readonly logger = new Logger(PlatformBaseService.name)

  constructor() { }

  abstract getAccessTokenStatus(accountId: string): Promise<number>
  async deletePost(_accountId: string, _postId: string): Promise<boolean> {
    throw new Error(`${this.platform} delete post is not supported`)
  }
}
