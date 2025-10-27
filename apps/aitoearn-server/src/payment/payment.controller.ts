import { Body, Controller, Get, Param, Post, Render, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import * as _ from 'lodash'
import { GetToken, Public } from '../auth/auth.guard'
import { TokenInfo } from '../auth/interfaces/auth.interfaces'
import { OrgGuard } from '../common/interceptor/transform.interceptor'
import { config } from '../config'
import {
  CheckoutBodyDto,
  CheckoutListBody,
  RefundBodyDto,
  SubscriptionBodyDto,
  UnSubscriptionBodyDto,
} from './dto/payment.dto'
import { PaymentService } from './payment.service'

@ApiTags('payment - strip支付中台')
@Controller('payment')
export class PaymentController {
  success_url: string

  constructor(
    private readonly paymentService: PaymentService,
  ) {
    this.success_url = config.mailBackHost
  }

  @ApiOperation({ summary: '获取订单列表' })
  @Get('checkout')
  async list(@GetToken() token: TokenInfo, @Body() body: CheckoutListBody) {
    const userId = token.id
    body = _.assign(body || {}, { userId })
    return this.paymentService.list(body)
  }

  @ApiOperation({ summary: '查询订单' })
  @Get('checkout/:id')
  async getById(@GetToken() token: TokenInfo, @Param('id') id: string) {
    const userId = token.id
    return this.paymentService.getById(id, userId)
  }

  @ApiOperation({ summary: '创建订单' })
  @Post('checkout/')
  async create(@GetToken() token: TokenInfo, @Body() body: CheckoutBodyDto) {
    body.success_url = _.isString(body.success_url) ? `${this.success_url}${body.success_url}` : this.success_url
    const userId = token.id
    body.metadata = _.assign({ userId }, body.metadata || {})
    return this.paymentService.create(body, userId)
  }

  @ApiOperation({ summary: '订单退款' })
  @Post('refund/')
  async refund(@GetToken() token: TokenInfo, @Body() body: RefundBodyDto) {
    const userId = token.id
    // 这里添加管理员逻辑
    body = _.assign(body || {}, { userId })
    return this.paymentService.refund(body)
  }

  @ApiOperation({ summary: '订阅列表' })
  @Get('subscription/')
  async subscription(
    @GetToken() token: TokenInfo,
    @Body() body: SubscriptionBodyDto,
  ) {
    const userId = token.id
    body = _.assign(body || {}, { userId })
    return this.paymentService.subscription(body)
  }

  @ApiOperation({ summary: '退订' })
  @Post('unsubscribe/')
  async unsubscribe(
    @GetToken() token: TokenInfo,
    @Body() body: UnSubscriptionBodyDto,
  ) {
    const userId = token.id
    body = _.assign(body || {}, { userId })
    return this.paymentService.unsubscribe(body)
  }

  @Public()
  @Post('webhook/')
  async webhook(
    // @PaymentDomainVerify() verify: object,
    @Body() body: any,
  ) {
    // body = _.assign(verify, body || {});
    return this.paymentService.webhook(body)
  }

  @Public()
  @UseGuards(OrgGuard)
  @Get('success/page')
  @Render('pay/res')
  async paySuccessPage(
  ) {
    return {}
  }
}
