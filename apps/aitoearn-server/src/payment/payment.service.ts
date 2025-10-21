import { Injectable, Logger } from '@nestjs/common'
import { AppException } from '@yikart/common'
import { VipStatus } from '@yikart/mongodb'
import * as _ from 'lodash'
import { AccountGroupService } from '../account/accountGroup.service'
import { CloudSpaceService } from '../cloud/core/cloud-space'
import { PointsService } from '../user/points.service'
import { UserService } from '../user/user.service'
import { VipService } from '../user/vip.service'
import { ICheckoutMode, ICheckoutStatus, IFlagTrialPeriodDays, IPayment, IPaymentStatus, IPaymentToUserVip, IPointsDescription } from './api/comment'
import { PaymentNatsApi } from './api/payment.natsApi'
import {
  CheckoutBodyDto,
  CheckoutDto,
  CheckoutListBody,
  ICreateCloudSpace,
  RefundBodyDto,
  SubscriptionBodyDto,
  UnSubscriptionBodyDto,
  WebhookDto,
} from './dto/payment.dto'

@Injectable()
export class PaymentService {
  logger = new Logger(PaymentService.name)
  constructor(
    private readonly paymentNatsApi: PaymentNatsApi,
    private readonly vipService: VipService,
    private readonly pointsService: PointsService,
    private readonly cloudSpaceService: CloudSpaceService,
    private readonly accountGroupService: AccountGroupService,
    private readonly userService: UserService,

  ) {}

  // 获取订单
  async getById(id: string, userId: string) {
    return this.paymentNatsApi.getById(id, userId)
  }

  // 获取价格列表
  async list(body: CheckoutListBody) {
    return this.paymentNatsApi.list(body)
  }

  // 创建订单 // 每笔订单最低总价格必须大约0.5美元
  async create(body: CheckoutBodyDto, userId: string) {
    const userInfo = await this.userService.getUserInfoById(userId)
    const userVipInfo = await this.vipService.getVipInfo(userInfo)
    if (!_.isEmpty(userVipInfo) && _.includes([IPayment.month, IPayment.onceMonth, IPayment.onceYear, IPayment.year], body.payment) && _.includes([VipStatus.active_yearly, VipStatus.active_monthly], userVipInfo.status))
      throw new AppException(1, '账户不存在或者用户在订阅状态不支持重复购买会员')
    if (body.mode === ICheckoutMode.subscription) {
      const userInfo = await this.userService.getUserInfoById(userId)
      body.flagTrialPeriodDays = _.isEmpty(userInfo.vipInfo) ? IFlagTrialPeriodDays.true : IFlagTrialPeriodDays.false
    }
    return this.paymentNatsApi.create(body)
  }

  // 订单退款 // 每笔订单最低总价格必须大约0.5美元
  async refund(body: RefundBodyDto) {
    return this.paymentNatsApi.refund(body)
  }

  // 订阅列表
  async subscription(body: SubscriptionBodyDto) {
    return this.paymentNatsApi.subscription(body)
  }

  // 退订
  async unsubscribe(body: UnSubscriptionBodyDto) {
    const data = await this.paymentNatsApi.unsubscribe(body)
    const userId: any = body.userId
    await this.vipService.setVipInfo(userId, VipStatus.active_nonrenewing)
    return data
  }

  // 回调接口处理会员
  async webhook(body: WebhookDto) {
    const data: any = await this.paymentNatsApi.webhook(body)
    if (_.isEmpty(data) || !_.get(data, 'status'))
      return
    // 根据订单情况处理退款 // 续费
    const { status, metadata } = data
    const { payment } = metadata
    if (_.isEmpty(payment))
      return
    switch (payment) {
      case IPayment.points:
        return this.getHandlePoints(status, data)
      case IPayment.cloudSpaceMonth:
      case IPayment.cloudSpaceOnceMonth:
        return this.getHandleCloudSpaceVip(status, data)
      default:
        return this.getHandleVip(status, data)
    }
  }

  // 根据订单的购买产品来处理这是处理积分
  async getHandlePoints(status: ICheckoutStatus, data: CheckoutDto) {
    const { userId, metadata, quantity } = data
    const { payment } = metadata
    const amount = quantity * 1000
    const description = IPointsDescription[status] + amount
    const type = 'point'
    const body = { userId, metadata, amount, description, type }
    this.logger.log('打印返回值-getHandlePoints', JSON.stringify(body))
    if (!payment)
      return
    switch (status) {
      case ICheckoutStatus.succeeded:
        return this.pointsService.addPoints(body)
      case ICheckoutStatus.refunded:
        return this.pointsService.deductPoints(body)
      default:
    }
  }

  // 根据订单的购买产品来处理这是购买会员
  async getHandleVip(status: ICheckoutStatus, data: CheckoutDto) {
    const { userId, metadata, chargeInfo } = data
    if (!chargeInfo)
      return
    const { payment_status } = chargeInfo
    const { payment } = metadata
    this.logger.log('-- getHandleVip', data)
    if (!payment)
      return
    switch (status) {
      // TODO: 这里后期需要处理试用期
      case ICheckoutStatus.succeeded:
        this.logger.log('-- succeeded', chargeInfo, payment, IPaymentToUserVip[payment])
        return this.vipService.setVipInfo(
          userId,
          !_.isEmpty(chargeInfo) && payment_status !== IPaymentStatus.paid ? VipStatus.trialing : IPaymentToUserVip[payment],
        )
      case ICheckoutStatus.refunded:
        return this.vipService.setVipInfo(
          userId,
          VipStatus.none,
        )
      default:
    }
  }

  async getHandleCloudSpaceVip(status: ICheckoutStatus, data: CheckoutDto) {
    const { metadata, userId } = data
    const { payment, cloudSpace, cloudSpaceId } = metadata
    if (!payment)
      return
    switch (status) {
      case ICheckoutStatus.succeeded:
        if (_.isEmpty(cloudSpace))
          return
        return this.createCloudSpace(userId, cloudSpace, cloudSpaceId)
      // 退款暂时不做
      // case ICheckoutStatus.refunded:
      //   if (!_.isString(cloudSpaceId))
      //     return
      //   return this.cloudSpaceClient.deleteCloudSpace(
      //     { cloudSpaceId },
      //   )
      default:
    }
  }

  async createCloudSpace(userId: string, cloudSpace: ICreateCloudSpace, cloudSpaceId: string | undefined) {
    if (_.isString(cloudSpaceId))
      return this.cloudSpaceService.renewCloudSpace({ cloudSpaceId, month: 1 })
    const { accountGroupName, region } = cloudSpace
    this.logger.log('createCloudSpace', JSON.stringify(cloudSpace))
    const accountGroup = await this.accountGroupService.createAccountGroup({ userId, name: accountGroupName })
    const body = {
      userId,
      accountGroupId: accountGroup.id,
      region,
      month: 1,
    }
    this.logger.log('createGroup', JSON.stringify(body))
    return this.cloudSpaceService.createCloudSpace(body)
  }
}
