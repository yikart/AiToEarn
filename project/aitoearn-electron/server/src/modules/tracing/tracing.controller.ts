/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: Tracing tracing
 */
import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ParamsValidationPipe } from 'src/validation.pipe';
import { CreateTracingDto } from './dto/tracing.dto';
import { TracingService } from './tracing.service';
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces';
import { GetToken } from 'src/auth/auth.guard';

@ApiTags('跟踪模块')
@Controller('tracing')
export class TracingController {
  constructor(private readonly tracingService: TracingService) {}

  @ApiResponse({
    description: '创建跟踪数据',
    type: String,
  })
  @Post()
  async createTracing(
    @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: CreateTracingDto,
  ) {
    const res = await this.tracingService.create({ ...body, userId: token.id });
    return res;
  }
}
