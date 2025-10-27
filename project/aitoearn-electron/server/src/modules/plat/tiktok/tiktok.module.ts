/*
 * @Author: 
 * @Date: 2025-06-06
 * @LastEditTime: 2025-06-06
 * @Description: TikTok模块
 */
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { TikTokController } from './tiktok.controller';
import { TikTokService } from './tiktok.service';
import { TikTokAuthService } from './tiktok.auth.service';
import { PubRecord, PubRecordSchema } from 'src/db/schema/pubRecord.schema';
import tiktokConfig from 'config/tiktok.config';
import { User, UserSchema } from 'src/db/schema/user.schema';
import { Account, AccountSchema } from 'src/db/schema/account.schema';
import { AccountToken, AccountTokenSchema } from 'src/db/schema/accountToken.schema';
import { UserModule } from 'src/user/user.module';
import { RedisModule } from 'src/lib/redis/redis.module';
import { AuthModule } from 'src/auth/auth.module';
import { AccountModule } from 'src/modules/account/account.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [tiktokConfig],
    }),
    HttpModule,
    MongooseModule.forFeature([
        { name: User.name, schema: UserSchema },
        { name: Account.name, schema: AccountSchema },
        { name: AccountToken.name, schema: AccountTokenSchema },
        { name: PubRecord.name, schema: PubRecordSchema },
    ]),
    UserModule,
    RedisModule,
    forwardRef(() => AuthModule),
    forwardRef(() => AccountModule),
  ],
  controllers: [TikTokController],
  providers: [TikTokService, TikTokAuthService],
  exports: [TikTokService, TikTokAuthService]
})
export class TiktokModule { }
