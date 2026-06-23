import { Injectable } from '@nestjs/common'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { z } from 'zod'
import {
  PublishOptionSourceProvider,
  PublishOptionValuesInput,
  PublishOptionValuesResult,
  PublishOptionValueType,
} from '../platforms.interface'
import { YoutubeService } from './youtube.service'

export const YoutubeCategoryFilterSchema = z.object({
  id: z.string().optional().describe('YouTube 分类 ID'),
  regionCode: z.string().optional().describe('YouTube 地区代码'),
})

@Injectable()
export class YoutubePublishOptionsProvider implements PublishOptionSourceProvider {
  constructor(private readonly youtubeService: YoutubeService) {}

  listSources() {
    return [{
      field: 'categoryId',
      label: 'Category',
      description: 'YouTube video category',
      valueType: PublishOptionValueType.List,
      requiresAccount: true,
      filterSchema: YoutubeCategoryFilterSchema,
    }]
  }

  async getValues(input: PublishOptionValuesInput): Promise<PublishOptionValuesResult> {
    if (input.field !== 'categoryId') {
      throw new AppException(ResponseCode.ChannelPlatformOperationNotSupported, {
        platform: AccountType.YouTube,
        field: input.field,
      })
    }

    const filters = YoutubeCategoryFilterSchema.parse(input.filters ?? {})
    const categories = await this.youtubeService.listVideoCategories(
      input.credential.accessToken,
      filters,
    )

    return {
      field: 'categoryId',
      valueType: PublishOptionValueType.List,
      items: categories
        .filter(category => Boolean(category.id) && category.snippet?.assignable === true)
        .map(category => ({
          value: category.id!,
          label: category.snippet?.title ?? category.id!,
          extra: {
            assignable: category.snippet?.assignable,
            channelId: category.snippet?.channelId,
          },
        })),
    }
  }
}
