/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 发布
 */
import { Body, Controller, Get, Param, Post, Query, Delete } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParamsValidationPipe } from 'src/validation.pipe';
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces';
import { GetToken } from 'src/auth/auth.guard';
import { PublishService } from './publish.service';
import { CreatePublishDto, PubRecordListDto } from './dto/publish.dto';
import { TableDto } from 'src/global/dto/table.dto';
import { PubStatus } from 'src/db/schema/pubRecord.schema';

@ApiTags('发布')
@Controller('publish')
export class PublishController {
  constructor(private readonly pubRecordService: PublishService) {}

  @ApiOperation({
    description: '创建发布记录',
    summary: '创建发布记录',
  })
  @Post()
  async createPubRecord(
    @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: CreatePublishDto,
  ) {
    console.log(body)
    const res = await this.pubRecordService.createPubRecord({
      userId: token.id,
      ...body,
    });
    return res;
  }

  @ApiOperation({
    description: '获取发布记录列表',
    summary: '获取发布记录列表',
  })
  @Get('list/:pageNo/:pageSize')
  async getPubRecordList(
    @GetToken() token: TokenInfo,
    @Param(new ParamsValidationPipe()) param: TableDto,
    @Query(new ParamsValidationPipe()) query: PubRecordListDto,
  ) {
    const res = await this.pubRecordService.getPubRecordList(
      token.id,
      param,
      query,
    );
    return res;
  }

  @ApiOperation({
    description: '获取草稿列表',
    summary: '获取草稿列表',
  })
  @Get('drafts/list/:pageNo/:pageSize')
  async getPubRecordDraftsList(
    @GetToken() token: TokenInfo,
    @Param(new ParamsValidationPipe()) param: TableDto,
    @Query(new ParamsValidationPipe()) query: PubRecordListDto,
  ) {
    const res = await this.pubRecordService.getPubRecordDraftsList(
      token.id,
      param,
      query,
    );
    return res;
  }

  @ApiOperation({
    description: '更新发布记录状态',
    summary: '更新发布记录状态',
  })
  @Post('status/:id')
  async updatePubRecordStatus(
    @GetToken() token: TokenInfo,
    @Param('id', new ParamsValidationPipe()) id: number,
    @Body('status', new ParamsValidationPipe()) status: PubStatus,
  ) {
    const res = await this.pubRecordService.updatePubRecordStatus(id, status);
    return res;
  }

  @ApiOperation({
    description: '删除发布记录',
    summary: '删除发布记录',
  })
  @Delete(':id')
  async deletePubRecord(
    @GetToken() token: TokenInfo,
    @Param('id', new ParamsValidationPipe()) id: number,
  ) {
    const res = await this.pubRecordService.deletePubRecordById(id);
    return res;
  }
}
