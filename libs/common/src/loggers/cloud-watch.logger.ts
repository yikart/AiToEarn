import type { CloudWatchLogsClientConfig, Entity } from '@aws-sdk/client-cloudwatch-logs'
import type { DestinationStream } from 'pino'
import * as os from 'node:os'
import { CloudWatchLogsClient, CreateLogGroupCommand, CreateLogStreamCommand, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs'

export interface CloudWatchLoggerOptions extends CloudWatchLogsClientConfig {
  accessKeyId?: string
  secretAccessKey?: string
  group: string
  stream?: string
  entity?: Entity
}

export class CloudWatchLogger implements DestinationStream {
  private readonly client: CloudWatchLogsClient

  constructor(private readonly options: CloudWatchLoggerOptions) {
    const credentials = options.accessKeyId && options.secretAccessKey
      ? {
          accessKeyId: options.accessKeyId,
          secretAccessKey: options.secretAccessKey,
        }
      : options.credentials
    this.client = new CloudWatchLogsClient({
      ...options,
      credentials,
    })

    this.options.stream = options.stream || `${os.hostname()}-${process.pid}-${Date.now()}`

    this.createLogGroup().then(() => this.createLogStream())
  }

  async createLogGroup() {
    const command = new CreateLogGroupCommand({
      logGroupName: this.options.group,
    })
    return await this.client.send(command)
      .catch((e) => {
        if (e.name !== 'ResourceAlreadyExistsException')
          throw e
      })
  }

  async createLogStream() {
    const command = new CreateLogStreamCommand({
      logGroupName: this.options.group,
      logStreamName: this.options.stream,
    })
    return await this.client.send(command)
      .catch((e) => {
        if (e.name !== 'ResourceAlreadyExistsException')
          throw e
      })
  }

  async write(msg: string): Promise<void> {
    const command = new PutLogEventsCommand({
      logGroupName: this.options.group,
      logStreamName: this.options.stream,
      entity: this.options.entity,
      logEvents: [
        {
          timestamp: Date.now(),
          message: msg,
        },
      ],
    })

    await this.client.send(command)
  }
}
