/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { PriceRepository } from '@yikart/mongodb'
import { StripeService } from '@yikart/stripe'
import { PriceDto } from './price.dto'

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name)

  constructor(
    private readonly stripeService: StripeService,
    private readonly priceRepository: PriceRepository,
  ) {
  }

  // 获取价格信息
  async getPriceById(id: string) {
    const result = await this.stripeService.price.getPriceById(id)
    this.logger.log(result)
    return result
    // return this.resultModule.findOneAndUpdate({ id }, result)
  }

  // 创建价格
  async create(body: PriceDto) {
    const result = await this.stripeService.price.create(body)
      .catch((e) => {
        throw new BadRequestException(`创建产品失败${e.message()} `)
      })
    const { id, unit_amount, active, currency, product, metadata } = result
    let price = { id, currency, active, unit_amount, product, metadata }
    price = await this.priceRepository.upsertById(id, price)
    return price
    // return this.resultModule.findOneAndUpdate({ id: result.id }, result)
  }

  // 更新价格
  async modify(id: string, body: PriceDto) {
    const result = await this.stripeService.price.modify(id, body)
      .catch((e) => {
        throw new BadRequestException(`创建产品失败${e.message()} `)
      })
    const { unit_amount, active, currency, product, metadata } = result
    let price = { currency, active, unit_amount, product, metadata }
    price = await this.priceRepository.upsertById(id, price)
    return price
    // return this.resultModule.findOneAndUpdate({ id: result.id }, result)
  }

  // 获取价格列表
  async list(product: string, size = 100, page = 1) {
    const [list, count] = await this.priceRepository.listWithPagination({
      page,
      pageSize: size,
      product,
    })
    return { list, count }
  }
}
