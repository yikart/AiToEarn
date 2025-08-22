import { Module } from '@nestjs/common'
import { AppConfigsModule } from './appConfigs/appConfigs.module'
import { FeedbackModule } from './feedback/feedback.module'
// import { GologinModule } from './gologin/gologin.module';

@Module({
  imports: [AppConfigsModule, FeedbackModule],
  providers: [],
})
export class CoreModule {}
