/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-04-27 17:36:19
 * @LastEditors: nevin
 * @Description: reward Reward 奖励模块
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SignInService } from './signIn.service';
import { SignInController } from './signIn.controller';
import { SignIn, SignInSchema } from 'src/db/schema/signIn.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SignIn.name, schema: SignInSchema }]),
  ],
  controllers: [SignInController],
  providers: [SignInService],
  exports: [SignInService],
})
export class RewardModule {}
