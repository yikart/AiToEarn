import type { BilibiliArchiveTypeItem } from './bilibili.interface'
import { Injectable } from '@nestjs/common'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import {
  PublishOptionSourceProvider,
  PublishOptionValueItem,
  PublishOptionValuesInput,
  PublishOptionValuesResult,
  PublishOptionValueType,
} from '../platforms.interface'
import { BilibiliService } from './bilibili.service'

@Injectable()
export class BilibiliPublishOptionsProvider implements PublishOptionSourceProvider {
  constructor(private readonly bilibiliService: BilibiliService) {}

  listSources() {
    return [{
      field: 'tid',
      label: 'Archive Type',
      description: 'Bilibili archive partition',
      valueType: PublishOptionValueType.Tree,
      requiresAccount: true,
    }]
  }

  async getValues(input: PublishOptionValuesInput): Promise<PublishOptionValuesResult> {
    if (input.field !== 'tid') {
      throw new AppException(ResponseCode.ChannelPlatformOperationNotSupported, {
        platform: AccountType.Bilibili,
        field: input.field,
      })
    }

    const archiveTypes = await this.bilibiliService.listArchiveTypes(input.credential.accessToken)
    return {
      field: 'tid',
      valueType: PublishOptionValueType.Tree,
      items: archiveTypes.map(item => this.toItem(item)),
    }
  }

  private toItem(item: BilibiliArchiveTypeItem): PublishOptionValueItem {
    const children = item.children?.map(child => ({
      value: String(child.id),
      label: child.name,
      description: child.description,
      extra: {
        parent: child.parent,
      },
    })) ?? []

    return {
      value: String(item.id),
      label: item.name,
      description: item.description,
      disabled: children.length > 0,
      children,
      extra: {
        parent: item.parent,
      },
    }
  }
}
