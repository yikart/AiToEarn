import { Injectable } from '@nestjs/common'

export enum TwitterReadResourceType {
  Post = 'post',
  User = 'user',
  Media = 'media',
  List = 'list',
}

export interface TwitterReadResource {
  type: TwitterReadResourceType
  id: string
}

export enum TwitterWriteChargeType {
  ContentCreate = 'content_create',
  ContentCreateWithUrl = 'content_create_with_url',
  InteractionCreate = 'interaction_create',
  InteractionDelete = 'interaction_delete',
  ContentManage = 'content_manage',
  Bookmark = 'bookmark',
  MediaMetadata = 'media_metadata',
}

interface ResolveBillingContextInput {
  accountId?: string
  userId?: string
}

interface BillingMetadataInput {
  operation: string
  endpoint: string
  accountId?: string
  platformUid?: string
  metadata?: Record<string, unknown>
}

@Injectable()
export class TwitterBillingService {
  async ensureSufficientBalance(_input: ResolveBillingContextInput & { amount: number }) {}

  getReadChargeAmount(_type: TwitterReadResourceType): number {
    return 0
  }

  getWriteChargeAmount(_type: TwitterWriteChargeType): number {
    return 0
  }

  getCreatePostChargeAmount(_text?: string): number {
    return 0
  }

  containsUrl(text?: string): boolean {
    if (!text) {
      return false
    }

    const trimmed = text.trim()
    if (!trimmed) {
      return false
    }

    const urlPattern = /(?:https?:\/\/|www\.)\S+|(?:^|[\s(（])(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?(?=$|[\s)）])/i
    return urlPattern.test(trimmed)
  }

  async chargeWriteOperation(
    _input: ResolveBillingContextInput & BillingMetadataInput & {
      chargeType: TwitterWriteChargeType
      description?: string
    },
  ): Promise<number> {
    return 0
  }

  async chargeReadResources(
    _input: ResolveBillingContextInput & BillingMetadataInput & {
      resources: TwitterReadResource[]
      description?: string
    },
  ): Promise<number> {
    return 0
  }
}
