import { MessagePattern } from '@nestjs/microservices'
import { config } from '@/config'

export function NatsMessagePattern(pattern: string): MethodDecorator {
  const prefix = config.nats.prefix
  const fullPattern = prefix ? `${prefix}.${pattern}` : pattern
  return MessagePattern(fullPattern)
}
