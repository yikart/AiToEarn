/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 反馈
 */
import { Controller } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedBackDto } from './dto/feedback.dto';
import { Payload } from '@nestjs/microservices';
import { NatsMessagePattern } from 'src/common/decorators/custom-message-pattern.decorator';
import { Feedback, FeedbackType } from '@/libs';

@ApiTags('反馈')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @ApiOperation({
    description: '提交反馈',
    summary: '提交反馈',
  })
  @NatsMessagePattern('other.feedback.create')
  async createFeedback(@Payload() data: CreateFeedBackDto) {
    const { fileUrlList, content, type, tagList } = data;
    const newData = new Feedback();
    newData.content = content;
    newData.userId = data.userId;
    newData.userName = data.userName;
    newData.fileUrlList = fileUrlList || [];
    newData.type = type || FeedbackType.feedback;
    newData.tagList = tagList;

    const res = await this.feedbackService.createFeedback(newData);
    return res;
  }
}
