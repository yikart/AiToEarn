/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-04-27 17:36:19
 * @LastEditors: nevin
 * @Description: bilibili Bilibili B站模块
 */
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { YoutubeController } from './youtube.controller';
import { YoutubeService } from './youtube.service';
import { GoogleService } from '../google/google.service';
import { UserModule } from 'src/user/user.module';
import { RedisModule } from 'src/lib/redis/redis.module';
import { AuthModule } from 'src/auth/auth.module';
import { YouTubeAuthService } from './youtube.auth.service';
import { User, UserSchema } from 'src/db/schema/user.schema';
import { Account, AccountSchema } from 'src/db/schema/account.schema';
import { AccountToken, AccountTokenSchema } from 'src/db/schema/accountToken.schema';
import { PubRecord, PubRecordSchema } from 'src/db/schema/pubRecord.schema';
import { GoogleModule } from '../google/google.module';
import googleConfig from 'config/google.config';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from 'src/modules/account/account.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [googleConfig],
    }),

    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Account.name, schema: AccountSchema },
      { name: AccountToken.name, schema: AccountTokenSchema },
      { name: PubRecord.name, schema: PubRecordSchema },
    ]),
    UserModule,
    RedisModule,
    AuthModule,
    forwardRef(() => GoogleModule),
    AccountModule,
  ],
  controllers: [YoutubeController],
  providers: [YoutubeService,
    YouTubeAuthService,
    GoogleService],
  exports: [YoutubeService, YouTubeAuthService],
})
export class YoutubeModule {}
