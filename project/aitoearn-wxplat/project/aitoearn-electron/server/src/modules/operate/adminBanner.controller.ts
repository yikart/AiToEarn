/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2025-03-03 18:45:45
 * @LastEditors: nevin
 * @Description:  banner Banner
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ParamsValidationPipe } from 'src/validation.pipe';
import { BannerService } from './banner.service';
import { AppHttpException } from 'src/filters/http-exception.filter';
import { ErrHttpBack } from 'src/filters/http-exception.back-code';
import { TableDto } from 'src/global/dto/table.dto';
import {
  ActionBannerDto,
  BannerIdDto,
  GetBannerListDto,
} from './dto/banner.dto';
import { ONOFF } from 'src/global/enum/all.enum';
import { Banner } from 'src/db/schema/banner.schema';
import { Manager } from 'src/auth/manager.guard';

@Manager()
@Controller('admin/banner')
export class AdminBannerController {
  constructor(private readonly bannerService: BannerService) {}

  @ApiOperation({
    description: '创建',
    summary: '创建',
  })
  @Post()
  async create(@Body(new ParamsValidationPipe()) body: ActionBannerDto) {
    const newData = new Banner();
    newData.dataId = body.dataId;
    newData.desc = body.desc;
    newData.url = body.url;
    newData.imgUrl = body.imgUrl;
    newData.tag = body.tag;
    newData.isPublish = ONOFF.ON;

    const res = await this.bannerService.create(newData);
    return res;
  }

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

  // 获取列表
  @Get('list/:pageNo/:pageSize')
  getMineBannerList(
    @Param(new ParamsValidationPipe()) param: TableDto,
    @Query(new ParamsValidationPipe()) query: GetBannerListDto,
  ) {
    return this.bannerService.getBannerList(param, query);
  }

  @ApiOperation({
    description: '更新',
    summary: '更新',
  })
  @Put('info/:id')
  async update(
    @Param(new ParamsValidationPipe()) param: BannerIdDto,
    @Body(new ParamsValidationPipe()) body: ActionBannerDto,
  ) {
    const oldData = await this.bannerService.getBannerInfo(param.id);
    if (!oldData) throw new AppHttpException(ErrHttpBack.fail);

    oldData.dataId = body.dataId;
    oldData.desc = body.desc;
    oldData.url = body.url;
    oldData.imgUrl = body.imgUrl;
    oldData.tag = body.tag;

    const res = await this.bannerService.updateBannerInfo(param.id, oldData);
    return res;
  }

  @ApiOperation({
    description: '更新发布状态',
    summary: '更新发布状态',
  })
  @Put('publish/:id')
  async updateBannerPublishStatus(
    @Param(new ParamsValidationPipe()) param: BannerIdDto,
    @Body(new ParamsValidationPipe()) body: any,
  ) {
    const bannerInfo = await this.bannerService.getBannerInfo(param.id);
    if (!bannerInfo) throw new AppHttpException(ErrHttpBack.fail);

    const res = await this.bannerService.updateBannerPublish(
      param.id,
      body.checkStatus,
    );
    return res;
  }

  @ApiOperation({
    description: '删除',
    summary: '删除',
  })
  @Delete(':id')
  async delete(@Param(new ParamsValidationPipe()) param: BannerIdDto) {
    const bannerInfo = await this.bannerService.getBannerInfo(param.id);
    if (!bannerInfo) throw new AppHttpException(ErrHttpBack.fail);

    const res = await this.bannerService.deleteBanner(param.id);
    return res;
  }
}
