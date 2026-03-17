import type { CloudWatchLogsClientConfig, Entity } from '@aws-sdk/client-cloudwatch-logs'
import type { DestinationStream } from 'pino'
import * as os from 'node:os'
import { debuglog } from 'node:util'
import { CloudWatchLogsClient, CreateLogGroupCommand, CreateLogStreamCommand, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs'

const log = debuglog('app:cloud-watch:logger')

export interface CloudWatchLoggerOptions extends CloudWatchLogsClientConfig {
  accessKeyId?: string
  secretAccessKey?: string
  group: string
  stream?: string
  entity?: Entity
}

export class CloudWatchLogger implements DestinationStream {
  private readonly client: CloudWatchLogsClient
  private writeQueue: Promise<void> = Promise.resolve()
  private readonly ready: Promise<void>

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

    log('creating logger')

    this.options.stream = options.stream || `${os.hostname()}-${process.pid}-${Date.now()}`

    this.ready = this.createLogGroup().then(() => this.createLogStream())
  }

  async createLogGroup() {
    log(`creating log group: ${this.options.group}`)
    const command = new CreateLogGroupCommand({
      logGroupName: this.options.group,
    })
    await this.client.send(command)
      .catch((e) => {
        log(`creating log group: ${this.options.group} error ${e}`)
        if (e.name !== 'ResourceAlreadyExistsException')
          throw e
      })

    log(`created log group: ${this.options.group}`)
  }

  async createLogStream() {
    log(`creating log stream: ${this.options.stream}`)
    const command = new CreateLogStreamCommand({
      logGroupName: this.options.group,
      logStreamName: this.options.stream,
    })
    await this.client.send(command)
      .catch((e) => {
        log(`creating log stream: ${this.options.stream} error ${e}`)
        if (e.name !== 'ResourceAlreadyExistsException')
          throw e
      })
    log(`created log stream: ${this.options.stream}`)
  }

  async write(msg: string): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      await this.ready

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
      log(`put logs`)
    })

    return this.writeQueue
  }
}
