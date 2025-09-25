/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: checkout Checkout
 */
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { TableDto } from '@yikart/common'
import { Checkout } from '@yikart/mongodb'
import { Model } from 'mongoose'

@Injectable()
export class AdminCheckoutService {
  constructor(
    @InjectModel(Checkout.name) private checkoutModel: Model<Checkout>,
  ) {
  }

  // 订单列表
  async list(page: TableDto) {
    const result = await this.checkoutModel.find(
      {},
      {},
      {
        skip: (page.pageNo - 1) * page.pageSize,
        limit: page.pageSize,
      },
    )

    return {
      total: await this.checkoutModel.countDocuments(),
      list: result,
    }
  }
}
