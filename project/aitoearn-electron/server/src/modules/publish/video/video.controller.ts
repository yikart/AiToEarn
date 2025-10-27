/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: video
 */
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParamsValidationPipe } from 'src/validation.pipe';
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces';
import { GetToken } from 'src/auth/auth.guard';
import { VideoService } from './video.service';
import { AccountType } from 'src/db/schema/account.schema';
import { TableDto } from 'src/global/dto/table.dto';
import {
  CreateVideoPulDto,
  PubRecordIdDto,
  VideoPulIdDto,
  VideoPulListDto,
} from '../dto/video.dto';

@ApiTags('视频发布')
@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @ApiOperation({
    description: '获取发布记录',
    summary: '获取发布记录',
  })
  @Get('list/:pubRecordId')
  async getVideoRecord(
    @Param(new ParamsValidationPipe()) param: PubRecordIdDto,
  ) {
    return this.videoService.getVideoPulListByPubRecordId(param.pubRecordId);
  }

  @ApiOperation({
    description: '获取发布记录列表',
    summary: '获取发布记录列表',
  })
  @Get('list/:pageNo/:pageSize')
  async getVideoPulList(
    @GetToken() token: TokenInfo,
    @Param(new ParamsValidationPipe()) param: TableDto,
    @Query(new ParamsValidationPipe()) query: VideoPulListDto,
  ) {
    const res = await this.videoService.getVideoPulList(token.id, param, query);
    return res;
  }

  @ApiOperation({
    description: '获取视频发布信息',
    summary: '获取视频发布信息',
  })
  @Get('info/:id')
  async getVideoPulInfo(
    @Param(new ParamsValidationPipe()) param: VideoPulIdDto,
  ) {
    const res = await this.videoService.getVideoPulInfo(param.id);
    return res;
  }

  @ApiOperation({
    description: '创建视频发布记录',
    summary: '创建视频发布记录',
  })
  @Post('')
  async newVideoPul(
    @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: CreateVideoPulDto,
  ) {
    const res = await this.videoService.newVideoPul(token.id, body);
    return res;
  }

  @ApiOperation({
    description: '获取视频发布记录类型统计',
    summary: '获取视频发布记录类型统计',
  })
  @Get('count')
  async getVideoPulTypeCount(
    @GetToken() token: TokenInfo,
    @Query(new ParamsValidationPipe())
    query: {
      type?: AccountType;
    },
  ) {
    const res = await this.videoService.getVideoPulTypeCount(
      token.id,
      query.type,
    );
    return res;
  }

  @ApiOperation({
    description: '更新视频发布数据',
    summary: '更新视频发布数据',
  })
  @Post('up/:id')
  async updateVideoPul(
    @Param(new ParamsValidationPipe()) param: VideoPulIdDto,
    @Body(new ParamsValidationPipe()) body: CreateVideoPulDto,
  ) {
    const res = await this.videoService.updateVideoPul(param.id, body);
    return res;
  }

  @ApiOperation({
    description: '删除发布记录',
    summary: '删除发布记录',
  })
  @Post('del/:id')
  async delVideoPul(@Param(new ParamsValidationPipe()) param: VideoPulIdDto) {
    const res = await this.videoService.deleteVideoPulByPubRecordId(param.id);
    return res;
  }
}
