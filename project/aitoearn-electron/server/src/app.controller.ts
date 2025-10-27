/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-03-19 15:34:32
 * @LastEditors: nevin
 * @Description: 应用
 */
import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/auth.guard';
import { Request as ExRequest } from 'express';

@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // 获取应用的下载链接
  @Get('down')
  getDownUrl() {
    return this.appService.getDownUrl();
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // 获取用户的IP地址
  @Get('ip')
  async getIp(@Req() request: ExRequest) {
    return {
      xForwardedFor: request.headers['x-forwarded-for'] || '',
      ip: request.ip || '',
    };
  }
}
