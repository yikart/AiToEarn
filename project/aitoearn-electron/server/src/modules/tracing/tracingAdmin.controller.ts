/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2025-05-06 14:10:25
 * @LastEditors: nevin
 * @Description: Tracing tracing
 */
import { Body, Controller, Get, Post } from '@nestjs/common';
import { TracingService } from './tracing.service';
import { Manager } from 'src/auth/manager.guard';
import { TracingTimeDto } from './dto/tracing.dto';

@Manager()
@Controller('admin/tracing')
export class TracingAdminController {
  constructor(private readonly tracingService: TracingService) {}

  // 账号总数
  @Get('count/account')
  async getTracingAccountCount() {
    const res = await this.tracingService.getTracingAccountCount();
    return res;
  }

  // 时间段内发视频的用户总数
  @Post('video/user/count')
  async getTracingVideoUserCount(@Body() body: TracingTimeDto) {
    const res = await this.tracingService.getTracingVideoUserCount(body.time);
    return res;
  }

  //  时间段内发视频的总数
  @Post('video/count')
  async getTracingVideoCount(@Body() body: TracingTimeDto) {
    const res = await this.tracingService.getTracingVideoCount(body.time);
    return res;
  }

  // 时间段内开源项目调用总数
  @Post('openProject/count')
  async getTracingOpenProjectCount(@Body() body: TracingTimeDto) {
    const res = await this.tracingService.getTracingOpenProjectCount(body.time);
    return res;
  }
}
