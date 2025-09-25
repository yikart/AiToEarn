import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern, TableDto } from '@yikart/common'
import { AdminProductService } from './product.service'

@Controller()
export class AdminProductController {
  constructor(private readonly productService: AdminProductService) {}

  // 获取订单列表
  @NatsMessagePattern('payment.list')
  async list(@Payload() data: TableDto) {
    return this.productService.list(data)
  }
}
