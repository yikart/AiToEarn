/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2025-04-14 17:11:23
 * @LastEditors: nevin
 * @Description: adminGzh AdminGzh
 */
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ParamsValidationPipe } from 'src/validation.pipe';
import { Manager } from 'src/auth/manager.guard';
import { CreateGzhMenuDto } from './dto/gzh.dto';
import { PlatAuthWxGzhService } from 'src/lib/platAuth/wxGzh.service';

@Manager()
@Controller('admin/gzh')
export class AdminGzhController {
  constructor(private readonly platAuthWxGzhService: PlatAuthWxGzhService) {}

  @ApiOperation({
    description: 'body是JSON对象',
    summary: '创建菜单',
  })
  @Post('menu')
  async createMenu(@Body(new ParamsValidationPipe()) body: CreateGzhMenuDto) {
    const menuData = JSON.parse(body.menuStr);
    const res = await this.platAuthWxGzhService.createWxGzhMenu(menuData);
    return res;
  }

  @ApiOperation({
    description: '获取菜单',
    summary: '获取菜单',
  })
  @Get('menu')
  async getMenu() {
    const res = await this.platAuthWxGzhService.getMenu();
    return res;
  }
}
