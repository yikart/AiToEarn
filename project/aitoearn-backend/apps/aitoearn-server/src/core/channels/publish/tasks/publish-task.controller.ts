import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { UpdatePublishAtBodyDto, UpdatePublishedBodyDto } from './publish-task.dto'
import { PublishTaskService } from './publish-task.service'
import { ChannelPublishTaskOperationVo } from './publish-task.vo'

@ApiTags('Channels/Publish')
@Controller({ path: '/channels/publish/tasks', version: '2' })
export class PublishTaskController {
  constructor(private readonly publishTaskService: PublishTaskService) {}

  @ApiDoc({
    summary: '立即发布',
    description: '将定时任务调整为立即发布',
    response: ChannelPublishTaskOperationVo,
  })
  @Post('/:taskId/publish-now')
  async publishNow(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    await this.publishTaskService.publishNow(token.id, taskId)
    return { taskId }
  }

  @ApiDoc({
    summary: '重试发布任务',
    description: '重试当前用户失败的发布任务',
    response: ChannelPublishTaskOperationVo,
  })
  @Post('/:taskId/retry')
  async retryTask(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    await this.publishTaskService.retryTask(token.id, taskId)
    return { taskId }
  }

  @ApiDoc({
    summary: '取消发布任务',
    description: '取消指定的发布任务',
    response: ChannelPublishTaskOperationVo,
  })
  @Delete('/:taskId')
  async cancelTask(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    await this.publishTaskService.cancelTask(token.id, taskId)
    return { taskId }
  }

  @ApiDoc({
    summary: '修改发布时间',
    description: '修改待发布任务的发布时间',
    body: UpdatePublishAtBodyDto.schema,
    response: ChannelPublishTaskOperationVo,
  })
  @Patch('/:taskId/publish-at')
  async updatePublishAt(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
    @Body() body: UpdatePublishAtBodyDto,
  ) {
    await this.publishTaskService.updatePublishAt(token.id, taskId, body.publishAt)
    return { taskId }
  }

  @ApiDoc({
    summary: '更新已发布内容',
    description: '更新已发布任务的内容',
    body: UpdatePublishedBodyDto.schema,
    response: ChannelPublishTaskOperationVo,
  })
  @Post('/:taskId/update')
  async updatePublished(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
    @Body() body: UpdatePublishedBodyDto,
  ) {
    await this.publishTaskService.requestUpdate(token.id, taskId, body)
    return { taskId }
  }
}
