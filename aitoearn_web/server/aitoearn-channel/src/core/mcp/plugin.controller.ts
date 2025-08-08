import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import moment from 'moment';
import { AppException } from '@/common';
import { ExceptionCode } from '@/common/enums/exception-code.enum';
import { GetSkKey, SkKeyAuthGuard } from '@/common/guards/skKeyAuth.guard';
import { SkKey } from '@/libs/database/schema/skKey.schema';
import { AccountType } from '@/transports/account/common';
import { AccountService } from '../account/account.service';
import { PublishRecordService } from '../publish/publishRecord.service';
import { PublishTaskService } from '../publish/publishTask.service';
import { SkKeyService } from '../skKey/skKey.service';
import { CreatePublishDto } from './dto/publish.dto';

@Controller('plugin')
export class PluginController {
  constructor(
    private readonly accountService: AccountService,
    private readonly skKeyService: SkKeyService,
    private readonly publishTaskService: PublishTaskService,
    private readonly publishRecordService: PublishRecordService,
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
    const list = await this.skKeyService.getRefAccountAll(skKey.key);
    return list;
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
    // 发布时间处理
    let publishTimeDate: Date = new Date(Date.now() + 2 * 60 * 1000);
    try {
      const { publishTime } = body;
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
    try {
      body = plainToInstance(CreatePublishDto, body);

      const accountInfo = await this.accountService.getAccountInfo(
        body.accountId,
      );
      if (!accountInfo)
        throw new AppException(ExceptionCode.File, '账号信息获取失败');
      const { imgUrlList, topics } = body;

      // B站默认值
      if (accountInfo.type === AccountType.BILIBILI) {
        (body as any).option = {
          bilibili: {
            tid: 160,
            copyright: 1,
          },
        };
      }

      if (accountInfo.type === AccountType.FACEBOOK) {
        (body as any).option = {
          facebook: {
            content_category: 'video',
          },
        };
      }

      if (accountInfo.type === AccountType.INSTAGRAM) {
        (body as any).option = {
          instagram: {
            content_category: 'video',
          },
        };
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
      });

      return ret;
    }
    catch (error) {
      Logger.debug('----------- in createPub error ------------', error);
      Logger.error(error);
    }
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
    const res = await this.publishTaskService.getPublishTaskInfo(taskId);

    return res;
  }
}
