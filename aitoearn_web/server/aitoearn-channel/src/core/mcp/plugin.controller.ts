import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
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
  ) {}

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
  async createPub(@Body() data: CreatePublishDto) {
    data = plainToInstance(CreatePublishDto, data);

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

    const ret = await this.publishTaskService.createPub({
      inQueue: false,
      queueId: '',
      uid: accountInfo.uid,
      userId: accountInfo.userId,
      accountType: accountInfo.type,
      ...data,
      imgUrlList: imgUrlList?.split(','),
      topics: topics?.split(','),
    });

    return ret;
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
