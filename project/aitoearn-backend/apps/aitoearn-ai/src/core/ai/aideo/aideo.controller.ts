import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType, ZodValidationPipe } from '@yikart/common'
import {
  ListAideoTasksQueryDto,
  SubmitAideoTaskRequest,
  submitAideoTaskRequestSchema,
} from './aideo.dto'
import { AideoService } from './aideo.service'
import {
  AideoTaskStatusResponseVo,
  ListAideoTasksResponseVo,
  SubmitAideoTaskResponseVo,
} from './aideo.vo'

@ApiTags('Me/Ai/Aideo')
@Controller('ai/aideo')
export class AideoController {
  constructor(private readonly aideoService: AideoService) {}

  @ApiDoc({
    summary: 'Submit Aideo Task',
    body: submitAideoTaskRequestSchema,
    response: SubmitAideoTaskResponseVo,
  })
  @Post('/tasks')
  async submitAideoTask(
    @GetToken() token: TokenInfo,
    @Body(new ZodValidationPipe(submitAideoTaskRequestSchema)) body: SubmitAideoTaskRequest,
  ): Promise<SubmitAideoTaskResponseVo> {
    const response = await this.aideoService.submitAideoTask({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return SubmitAideoTaskResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Get Aideo Task Status',
    response: AideoTaskStatusResponseVo,
  })
  @Get('/tasks/:taskId')
  async getAideoTask(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ): Promise<AideoTaskStatusResponseVo> {
    const response = await this.aideoService.getAideoTask({
      userId: token.id,
      userType: UserType.User,
      taskId,
    })
    return AideoTaskStatusResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'List Aideo Tasks',
    query: ListAideoTasksQueryDto.schema,
    response: ListAideoTasksResponseVo,
  })
  @Get('/tasks')
  async listAideoTasks(
    @GetToken() token: TokenInfo,
    @Query() query: ListAideoTasksQueryDto,
  ): Promise<ListAideoTasksResponseVo> {
    const [list, total] = await this.aideoService.listAideoTasks({
      userId: token.id,
      userType: UserType.User,
      ...query,
    })
    return new ListAideoTasksResponseVo(list, total, query)
  }
}
