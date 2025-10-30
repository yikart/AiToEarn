/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2025-03-03 18:45:45
 * @LastEditors: nevin
 * @Description:  banner Banner
 */
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ParamsValidationPipe } from 'src/validation.pipe';
import { BannerService } from './banner.service';
import { AppGetBannerListDto, BannerIdDto } from './dto/banner.dto';

@Controller('banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}
  @ApiOperation({
    description: '获取信息',
    summary: '获取信息',
  })
  @Get('info/:id')
  async getBannerInfoById(
    @Param(new ParamsValidationPipe()) param: BannerIdDto,
  ) {
    const res = await this.bannerService.getBannerInfo(param.id);
    return res;
  }

  @ApiOperation({
    description: '获取列表',
    summary: '获取列表',
  })
  @Get('list')
  getMineBannerList(
    @Query(new ParamsValidationPipe()) query: AppGetBannerListDto,
  ) {
    return this.bannerService.getBannerAll(query.tag);
  }
}
