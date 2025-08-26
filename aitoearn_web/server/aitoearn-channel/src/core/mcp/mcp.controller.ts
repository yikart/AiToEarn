import {
  CallToolResult,
  GetPromptResult,
} from '@modelcontextprotocol/sdk/types';
import { Controller, Logger } from '@nestjs/common';
import { Prompt, Tool } from '@rekog/mcp-nest';
import { plainToInstance } from 'class-transformer';
import moment from 'moment';
import { AppException } from '@/common';
import { ExceptionCode } from '@/common/enums/exception-code.enum';
import { AccountType } from '@/transports/account/common';
import { AccountService } from '../account/account.service';
import {
  McpPromptPublishSchema,
  UpPublishTaskTimeDto,
  UpPublishTaskTimeSchema,
} from '../publish/dto/publish.dto';
import { PublishTaskService } from '../publish/publishTask.service';
import { CreatePublishDto, CreatePublishSchema } from './dto/publish.dto';

@Controller('mcp')
export class McpController {
  constructor(
    private readonly publishTaskService: PublishTaskService,
    private readonly accountService: AccountService,
  ) {}

  @Prompt({
    name: 'channel_publish_create_prompt',
    description: '创建提示词',
    parameters: McpPromptPublishSchema,
  })
  async promptPublish() {
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
    };

    return res;
  }

  @Tool({
    name: 'channel_publish_create',
    description: '发布任务创建',
    parameters: CreatePublishSchema,
  })
  async createPub(data: CreatePublishDto) {
    data = plainToInstance(CreatePublishDto, data);

    let publishTimeDate: Date = new Date(Date.now() + 2 * 60 * 1000);
    try {
      const { publishTime } = data;
      if (publishTime) {
        publishTimeDate = moment(publishTime).toDate();
        if (publishTimeDate.getTime() < Date.now()) {
          throw new AppException(1, '发布时间不能小于当前时间');
        }
      }
    }
    catch (error) {
      Logger.error('mcp publish createPub', error);
      throw new AppException(1, '发布时间格式有误');
    }

    const accountInfo = await this.accountService.getAccountInfo(
      data.accountId,
    );
    if (!accountInfo)
      throw new AppException(ExceptionCode.File, '账号信息获取失败');

    const { imgUrlList, topics } = data;

    // B站默认值
    if (accountInfo.type === AccountType.BILIBILI) {
      (data as any).option = {
        bilibili: {
          tid: 160,
          copyright: 1,
        },
      };
    }

    const res: CallToolResult = {
      content: [],
    };

    try {
      const ret = await this.publishTaskService.createPub({
        inQueue: false,
        queueId: '',
        uid: accountInfo.uid,
        userId: accountInfo.userId,
        accountType: accountInfo.type,
        ...data,
        publishTime: publishTimeDate,
        imgUrlList: imgUrlList?.split(','),
        topics: topics?.split(','),
      });

      res.contents = [
        {
          type: 'text',
          value: ret.id,
          text: '发布成功',
        },
      ];
    }
    catch (error) {
      res.isError = true;
      res.contents = [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ];
    }

    return res;
  }

  @Tool({
    name: 'channel_publish_changeTime',
    description: '更新发布任务时间',
    parameters: UpPublishTaskTimeSchema,
  })
  async changeTaskTime(data: UpPublishTaskTimeDto) {
    const res = await this.publishTaskService.updatePublishTaskTime(
      data.id,
      data.publishTime,
      data.userId,
    );
    return {
      contents: [{ type: 'text', text: res ? 'success' : 'fail' }],
    };
  }
}
