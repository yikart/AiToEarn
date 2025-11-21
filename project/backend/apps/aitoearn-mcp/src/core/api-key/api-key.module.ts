import { Module } from '@nestjs/common'
import { ApiKeyService } from './api-key.service'

@Module({
  imports: [],
  exports: [ApiKeyService],
})
export class ApiKeyModule { }
