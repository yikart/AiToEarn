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
}
