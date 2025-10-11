/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2025-03-03 18:45:45
 * @LastEditors: nevin
 * @Description: Cfg cfg
 */
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ParamsValidationPipe } from 'src/validation.pipe';
import { CfgService } from './cfg.service';
import { TableDto } from 'src/global/dto/table.dto';
import { CfgIdDto, CfgKeyDto, CreateCfgDto } from './dto/cfg.dto';
import { Manager } from 'src/auth/manager.guard';

@Manager()
@Controller('admin/cfg')
export class AdminCfgController {
  constructor(private readonly cfgService: CfgService) {}

  @ApiOperation({
    description: '创建',
    summary: '创建',
  })
  @Post()
  async create(@Body(new ParamsValidationPipe()) body: CreateCfgDto) {
    const res = await this.cfgService.create(body);
    return res;
  }

  @ApiOperation({
    description: '获取信息',
    summary: '获取信息',
  })
  @Get('info/:id')
  async getInfoById(@Param(new ParamsValidationPipe()) param: CfgIdDto) {
    const res = await this.cfgService.getInfoById(param.id);
    return res;
  }

  @ApiOperation({
    description: '获取列表',
    summary: '获取列表',
  })
  @Get('list/:pageNo/:pageSize')
  getList(@Param(new ParamsValidationPipe()) param: TableDto) {
    return this.cfgService.getCfgList(param);
  }

  @ApiOperation({
    description: '删除',
    summary: '删除',
  })
  @Delete(':key')
  async del(@Param(new ParamsValidationPipe()) param: CfgKeyDto) {
    const res = await this.cfgService.del(param.key);
    return res;
  }
}
