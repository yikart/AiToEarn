/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { ProductRepository } from '@yikart/mongodb'
import { StripeService } from '@yikart/stripe'
import { ProductDto } from './product.dto'

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name)

  constructor(
    private readonly stripeService: StripeService,
    private readonly productRepository: ProductRepository,
  ) {
  }

  // 获取产品信息
  async getProductById(id: string) {
    const result = await this.productRepository.getById(id)
    this.logger.log(result)
    return result
    // return this.productModule.findOneAndUpdate({ id }, product)
  }

  // 创建产品
  async create(body: ProductDto) {
    const result = await this.stripeService.product.create(body)
      .catch((e) => {
        throw new BadRequestException(`创建产品失败${e.message()} `)
      })
    const { id, images, active, name } = result
    const product = { id, images, active, name }
    return await this.productRepository.upsertById(id, product)
  }

  // 更新产品
  async modify(id: string, body: ProductDto) {
    const result = await this.stripeService.product.modify(id, body)
      .catch((e) => {
        throw new BadRequestException(`更新产品失败${e.message()} `)
      })
    const { images, active, name } = result
    const product = { id, images, active, name }
    return await this.productRepository.upsertById(id, product)
    // return this.productModule.findOneAndUpdate({ id: product.id }, product)
  }
}
