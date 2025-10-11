/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:07
 * @LastEditTime: 2024-12-07 22:21:47
 * @LastEditors: nevin
 * @Description: 用户模块
 */
import { Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { LoginService } from './login.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../db/schema/user.schema';
import { WxModule } from '../lib/wx/wx.module';
import { UserAdminController } from './user-admin.controller';
import { WxGzhController } from './wxGzh.controller';
import { PlatAuthModule } from 'src/lib/platAuth/platAuth.module';
import { UserWallet, UserWalletSchema } from 'src/db/schema/userWallet.shema';
import { UserPopController } from './userPop.controller';
import { RealAuth, RealAuthSchema } from 'src/db/schema/realAuth.schema';
import { RealAuthService } from './realAuth.service';
import { UserConfigController } from './userConfig.controller';
import { UserConfigService } from './userConfig.service';
import { UserLoginController } from './userLogin.controller';

@Global()
@Module({
  imports: [
    PlatAuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserWallet.name, schema: UserWalletSchema },
      { name: RealAuth.name, schema: RealAuthSchema },
    ]),
    WxModule,
  ],
  providers: [UserService, LoginService, RealAuthService, UserConfigService],
  controllers: [
    UserLoginController,
    UserController,
    UserAdminController,
    WxGzhController,
    UserPopController,
    UserConfigController,
  ],
  exports: [UserService, MongooseModule],
})
export class UserModule {}
