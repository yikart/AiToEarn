import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { TwitterController } from './twitter.controller';
import { TwitterService } from './twitter.service';
import { TwitterAuthService } from './twitter.auth.service';

import { Account, AccountSchema } from 'src/db/schema/account.schema';
import { AccountToken, AccountTokenSchema } from 'src/db/schema/accountToken.schema';
import { PubRecord, PubRecordSchema } from 'src/db/schema/pubRecord.schema';
import { User, UserSchema } from 'src/db/schema/user.schema';

import { AccountModule } from 'src/modules/account/account.module';
import { AuthModule } from 'src/auth/auth.module';
import { RedisModule } from 'src/lib/redis/redis.module';
import { UserModule } from 'src/user/user.module';
import googleConfig from 'config/google.config';

// You'll need to create a twitter.config.ts similar to your google.config.ts
// import twitterConfig from 'config/twitter.config';

@Module({
  imports: [
    HttpModule, // For making HTTP requests
    ConfigModule.forRoot({
      load: [googleConfig],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Account.name, schema: AccountSchema },
      { name: AccountToken.name, schema: AccountTokenSchema },
      { name: PubRecord.name, schema: PubRecordSchema },
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => AccountModule),
    forwardRef(() => UserModule),
    RedisModule,
  ],
  controllers: [TwitterController],
  providers: [TwitterService, TwitterAuthService, ConfigService],
  exports: [TwitterService, TwitterAuthService],
})
export class TwitterModule {}