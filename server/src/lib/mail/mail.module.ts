/*
 * @Author: nevin
 * @Date: 2022-01-20 09:20:31
 * @LastEditors: nevin
 * @LastEditTime: 2024-07-05 15:48:57
 * @Description: 邮件模块
 */
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import mailConfig from 'config/mail.config';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [mailConfig], // 加载自定义配置项
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule], // 数据库配置项依赖于ConfigModule，需在此引入
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('MAIL_CONFIG'),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
