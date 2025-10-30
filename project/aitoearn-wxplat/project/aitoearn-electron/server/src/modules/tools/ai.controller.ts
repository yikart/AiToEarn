/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: AI工具
 */
import { Body, Controller, Post, Sse } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ParamsValidationPipe } from 'src/validation.pipe';
import {
  AiArticleHtmlDto,
  AiArticleHtmlTestDto,
  ReviewAi,
  ReviewAiRecover,
  ReviewImgAi,
  VideoAiDesDto,
} from './dto/ai.dto';
import { AiToolsService } from './ai.service';
import { Public } from 'src/auth/auth.guard';
@ApiTags('AI工具')
@Public()
@Controller('tools/ai')
export class AiToolsController {
  constructor(private readonly aiToolsService: AiToolsService) {}

  @ApiOperation({
    summary: '视频AI标题',
    description: '视频文件只能输入一个，大小限制为 150 MB，时长限制为 40s。',
  })
  @ApiResponse({
    description: '视频AI标题',
    type: String,
  })
  @Post('video/title')
  async videoAiTitle(
    // @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: VideoAiDesDto,
  ) {
    const res = await this.aiToolsService.videoAiTitle(body.url);
    return res;
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
  async reviewAi(
    // @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: ReviewAi,
  ) {
    const res = await this.aiToolsService.reviewAi(
      body.title,
      body.desc,
      body.max,
    );
    return res;
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
  async reviewImgAi(
    // @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: ReviewImgAi,
  ) {
    const res = await this.aiToolsService.reviewImgByAi(
      body.imgUrl,
      body.title,
      body.desc,
      body.max,
    );
    return res;
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
    // @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: ReviewAiRecover,
  ) {
    const res = await this.aiToolsService.reviewAiRecover(
      body.content,
      body.title,
      body.desc,
      body.max,
    );
    return res;
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
    // @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: AiArticleHtmlDto,
  ) {
    const res = await this.aiToolsService.aiArticleHtml(body.content);
    return res;
  }

  @ApiOperation({
    summary: '生成AI的html图文',
    description: '生成AI的html图文',
  })
  @ApiResponse({
    description: '生成AI的html图文',
    type: String,
  })
  @Public()
  @Post('article/html2')
  async aiArticleHtml2(
    // @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: AiArticleHtmlTestDto,
  ) {
    const res = await this.aiToolsService.aiArticleHtml2(
      body.model,
      body.content,
      body.content2,
    );
    return res;
  }

  @Public()
  @Post('article/html/sse')
  @Sse('article/html/sse')
  aiArticleHtmlSse(@Body(new ParamsValidationPipe()) body: AiArticleHtmlDto) {
    return this.aiToolsService.aiArticleHtmlSse(body.content);
  }
}
