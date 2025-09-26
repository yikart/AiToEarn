/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: checkout Checkout
 */
import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { CheckoutRepository } from '@yikart/mongodb'

@Injectable()
export class AdminCheckoutService {
  constructor(
    private readonly checkoutRepository: CheckoutRepository,
  ) {
  }

  // 订单列表
  async list(page: TableDto) {
    const [items, total] = await this.checkoutRepository.listWithPagination({
      page: page.pageNo,
      pageSize: page.pageSize,
    })

    return {
      total,
      list: items,
    }
  }
}
