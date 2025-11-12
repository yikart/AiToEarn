import { Body, Controller, Get, HttpCode, Logger, Param, Post, UseGuards } from '@nestjs/common'
import { AccountType } from '@yikart/aitoearn-server-client'
import { AppException, ResponseCode } from '@yikart/common'
import { plainToInstance } from 'class-transformer'
import moment from 'moment'
import { GetSkKey, SkKeyAuthGuard } from '../../common/guards/skKeyAuth.guard'
import { PublishType } from '../../libs/database/schema/publishTask.schema'
import { SkKey } from '../../libs/database/schema/skKey.schema'
import { AccountService } from '../account/account.service'
import { PublishTaskService } from '../publish/publishTask.service'
import { SkKeyService } from '../skKey/skKey.service'
import { CreatePublishDto } from './dto/publish.dto'

@Controller()
export class PluginController {
  logger = new Logger(PluginController.name)
  constructor(
    private readonly accountService: AccountService,
    private readonly skKeyService: SkKeyService,
    private readonly publishTaskService: PublishTaskService,
  ) { }

  /**
   * 获取key的账号列表
   * @param body
   * @returns
   */
  @HttpCode(200)
  @UseGuards(SkKeyAuthGuard)
  @Get('account/list')
  async accountList(@GetSkKey() skKey: SkKey) {
    const list = await this.skKeyService.getRefAccountAll(skKey.key)
    return list
  }

  /**
   * 创建发布
   * @param body
   * @returns
   */
  @HttpCode(200)
  @UseGuards(SkKeyAuthGuard)
  @Post('publish/create')
  async createPub(@Body() body: CreatePublishDto) {
    try {
      body = plainToInstance(CreatePublishDto, body)
      // 发布时间处理
      let publishTimeDate: Date = new Date(Date.now() + 2 * 60 * 1000)

      const { publishTime } = body

      // 如果publishTime为空，或者转换时间有误，则使用publishTimeDate
      if (!publishTime || !moment(publishTime).isValid()) {
        publishTimeDate = new Date(Date.now() + 2 * 60 * 1000)
      }
      else {
        publishTimeDate = new Date(publishTime)
      }

      const accountInfo = await this.accountService.getAccountInfo(
        body.accountId,
      )
      if (!accountInfo) {
        throw new AppException(ResponseCode.ChannelAccountInfoFailed)
      }
      const { imgUrlList, topics } = body

      // B站默认值
      if (accountInfo.type === AccountType.BILIBILI) {
        (body as any).option = {
          bilibili: {
            tid: 160,
            copyright: 1,
          },
        }
      }

      if (accountInfo.type === AccountType.FACEBOOK) {
        (body as any).option = {
          facebook: {
            content_category: 'post',
          },
        }
      }

      if (accountInfo.type === AccountType.INSTAGRAM) {
        const contentCategory = body.type === PublishType.VIDEO ? 'reel' : 'post';
        (body as any).option = {
          instagram: {
            content_category: contentCategory, // post、reel、story
          },
        }
      }

      if (accountInfo.type === AccountType.YOUTUBE) {
        (body as any).option = {
          youtube: {
            categoryId: '43',
          },
        }
      }

      const ret = await this.publishTaskService.createPub({
        inQueue: false,
        queueId: '',
        uid: accountInfo.uid,
        userId: accountInfo.userId,
        accountType: accountInfo.type,
        ...body,
        publishTime: publishTimeDate,
        imgUrlList: imgUrlList?.split(','),
        topics: topics?.split(','),
        dataId: '',
      })

      return ret
    }
    catch (error) {
      this.logger.error('----------- plugin createPub error ------------', error)
      throw error
    }
  }

  /**
   * 获取流水的发布任务列表
   * @returns
   */
  @HttpCode(200)
  @UseGuards(SkKeyAuthGuard)
  @Get('publish/task/list/:flowId')
  async publishTaskList(
    @Param('flowId') flowId: string,
  ) {
    const res = await this.publishTaskService.getPublishTaskListByFlowId(flowId)
    return res
  }

  /**
   * 获取发布记录列表
   * @param body
   * @returns
   */
  @HttpCode(200)
  @UseGuards(SkKeyAuthGuard)
  @Get('publish/task/info/:taskId')
  async publishRecordList(
    @GetSkKey() skKey: SkKey,
    @Param('taskId') taskId: string,
  ) {
    const res = await this.publishTaskService.getPublishTaskInfo(taskId)

    return res
  }
}
