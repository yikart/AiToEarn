/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2025-03-03 18:45:45
 * @LastEditors: nevin
 * @Description: Cfg cfg
 */
import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ParamsValidationPipe } from 'src/validation.pipe';
import { CfgService } from './cfg.service';
import { CfgKeyDto } from './dto/cfg.dto';

@Controller('cfg')
export class CfgController {
  constructor(private readonly bannerService: CfgService) {}

  @ApiOperation({
    description: '获取信息',
    summary: '获取信息',
  })
  @Get('info/:key')
  async getInfoByKey(@Param(new ParamsValidationPipe()) param: CfgKeyDto) {
    const res = await this.bannerService.getInfoByKey(param.key);
    return res;
  }
}
