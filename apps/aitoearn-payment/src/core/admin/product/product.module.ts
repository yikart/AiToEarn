import { Module } from '@nestjs/common'
import { AdminProductController } from './product.controller'
import { AdminProductService } from './product.service'

@Module({
  imports: [
  ],
  controllers: [AdminProductController],
  providers: [AdminProductService],
})
export class AdminProductModule {}
