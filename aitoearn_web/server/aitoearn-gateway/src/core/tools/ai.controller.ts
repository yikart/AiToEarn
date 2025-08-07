/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: AI工具
 */
import { Body, Controller, Get, Param, Post, Sse } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from 'src/auth/auth.guard'
import { FileService } from '../file/file.service'
import { AiToolsService } from './ai.service'
import {
  AiArticleHtmlDto,
  ReviewAi,
  ReviewAiRecover,
  ReviewImgAi,
  VideoAiDesDto,
} from './dto/ai.dto'
import {
  AdminAiIdDto,
  AdminAiMarkdownDto,
  AdminFireflycardDto,
  AdminJmTaskDto,
} from './dto/aiAdmin.dto'

@ApiTags('AI工具')
@Public()
@Controller('tools/ai')
export class AiToolsController {
  constructor(
    private readonly aiToolsService: AiToolsService,
    private readonly fileService: FileService,
  ) {}

  @ApiOperation({
    summary: '视频AI标题',
    description: '视频文件只能输入一个，大小限制为 150 MB，时长限制为 40s。',
  })
  @ApiResponse({
    description: '视频AI标题',
    type: String,
  })
  @Post('video/title')
  async videoAiTitle(@Body() body: VideoAiDesDto) {
    const res = await this.aiToolsService.videoAiTitle(body.url)
    return res
  }

  @ApiOperation({
    summary: '智能评论',
    description: '对作品进行智能评论',
  })
  @ApiResponse({
    description: '评论',
    type: String,
  })
  @Post('review')
  async reviewAi(@Body() body: ReviewAi) {
    const res = await this.aiToolsService.reviewAi(
      body.title,
      body.desc,
      body.max,
    )
    return res
  }

  @ApiOperation({
    summary: '智能评论',
    description: '对作品封面图进行智能评论',
  })
  @ApiResponse({
    description: '评论',
    type: String,
  })
  @Post('reviewImg')
  async reviewImgAi(@Body() body: ReviewImgAi) {
    const res = await this.aiToolsService.reviewImgByAi(
      body.imgUrl,
      body.title,
      body.desc,
      body.max,
    )
    return res
  }

  @ApiOperation({
    summary: '智能评论回复',
    description: '对作品进行智能评论回复',
  })
  @ApiResponse({
    description: '评论',
    type: String,
  })
  @Post('recover/review')
  async reviewAiRecover(
    @Body() body: ReviewAiRecover,
  ) {
    const res = await this.aiToolsService.reviewAiRecover(
      body.content,
      body.title,
      body.desc,
      body.max,
    )
    return res
  }

  @ApiOperation({
    summary: '生成AI的html图文',
    description: '生成AI的html图文',
  })
  @ApiResponse({
    description: '生成AI的html图文',
    type: String,
  })
  @Post('article/html')
  async aiArticleHtml(
    @Body() body: AiArticleHtmlDto,
  ) {
    const res = await this.aiToolsService.aiArticleHtml(body.content)
    return res
  }

  @ApiOperation({
    summary: '生成AI的html图文（SSE）',
    description: '暂未用到',
  })
  @ApiResponse({
    description: '生成AI的html图文',
    type: String,
  })
  @Public()
  @Post('article/html/sse')
  @Sse('article/html/sse')
  aiArticleHtmlSse(@Body() body: AiArticleHtmlDto) {
    return this.aiToolsService.aiArticleHtmlSse(body.content)
  }

  @ApiOperation({
    summary: '流光卡片',
    description: 'AI文字转绚丽卡片图',
  })
  @ApiResponse({
    description: '返回图片地址',
    type: String,
  })
  @Post('fireflycard')
  async fireflycard(
    @Body() body: AdminFireflycardDto,
  ) {
    // 二进制文件流
    const res = await this.aiToolsService.fireflycard(
      body.content,
      body.temp,
      body.title,
    )

    const fileRes = await this.fileService.uploadByStream(res, {
      path: 'fireflycard',
      fileType: 'png',
    })

    return fileRes
  }

  @ApiOperation({
    summary: '文字转Markdown',
    description: '文字转Markdown',
  })
  @ApiResponse({
    description: '任务ID',
    type: String,
  })
  @Post('markdown')
  aiMarkdown(@Body() body: AdminAiMarkdownDto) {
    const res = this.aiToolsService.aiMarkdown(body)
    return res
  }

  @ApiOperation({
    summary: '获取AI的mk结果',
    description: '获取AI的mk结果',
  })
  @ApiResponse({
    description: 'Markdown文本',
    type: String,
  })
  @Get('markdown/:id')
  async getAiMarkdown(@Param() param: AdminAiIdDto) {
    const res = await this.aiToolsService.getAiMarkdown(param.id)
    return res
  }

  @ApiOperation({
    summary: '即梦文生图',
    description:
      '获取即梦文生图任务ID,0e2bdef17755a3f121b608ec8a763f6b,7e90a4c9bb3c6c8b7056267f27395c78',
  })
  @ApiResponse({
    description: '任务ID',
    type: String,
  })
  @Post('jm/task')
  async upJmImgTask(@Body() body: AdminJmTaskDto) {
    const res = await this.aiToolsService.upJmImgTask(body)

    return res
  }

  @ApiOperation({
    summary: '获取即梦文生图结果',
    description: '获取即梦文生图结果',
  })
  @ApiResponse({
    description: 'Markdown文本',
    type: Object,
  })
  @Get('jm/task/:id')
  async getJmImgTaskRes(@Param('id') id: string) {
    const res = await this.aiToolsService.getJmImgTaskRes(id)
    return res
  }
}
