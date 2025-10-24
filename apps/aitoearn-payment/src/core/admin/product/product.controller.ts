import { Body, Controller } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { AdminProductService } from './product.service'

@Controller()
export class AdminProductController {
  constructor(private readonly productService: AdminProductService) {}

  // 获取订单列表
  // @NatsMessagePattern('payment.list')
  // @Post('payment/list')
  async list(@Body() data: TableDto) {
    return this.productService.list(data)
  }
}
