import { Injectable } from '@nestjs/common'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { z } from 'zod'
import {
  PublishOptionSourceProvider,
  PublishOptionValuesInput,
  PublishOptionValuesResult,
  PublishOptionValueType,
} from '../platforms.interface'
import { ThreadsService } from './threads.service'

export const ThreadsLocationFilterSchema = z.object({
  keyword: z.string().min(1).optional().describe('地点搜索关键词'),
  latitude: z.coerce.number().optional().describe('纬度'),
  longitude: z.coerce.number().optional().describe('经度'),
}).refine(
  data => !!data.keyword || (data.latitude !== undefined && data.longitude !== undefined),
  { message: 'keyword or latitude/longitude is required' },
)

@Injectable()
export class ThreadsPublishOptionsProvider implements PublishOptionSourceProvider {
  constructor(private readonly threadsService: ThreadsService) {}

  listSources() {
    return [{
      field: 'location_id',
      label: 'Location',
      description: 'Threads post location',
      valueType: PublishOptionValueType.List,
      requiresAccount: true,
      filterSchema: ThreadsLocationFilterSchema,
    }]
  }

  async getValues(input: PublishOptionValuesInput): Promise<PublishOptionValuesResult> {
    if (input.field !== 'location_id') {
      throw new AppException(ResponseCode.ChannelPlatformOperationNotSupported, {
        platform: AccountType.Threads,
        field: input.field,
      })
    }

    const filters = ThreadsLocationFilterSchema.parse(input.filters ?? {})
    const locations = await this.threadsService.searchLocations(
      input.credential.accessToken,
      filters,
    )

    return {
      field: 'location_id',
      valueType: PublishOptionValueType.List,
      items: locations
        .filter(location => Boolean(location.id))
        .map(location => ({
          value: location.id,
          label: location.name ?? location.id,
          description: [location.address, location.city, location.country]
            .filter(Boolean)
            .join(', ') || undefined,
          extra: {
            address: location.address,
            city: location.city,
            country: location.country,
            latitude: location.latitude,
            longitude: location.longitude,
            postalCode: location.postal_code,
          },
        })),
    }
  }
}
