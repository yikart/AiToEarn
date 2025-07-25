import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PublishStatus } from '@/libs/database/schema/publishTask.schema';
import { PublishTaskService } from '../../publishTask.service';
import { PublishMetaPostTask } from './meta.interface';
import { MetaPublishService } from './meta.service';

@Processor('meta_media_task', {})
export class MetaPublishWorker extends WorkerHost {
  private readonly logger = new Logger(MetaPublishWorker.name);
  constructor(
    readonly publishTaskService: PublishTaskService,
    readonly metaPublishService: MetaPublishService,
  ) {
    super();
  }

  async process(job: Job<PublishMetaPostTask>): Promise<any> {
    this.logger.log(`Processing Meta Post Publish Task: ${job.data.id}`);
    const publishTaskInfo = await this.publishTaskService.getPublishTaskInfo(job.data.id);
    const publishTask = publishTaskInfo!.toObject()
    if (!publishTask) {
      this.logger.error(`Publish task not found: ${job.data.id}`);
      throw new Error(`Publish task not found: ${job.data.id}`);
    }
    publishTask.publishTime = new Date()
    this.logger.log(`Publish task details: ${JSON.stringify(publishTask)}`);
    const { status, message, noRetry }
      = await this.metaPublishService.publishPost(publishTask)

    this.logger.log(`Publish task status: ${status}, message: ${message}`);
    if (status === PublishStatus.FAIL) {
      if (!noRetry)
        throw new Error(message)
      await job.moveToFailed(new Error('任务失败，不再重试'), 'completed') // 直接标记为失败且不重试
      return
    }

    if (status === PublishStatus.RELEASED) {
      void job.isCompleted()
    }
    this.logger.debug(`Publish task details: ${JSON.stringify(publishTask)}`);
    return { status: 'success', message: 'Post published successfully' };
  }
}
