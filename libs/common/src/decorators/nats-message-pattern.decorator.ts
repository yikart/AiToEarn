import { MessagePattern, Transport } from '@nestjs/microservices'

export function NatsMessagePattern(pattern: string): MethodDecorator {
  return MessagePattern(pattern, Transport.NATS)
}
