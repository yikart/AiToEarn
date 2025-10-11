/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-04-14 12:28:22
 * @LastEditors: nevin
 * @Description: 认证
 */
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { ManagerGuard } from './manager.guard';

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.AUTH_SECRET || '550e8400-e29b-41d4-a716-446655440000',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ManagerGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
