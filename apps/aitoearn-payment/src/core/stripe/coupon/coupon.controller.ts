import { Body, Controller, Param, Post } from '@nestjs/common'
import { CouponDto, ListCouponDto } from './coupon.dto'
import { CouponService } from './coupon.service'

@Controller('coupon')
export class CouponController {
  constructor(
    private readonly couponService: CouponService,
  ) {}

  // 获取优惠券列表
  // @NatsMessagePattern('admin.coupon.list')
  @Post('admin/coupon/list')
  async list(
    @Body() body: ListCouponDto,
  ) {
    const { page, size } = body
    return this.couponService.list(page, size)
  }

  // 创建优惠券
  // @NatsMessagePattern('admin.coupon.create')
  @Post('admin/coupon/create')
  async create(
    @Body() body: CouponDto,
  ) {
    return this.couponService.create(body)
  }

  // 删除优惠券
  // @NatsMessagePattern('admin.coupon.del')
  @Post('admin/coupon/del')
  async del(
    @Param('id') id: string,
  ) {
    return this.couponService.del(id)
  }
}
