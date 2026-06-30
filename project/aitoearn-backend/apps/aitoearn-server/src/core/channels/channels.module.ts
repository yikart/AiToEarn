import { Module } from '@nestjs/common'
import { AccountGroupService } from './accounts/account-group.service'
import { NurtureModule } from './nurture/nurture.module'
import { AccountGroupsController } from './accounts/account-groups.controller'
import { AccountService } from './accounts/account.service'
import { AccountsController } from './accounts/accounts.controller'
import { CredentialHealthScheduler } from './accounts/credential-health.scheduler'
import { CredentialService } from './accounts/credential.service'
import { AnalyticsService } from './analytics/analytics.service'
import { AuthController } from './auth/auth.controller'
import { AuthService } from './auth/auth.service'
import { LinkedInAuthCallbackController } from './auth/linkedin-auth-callback.controller'
import { EngagementController } from './engagement/engagement.controller'
import { EngagementService } from './engagement/engagement.service'
import { MediaModule } from './media/media.module'
import { PlatformsController } from './platforms/platforms.controller'
import { PlatformsModule } from './platforms/platforms.module'
import { PlatformsService } from './platforms/platforms.service'
import { TikTokLegacyController } from './platforms/tiktok/tiktok-legacy.controller'
import { MediaFinalizeConsumer } from './publish/consumers/media-finalize.consumer'
import { PublishConsumer } from './publish/consumers/publish.consumer'
import { UpdatePublishedConsumer } from './publish/consumers/update-published.consumer'
import { PublishFlowController } from './publish/flows/publish-flow.controller'
import { PublishFlowService } from './publish/flows/publish-flow.service'
import { PublishRecordReadService } from './publish/records/publish-record-read.service'
import { PublishRecordController } from './publish/records/publish-record.controller'
import { PublishScheduler } from './publish/scheduler/publish.scheduler'
import { PublishQueueService } from './publish/tasks/publish-queue.service'
import { PublishStateService } from './publish/tasks/publish-state.service'
import { PublishTaskController } from './publish/tasks/publish-task.controller'
import { PublishTaskService } from './publish/tasks/publish-task.service'
import { RelayCallbackController } from './relay/relay-callback.controller'
import { RelayClientService } from './relay/relay-client.service'
import { WorkService } from './works/work.service'
import { WorksController } from './works/works.controller'

@Module({
  imports: [PlatformsModule, MediaModule, NurtureModule.register()],
  controllers: [
    AccountsController,
    AccountGroupsController,
    AuthController,
    LinkedInAuthCallbackController,
    PublishFlowController,
    PublishTaskController,
    PublishRecordController,
    PlatformsController,
    TikTokLegacyController,
    EngagementController,
    WorksController,
    RelayCallbackController,
  ],
  providers: [
    // Accounts
    RelayClientService,
    AccountService,
    AccountGroupService,
    CredentialService,
    AuthService,
    CredentialHealthScheduler,
    // Publish orchestration
    PublishFlowService,
    PublishTaskService,
    PublishStateService,
    PublishQueueService,
    PublishRecordReadService,
    PlatformsService,
    PublishConsumer,
    MediaFinalizeConsumer,
    UpdatePublishedConsumer,
    PublishScheduler,
    // Analytics
    AnalyticsService,
    // Engagement
    EngagementService,
    // Works
    WorkService,
  ],
  exports: [
    CredentialService,
    RelayClientService,
    AccountService,
    AccountGroupService,
    AuthService,
    PublishFlowService,
    PublishTaskService,
    PublishStateService,
    PublishQueueService,
    PublishRecordReadService,
    PlatformsService,
    MediaModule,
    AnalyticsService,
    EngagementService,
    WorkService,
    PlatformsModule,
  ],
})
export class ChannelsModule {}
