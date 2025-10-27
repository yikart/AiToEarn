/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2025-04-14 19:21:01
 * @LastEditors: nevin
 * @Description: QA
 */
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParamsValidationPipe } from 'src/validation.pipe';
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces';
import { GetToken } from 'src/auth/auth.guard';
import { TableDto } from 'src/global/dto/table.dto';
import { QaService } from './qa.service';

@ApiTags('QA')
@Controller('qa')
export class QaController {
  constructor(private readonly qaService: QaService) {}

  @ApiOperation({
    description: '获取列表',
    summary: '获取列表',
  })
  @Get('list/:pageNo/:pageSize')
  async getPubRecordDraftsList(
    @GetToken() token: TokenInfo,
    @Param(new ParamsValidationPipe()) param: TableDto,
    @Query(new ParamsValidationPipe()) query: any,
  ) {
    const res = await this.qaService.getQaRecordList(param, query);
    return res;
  }
}
