/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-04-27 17:36:19
 * @LastEditors: nevin
 * @Description: Gzh 公众号模块
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SignIn, SignInSchema } from 'src/db/schema/signIn.schema';
import { GzhController } from './gzh.controller';
import { GzhService } from './gzh.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SignIn.name, schema: SignInSchema }]),
  ],
  controllers: [GzhController],
  providers: [GzhService],
  exports: [GzhService],
})
export class GzhModule {}
