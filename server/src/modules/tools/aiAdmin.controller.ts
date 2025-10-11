/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: admin AI工具
 */
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ParamsValidationPipe } from 'src/validation.pipe';
import { AiToolsService } from './ai.service';
import { Manager } from 'src/auth/manager.guard';
import {
  AdminAiIdDto,
  AdminAiMarkdownDto,
  AdminFireflycardDto,
  AdminJmTaskDto,
} from './dto/aiAdmin.dto';
import { OssService } from 'src/lib/oss/oss.service';
@Manager()
@Controller('admin/tools/ai')
export class AiToolsAdminController {
  constructor(
    private readonly aiToolsService: AiToolsService,
    private readonly ossService: OssService,
  ) {}

  @Post('fireflycard')
  async fireflycard(
    @Body(new ParamsValidationPipe()) body: AdminFireflycardDto,
  ) {
    // 二进制文件流
    const res = await this.aiToolsService.fireflycard(
      body.content,
      body.temp,
      body.title,
    );

    const fileRes = await this.ossService.uploadByStream(res, {
      path: 'fireflycard',
      fileType: 'png',
    });

    return fileRes;
  }

  @Post('markdown')
  async aiMarkdown(@Body(new ParamsValidationPipe()) body: AdminAiMarkdownDto) {
    const res = await this.aiToolsService.aiMarkdown(body);
    return res;
  }

  /**
   * 获取AI的mk结果
   * @param id
   * @returns
   */
  @Get('markdown/:id')
  async getAiMarkdown(@Param(new ParamsValidationPipe()) param: AdminAiIdDto) {
    const res = await this.aiToolsService.getAiMarkdown(param.id);
    return res;
  }

  @Post('jm/task')
  async upJmImgTask(@Body(new ParamsValidationPipe()) body: AdminJmTaskDto) {
    const res = await this.aiToolsService.upJmImgTask(body);

    return res;
  }

  @Get('jm/task/:id')
  async getJmImgTaskRes(@Param('id') id: string) {
    const res = await this.aiToolsService.getJmImgTaskRes(id);
    return res;
  }
}
