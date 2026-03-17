import type { DestinationStream } from 'pino'
import { PassThrough } from 'node:stream'
import PinoPretty from 'pino-pretty'

export class ConsoleLogger implements DestinationStream {
  private readonly stream: PinoPretty.PrettyStream | NodeJS.WriteStream

  constructor(options: PinoPretty.PrettyOptions & { pretty: boolean }) {
    if (!options.pretty) {
      this.stream = new PassThrough()
      this.stream.pipe(process.stdout)
    }
    else {
      this.stream = PinoPretty({ ...options, colorize: true, destination: process.stdout })
    }
  }

  write(msg: string): void {
    this.stream.push(msg)
  }
}
