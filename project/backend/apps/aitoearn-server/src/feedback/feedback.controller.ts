/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 反馈
 */
import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { UserService } from '../user/user.service'
import { CreateFeedBackDto } from './dto/feedback.dto'
import { FeedbackService } from './feedback.service'

@ApiTags('OpenSource/InBox/Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly userService: UserService,
  ) {}

  @ApiDoc({
    summary: 'Submit Feedback',
    description: 'Submit user feedback with optional tags and attachments.',
    body: CreateFeedBackDto.schema,
  })
  @Post()
  async createFeedback(
    @GetToken() token: TokenInfo,
    @Body() body: CreateFeedBackDto,
  ) {
    const { fileUrlList, content, type, tagList } = body
    const userInfo = await this.userService.getUserInfoById(token.id)

    const res = await this.feedbackService.createFeedback({
      content,
      userId: userInfo.id,
      userName: userInfo.name,
      fileUrlList,
      type,
      tagList,
    })
    return res
  }
}
