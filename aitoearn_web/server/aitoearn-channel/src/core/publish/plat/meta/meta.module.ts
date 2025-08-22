import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose';
import { MetaModule } from '@/core/plat/meta/meta.module';
import { TwitterModule } from '@/core/plat/twitter/twitter.module';
import { Account, AccountSchema } from '@/libs/database/schema/account.schema';
import { PostMediaContainer, PostMediaContainerSchema } from '@/libs/database/schema/postMediaContainer.schema';
import { PublishRecord, PublishRecordSchema } from '@/libs/database/schema/publishRecord.schema';
import { PublishTask, PublishTaskSchema } from '@/libs/database/schema/publishTask.schema';
import { PostMediaContainerService } from './container.service';
import { FacebookPublishService } from './facebook.service';
import { InstagramPublishService } from './instgram.service';
import { MetaPublishService } from './meta.service';
import { ThreadsPublishService } from './threads.service';
import { TwitterPublishService } from './twitter.service';

@Module({
  controllers: [],
  providers: [
    MetaPublishService,
    FacebookPublishService,
    InstagramPublishService,
    ThreadsPublishService,
    PostMediaContainerService,
    TwitterPublishService,
  ],
  exports: [
    MetaPublishService,
    FacebookPublishService,
    InstagramPublishService,
    ThreadsPublishService,
    PostMediaContainerService,
    TwitterPublishService,
  ],
  imports: [
    MetaModule,
    TwitterModule,
    BullModule.registerQueue({
      name: 'post_publish',
    }),
    BullModule.registerQueue({
      name: 'post_media_task',
      defaultJobOptions: {
        delay: 60000, // 60 seconds
        removeOnComplete: true,
      },
    }),
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: PublishRecord.name, schema: PublishRecordSchema },
      { name: PublishTask.name, schema: PublishTaskSchema },
      { name: PostMediaContainer.name, schema: PostMediaContainerSchema },
    ]),
  ],
})
export class MetaPublishModule { }
