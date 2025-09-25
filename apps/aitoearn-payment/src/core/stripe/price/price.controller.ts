import { Controller, Get, Param, Post, Put } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { PriceDto } from './price.dto'
import { PriceService } from './price.service'

@Controller('price')
export class PriceController {
  constructor(
    private readonly priceService: PriceService,
  ) {}

  // 获取价格列表
  @Get()
  async list(
    @Param('product') product: string,
  ) {
    return this.priceService.list(product)
  }

  // 获取价格
  @Get('/:id')
  async getProductById(
    @Param('id') id: string,
  ) {
    return this.priceService.getPriceById(id)
  }

  // 创建价格
  @Post()
  async create(
      @Payload() body: PriceDto,
  ) {
    return this.priceService.create(body)
  }

  // 更新价格
  @Put('/:id')
  async modify(
    @Param('id') id: string,
    @Payload() body: PriceDto,
  ) {
    return this.priceService.modify(id, body)
  }
}
