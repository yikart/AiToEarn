/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 反馈
 */
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ParamsValidationPipe } from 'src/validation.pipe';
import { FeedbackService } from './feedback.service';
import { UserService } from 'src/user/user.service';
import { Manager } from 'src/auth/manager.guard';
import { TableDto } from 'src/global/dto/table.dto';
import { GetFeedbackListDto } from './dto/feedback.dto';

@Manager()
@Controller('admin/feedback')
export class FeedbackAdminController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({
    description: '反馈列表',
    summary: '反馈列表',
  })
  @Get('list/:pageNo/:pageSize')
  async getList(
    @Param(new ParamsValidationPipe()) param: TableDto,
    @Query(new ParamsValidationPipe()) query: GetFeedbackListDto,
  ) {
    const res = await this.feedbackService.getFeedbackList(param, query);
    return res;
  }

  @ApiOperation({
    description: '反馈详情',
    summary: '反馈详情',
  })
  @Get('info/:id')
  async getInfo(@Param('id') id: string) {
    const res = await this.feedbackService.getFeedbackInfo(id);
    return res;
  }

  @ApiOperation({
    description: '删除反馈',
    summary: '删除反馈',
  })
  @Get('del/:id')
  async delFeedback(@Param('id') id: string) {
    const res = await this.feedbackService.delFeedback(id);
    return res;
  }
}
