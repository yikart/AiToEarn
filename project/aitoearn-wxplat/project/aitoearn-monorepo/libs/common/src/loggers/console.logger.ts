import type { DestinationStream } from 'pino'
import PinoPretty from 'pino-pretty'

export class ConsoleLogger implements DestinationStream {
  private readonly stream: PinoPretty.PrettyStream

  constructor(options: PinoPretty.PrettyOptions) {
    this.stream = PinoPretty({ ...options, colorize: true, destination: process.stdout })
  }

  write(msg: string): void {
    this.stream.push(msg)
  }
}
