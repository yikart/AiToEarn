/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 反馈
 */
import { Body, Controller, Post, Sse } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParamsValidationPipe } from 'src/validation.pipe';
import { FeedbackService } from './feedback.service';
import { CreateFeedBackDto } from './dto/feedback.dto';
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces';
import { UserService } from 'src/user/user.service';
import { interval, map, Observable } from 'rxjs';
import { GetToken } from 'src/auth/auth.guard';
import { Feedback } from 'src/db/schema/feedback.schema';

@ApiTags('反馈')
@Controller('feedback')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({
    description: '提交反馈',
    summary: '提交反馈',
  })
  @Post()
  async createFeedback(
    @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: CreateFeedBackDto,
  ) {
    const { fileUrlList, content, type, tagList } = body;
    const userInfo = await this.userService.getUserInfoById(token.id);
    const newData = new Feedback();
    newData.content = content;
    newData.userId = userInfo.id;
    newData.userName = userInfo.name;
    newData.fileUrlList = fileUrlList; // TODO: 去除临时目录
    newData.type = type;
    newData.tagList = tagList;

    const res = await this.feedbackService.createFeedback(newData);
    return res;
  }

  @ApiOperation({
    description: 'sse接口测试',
    summary: 'sse接口测试',
  })
  @Post('sse')
  @Sse('sse')
  sse2(): Observable<any> {
    const text = [
      '这是第一句话',
      '这是第二句话',
      '这是第三句话',
      '这是第四句话',
    ];
    console.log(text);
    return interval(1000).pipe(
      map((i) => {
        return {
          data: text[i],
        };
      }),
    );
  }
}
