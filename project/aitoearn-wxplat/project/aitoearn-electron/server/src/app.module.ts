/*
 * @Author: nevin
 * @Date: 2025-01-15 14:17:16
 * @LastEditTime: 2025-04-27 17:37:13
 * @LastEditors: nevin
 * @Description:
 */
import * as Joi from '@hapi/joi';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import bullMqConfig from '../config/bullMq.config';
import serverConfig from '../config/server.config';
import googleConfig from '../config/google.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DbMongoModule } from './db/db-mongo.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { LoggingInterceptor } from './interceptor/logging.interceptor';
import { TransformInterceptor } from './interceptor/transform.interceptor';
import { OssModule } from './lib/oss/oss.module';
import { RedisModule } from './lib/redis/redis.module';
import { AlicloudSmsModule } from './lib/sms/alicloud-sms.module';
import { WxModule } from './lib/wx/wx.module';
import { ManagerModule } from './manager/manager.module';
import { TaskModule } from './modules/task/task.module';
import { UserModule } from './user/user.module';
import { XMLMiddleware } from './middleware/xml.middleware';
import { FinanceModule } from './modules/finance/finance.module';
import { OtherModule } from './modules/other/other.module';
import { OperateModule } from './modules/operate/operate.module';
import { ToolsModule } from './modules/tools/tools.module';
import { AccountModule } from './modules/account/account.module';
import { PublishModule } from './modules/publish/publish.module';
import { TracingModule } from './modules/tracing/tracing.module';
import { RewardModule } from './modules/reward/reward.module';
import { TmsModule } from './lib/tms/tms.module';
import { PlatModule } from './modules/plat/plat.module';
import { BullModule } from '@nestjs/bullmq';
import { MailModule } from './lib/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env${process.env.NODE_ENV ? '.' + process.env.NODE_ENV : ''}`,
      isGlobal: true,
      ignoreEnvFile: false, // 取消忽略配置文件，为true则仅读取操作系统环境变量，常用于生产环境
      load: [serverConfig, bullMqConfig, googleConfig], // 加载server.config自定义全局配置项
      validationSchema: Joi.object({
        // 配置文件.env校验
        PORT: Joi.string().default('7000'),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
      }),
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    DbMongoModule,
    RedisModule,
    // 队列
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          connection: {
            host: configService.get<string>('BULLMQ_REDIS_CONFIG.HOST'),
            port: configService.get<number>('BULLMQ_REDIS_CONFIG.PORT'),
            password: configService.get<string>('BULLMQ_REDIS_CONFIG.PASSWORD'),
            db: configService.get<number>('BULLMQ_REDIS_CONFIG.DB'),
            removeOnComplete: true, // 完成后删除
            removeOnFail: { count: 1, age: 1000 * 60 * 60 * 3 }, // 失败后保留一条记录一小时
          },
        };
      },
    }),
    MailModule,
    OssModule,
    TmsModule,
    AlicloudSmsModule,
    AuthModule,
    UserModule,
    WxModule,
    ManagerModule,
    TaskModule,
    FinanceModule,
    OtherModule,
    OperateModule,
    ToolsModule,
    AccountModule,
    PublishModule,
    TracingModule,
    RewardModule,
    PlatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(XMLMiddleware).forRoutes({
      path: 'wxGzh/*',
      method: RequestMethod.POST,
    });
  }
}
