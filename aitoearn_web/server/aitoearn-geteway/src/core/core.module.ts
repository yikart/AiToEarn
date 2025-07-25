import { HttpExceptionFilter } from '@common/filters/httpException.filter'
import { TransformInterceptor } from '@common/interceptor/transform.interceptor'
import { TmsModule } from '@libs/tms/tms.module'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { config } from '@/config'
import { AccountModule } from './account/account.module'
import { AiModule } from './ai/ai.module'
import { ContentModule } from './content/content.module'
import { FileModule } from './file/file.module'
import { NotificationModule } from './notification/notification.module'
import { OtherModule } from './other/other.module'
import { PaymentModule } from './payment/payment.module'
import { PlatModule } from './plat/plat.module'
import { TaskModule } from './task/task.module'
import { ToolsModule } from './tools/tools.module'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    // TestModule,
    TmsModule.forRoot(config.tms),
    OtherModule,
    FileModule,
    UserModule,
    PlatModule,
    AccountModule,
    ToolsModule,
    ContentModule,
    PaymentModule,
    TaskModule,
    NotificationModule,
    AiModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class CoreModule {}
