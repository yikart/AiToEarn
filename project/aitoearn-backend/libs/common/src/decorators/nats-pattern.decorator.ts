import { EventPattern, MessagePattern, Transport } from '@nestjs/microservices'

export function NatsEventPattern(pattern: string): MethodDecorator {
  return EventPattern(pattern, Transport.NATS)
}

export function NatsMessagePattern(pattern: string): MethodDecorator {
  return MessagePattern(pattern, Transport.NATS)
}
