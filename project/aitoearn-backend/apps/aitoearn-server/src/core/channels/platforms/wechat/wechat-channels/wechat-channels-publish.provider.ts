import type {
  NormalizedPublishTask,
  PublishNormalizeInput,
  PublishProvider,
  PublishProviderResult,
  PublishPublishInput,
  PublishValidateInput,
  PublishValidationResult,
} from '../../platforms.interface'
import type { WeChatChannelsOption } from './wechat-channels.schema'
import { Injectable } from '@nestjs/common'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { PublishRecordLinkStatus } from '@yikart/mongodb'
import { PublishValidationField, PublishValidationIssueCode } from '../../publish.schema'

interface WeChatChannelsDataOption {
  linkMeta?: Record<string, unknown>
}

@Injectable()
export class WeChatChannelsPublishProvider implements PublishProvider<WeChatChannelsOption, WeChatChannelsDataOption> {
  readonly platform = AccountType.WeChatChannels

  async validate(input: PublishValidateInput<WeChatChannelsOption>): Promise<PublishValidationResult> {
    if (!input.option?.workId && !input.option?.workLink) {
      return {
        valid: false,
        issues: [{
          code: PublishValidationIssueCode.Required,
          path: ['option', 'workId'],
          params: { field: PublishValidationField.Option },
        }],
      }
    }

    return { valid: true }
  }

  async normalize(input: PublishNormalizeInput<WeChatChannelsOption>): Promise<NormalizedPublishTask<WeChatChannelsOption>> {
    return {
      content: input.content,
      option: input.option,
    }
  }

  async publish(input: PublishPublishInput<WeChatChannelsOption>): Promise<PublishProviderResult<WeChatChannelsDataOption>> {
    const option = input.option
    const platformWorkId = option?.workId || option?.workLink
    if (!platformWorkId) {
      throw new AppException(ResponseCode.ChannelPublishPlatformWorkIdMissing)
    }

    return {
      status: 200,
      platformWorkId,
      permalink: option?.workLink,
      linkStatus: option?.linkStatus === PublishRecordLinkStatus.PENDING
        ? PublishRecordLinkStatus.PENDING
        : PublishRecordLinkStatus.READY,
      linkMeta: option?.linkMeta,
      dataOption: option?.linkMeta ? { linkMeta: option.linkMeta } : undefined,
    }
  }
}
