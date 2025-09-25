/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { Injectable } from '@nestjs/common'
import { Stripe } from 'stripe'

@Injectable()
export class ProductService {
  constructor(private readonly stripe: Stripe) {}

  // 获取产品信息
  async getProductById(id: string) {
    return this.stripe.products.retrieve(id)
  }

  // 创建产品
  async create(body: Stripe.ProductCreateParams) {
    return this.stripe.products.create(body)
  }

  // 更新产品
  async modify(id: string, body: Stripe.ProductUpdateParams) {
    return this.stripe.products.update(
      id,
      body,
    )
  }
}
