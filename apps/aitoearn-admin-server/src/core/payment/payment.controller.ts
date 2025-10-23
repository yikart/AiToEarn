import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TableDto } from '@yikart/common'
import {
  CheckoutQueryDto,
  RefundBodyDto,
  SubscriptionBodyDto,
  UnSubscriptionBodyDto,
} from './dto/payment.dto'
import { PaymentService } from './payment.service'

@ApiTags('payment - strip支付中台')
@Controller('payment')
export class PaymentController {
  success_url: string
  cfg: any

  constructor(private readonly paymentService: PaymentService) {}

  @ApiOperation({ summary: '获取订单列表' })
  @Get('checkout/list/:pageNo/:pageSize')
  async list(@Param() param: TableDto, @Query() query: CheckoutQueryDto) {
    return this.paymentService.list(param, query)
  }

  @ApiOperation({ summary: '订单退款' })
  @Post('refund/')
  async refund(@Body() body: RefundBodyDto) {
    return this.paymentService.refund(body)
  }

  @ApiOperation({ summary: '订阅列表' })
  @Get('subscription/list')
  async subscription(@Body() body: SubscriptionBodyDto) {
    return this.paymentService.subscription(body)
  }

  @ApiOperation({ summary: '退订' })
  @Post('unsubscribe/')
  async unsubscribe(@Body() body: UnSubscriptionBodyDto) {
    return this.paymentService.unsubscribe(body)
  }
}
