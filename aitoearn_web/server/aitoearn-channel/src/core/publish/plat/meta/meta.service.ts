import { Injectable, Logger } from '@nestjs/common';
import { PublishStatus, PublishTask } from '@/libs/database/schema/publishTask.schema';
import { AccountType } from '@/transports/account/common';
import { DoPubRes } from '../../common';
import { FacebookPublishService } from './facebook.service';
import { InstagramPublishService } from './instgram.service';
import { MetaPostPublisher } from './meta.interface';
import { ThreadsPublishService } from './threads.service';
import { TwitterPublishService } from './twitter.service';

@Injectable()
export class MetaPublishService {
  private readonly publishSrvMap = new Map<AccountType, MetaPostPublisher>()
  private readonly logger = new Logger(MetaPublishService.name);
  constructor(
    private readonly instagramPublishService: InstagramPublishService,
    private readonly threadPublishService: ThreadsPublishService,
    private readonly twitterPublishService: TwitterPublishService,
    private readonly facebookPublishService: FacebookPublishService,
  ) {
    this.publishSrvMap.set(AccountType.INSTAGRAM, this.instagramPublishService);
    this.publishSrvMap.set(AccountType.THREADS, this.threadPublishService);
    this.publishSrvMap.set(AccountType.TWITTER, this.twitterPublishService);
    this.publishSrvMap.set(AccountType.FACEBOOK, this.facebookPublishService);
  }

  async publishPost(publishTask: PublishTask): Promise<DoPubRes> {
    this.logger.log(`accountType: ${publishTask.accountType}, taskId: ${publishTask.id}`);
    this.logger.log(this.publishSrvMap.keys());
    const service = this.publishSrvMap.get(publishTask.accountType)
    if (!service) {
      return {
        status: PublishStatus.FAILED,
        message: '未找到该平台的发布服务',
        noRetry: true,
      }
    }
    const res = await service.publish(publishTask)
    return res
  }
}
