import {
  GetPromptResult,
} from '@modelcontextprotocol/sdk/types'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType } from '@yikart/aitoearn-server-client'
import { AppException } from '@yikart/common'
import moment from 'moment'
import { ExceptionCode } from '../../common/enums/exception-code.enum'
import { AccountService } from '../account/account.service'
import { PlatPulOption } from '../publish/common'
import { PublishTaskService } from '../publish/publishTask.service'
import { SkKeyService } from '../skKey/skKey.service'
import { CreatePublishingTaskResp, McpAuthedAccountsRespVo, McpAuthedAccountVo, UpdatePublishTaskTimeDto } from './dto/mcp.dto'
import { CreatePublishingTaskDto } from './dto/publish.dto'

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name)
  constructor(
    private readonly publishTaskService: PublishTaskService,
    private readonly accountService: AccountService,
    private readonly skKeyService: SkKeyService,
  ) { }

  private async createPublishingTask(accountId: string, data: CreatePublishingTaskDto) {
    const now = new Date()
    const defaultPublishingTime = moment(now).add(2, 'minute').toDate()
    const publishingTime = data.publishingTime ? moment(data.publishingTime).toDate() : defaultPublishingTime
    if (publishingTime < now) {
      throw new AppException(1, 'publishingTime cannot be less than the current time')
    }

    const accountInfo = await this.accountService.getAccountInfo(accountId)
    if (!accountInfo)
      throw new AppException(ExceptionCode.UserNotFound, 'Account not found')

    const { imgUrlList, topics } = data

    const option: PlatPulOption = {
      bilibili: {
        tid: 160,
        copyright: 1,
      },
    }
    const task = await this.publishTaskService.createPub({
      inQueue: false,
      queueId: '',
      accountId,
      type: data.mediaType,
      uid: accountInfo.uid,
      userId: accountInfo.userId,
      accountType: accountInfo.type,
      title: data.title || '',
      desc: data.desc || '',
      videoUrl: data.videoUrl || '',
      coverUrl: data.coverUrl || '',
      option,
      publishTime: publishingTime,
      imgUrlList: imgUrlList?.split(','),
      topics: topics?.split(','),
    })
    return task.id
  }

  async bulkCreatePublishingTask(skKey: string, data: CreatePublishingTaskDto): Promise<CreatePublishingTaskResp> {
    const now = new Date()
    const defaultPublishingTime = moment(now).add(2, 'minute').toDate()
    const publishingTime = data.publishingTime ? moment(data.publishingTime).toDate() : defaultPublishingTime
    if (publishingTime < now) {
      throw new AppException(1, 'publishingTime cannot be less than the current time')
    }
    let accountIdList = data.accounts
    if (!accountIdList || accountIdList.length === 0) {
      const accounts = await this.skKeyService.getRefAccountAll(skKey)
      accountIdList = accounts.map(acc => acc.accountId)
    }
    if (accountIdList.length === 0) {
      throw new AppException(ExceptionCode.UserNotFound, 'No accounts found for the provided skKey')
    }
    const resp: CreatePublishingTaskResp = {
      tasks: [],
    }
    for (const accountId of accountIdList) {
      const taskId = await this.createPublishingTask(accountId, data)
      resp.tasks.push(taskId)
    }
    return resp
  }

  async generatePublishingPrompt(): Promise<GetPromptResult> {
    const res: GetPromptResult = {
      role: 'assistant',
      content: {
        type: 'text',
        text: `平台账号类型： 微信公众号：${AccountType.WxGzh}，bilibili：${AccountType.BILIBILI}，抖音： ${AccountType.Douyin}，快手：${AccountType.KWAI}，twitter：${AccountType.TWITTER}，instagram：${AccountType.INSTAGRAM}，threads：${AccountType.THREADS}，youtube：${AccountType.YOUTUBE}}`,
      },
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `帮我写一个发布任务，内容是：desc，标题是：title， 类型是：type，视频链接是：videoUrl，封面链接地址是：coverUrl，图片链接地址数组是：imgUrlList，发布时间是：publishTime, 话题数组是：topics `,
          },
        },
      ],
    }
    return res
  }

  async updatePublishingTime(data: UpdatePublishTaskTimeDto) {
    await this.publishTaskService.updatePublishTaskTime(
      data.id,
      data.publishingTime,
      data.userId,
    )
    return {
      id: data.id,
      publishTime: data.publishingTime,
    }
  }

  async listLinkedAccounts(skKey: string): Promise<McpAuthedAccountsRespVo> {
    const authedAccounts = await this.skKeyService.getRefAccountAll(skKey)
    const accounts: McpAuthedAccountVo[] = []
    for (const acc of authedAccounts) {
      const accountInfo = await this.accountService.getAccountInfo(acc.accountId)
      if (accountInfo) {
        accounts.push({
          accountId: accountInfo.id,
          userId: accountInfo.userId,
          platform: accountInfo.type,
          nickname: accountInfo.nickname || '',
        })
      }
    }
    return { accounts }
  }
}
