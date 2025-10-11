/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-04-27 17:36:19
 * @LastEditors: nevin
 * @Description: google google B站模块
 */
import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { User, UserSchema  } from 'src/db/schema/user.schema';
import { GoogleController } from './google.controller';
import { GoogleService } from './google.service';
import { UserModule } from 'src/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from 'src/lib/redis/redis.module';
import googleConfig from 'config/google.config';
// import { UserService } from 'src/user/user.service';

@Module({
  imports: [
  ConfigModule.forRoot({
      load: [googleConfig],
    }),
    // MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UserModule,
    RedisModule,
  ],
  controllers: [GoogleController],
  providers: [GoogleService],
  exports: [GoogleService],
})
export class GoogleModule {}
