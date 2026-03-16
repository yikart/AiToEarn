import type { AssetsConfig } from './assets.config'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { AssetRepository, AssetStatus } from '@yikart/mongodb'
import { ASSETS_CONFIG } from './assets.config'

export interface R2EventMessage {
  account: string
  bucket: string
  object: {
    key: string
    size: number
    eTag: string
  }
  action: 'PutObject' | 'CopyObject' | 'CompleteMultipartUpload' | 'DeleteObject'
  eventTime: string
}

export interface CloudflareQueueMessage {
  body: R2EventMessage
  id: string
  timestamp_ms: number
  attempts: number
  lease_id: string
}

@Injectable()
export class R2EventsService {
  private readonly logger = new Logger(R2EventsService.name)
  private readonly baseUrl: string
  private readonly apiToken: string

  constructor(
    @Inject(ASSETS_CONFIG) private readonly config: AssetsConfig,
    private readonly assetRepository: AssetRepository,
  ) {
    const cf = config.provider === 's3' ? config.cloudflare : undefined
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${cf?.accountId}/queues/${cf?.queueId}/messages`
    this.apiToken = cf?.apiToken || ''
  }

  async pullMessages(batchSize = 10): Promise<CloudflareQueueMessage[]> {
    const response = await fetch(`${this.baseUrl}/pull`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ batch_size: batchSize, visibility_timeout_ms: 30000 }),
    })

    const data = await response.json() as {
      success: boolean
      result: { messages: CloudflareQueueMessage[] }
    }

    return data.result?.messages || []
  }

  async ackMessages(leaseIds: string[]): Promise<void> {
    if (leaseIds.length === 0)
      return

    await fetch(`${this.baseUrl}/ack`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ acks: leaseIds.map(lease_id => ({ lease_id })) }),
    })
  }

  async processMessages(): Promise<{ processed: number, failed: number }> {
    const messages = await this.pullMessages(10)
    if (messages.length === 0)
      return { processed: 0, failed: 0 }

    const processedIds: string[] = []
    let failed = 0

    for (const msg of messages) {
      const event = msg.body
      if (!['PutObject', 'CopyObject', 'CompleteMultipartUpload'].includes(event.action)) {
        processedIds.push(msg.lease_id)
        continue
      }

      const asset = await this.assetRepository.getByPath(event.object.key)
      if (!asset || asset.status !== AssetStatus.Pending) {
        processedIds.push(msg.lease_id)
        continue
      }

      try {
        await this.assetRepository.updateStatus(asset.id, AssetStatus.Confirmed, {
          size: event.object.size,
        })
        processedIds.push(msg.lease_id)
        this.logger.log(`Asset confirmed via R2 event: ${event.object.key}`)
      }
      catch {
        failed++
      }
    }

    if (processedIds.length > 0) {
      await this.ackMessages(processedIds)
    }

    return { processed: processedIds.length, failed }
  }
}
