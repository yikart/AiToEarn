import type { DestinationStream } from 'pino'
import crypto from 'node:crypto'
import { Logger } from '@nestjs/common'

export interface FeishuOptions {
  url: string
  secret: string
}
export class FeishuLogger implements DestinationStream {
  private readonly logger = new Logger(FeishuLogger.name)

  constructor(private readonly options: FeishuOptions) {
  }

  async write(msg: string): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000)
    const sign = crypto
      .createHmac('sha256', `${timestamp}\n${this.options.secret}`)
      .digest()
      .toString('base64')

    const content = JSON.parse(msg)
    await fetch(this.options.url, {
      method: 'POST',
      body: JSON.stringify({
        timestamp,
        sign,
        msg_type: 'text',
        content: {
          text: JSON.stringify(content, null, 2),
        },
      }),
    })
      .then(r => r.json())
      .then((r) => {
        if (r.code !== 0) {
          this.logger.error(r)
        }
      })
      .catch(e => this.logger.error(121232, e))
  }
}
