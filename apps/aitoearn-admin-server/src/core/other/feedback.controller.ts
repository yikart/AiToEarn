/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 反馈
 */
import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UserService } from '../user/user.service'
import { FeedbackService } from './feedback.service'

@ApiTags('反馈')
@Controller('feedback')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly userService: UserService,
  ) {}
}
